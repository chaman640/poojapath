import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookingEvents, bookings, packages, pujas } from "@/db/schema";
import type { BookingStatus } from "@/db/schema";
import { sendBookingConfirmation, sendStatusUpdate } from "./whatsapp";
import { siteConfig } from "./env";
import { formatDate, formatINR } from "./utils";

export const STATUS_TEXT: Record<BookingStatus, { en: string; hi: string }> = {
  PENDING_PAYMENT: { en: "Payment pending", hi: "भुगतान बाकी" },
  PAID: { en: "Payment received", hi: "भुगतान प्राप्त" },
  CONFIRMED: { en: "Booking confirmed", hi: "बुकिंग कन्फर्म" },
  PERFORMED: { en: "Puja performed", hi: "पूजा संपन्न" },
  VIDEO_SENT: { en: "Puja video shared", hi: "पूजा वीडियो भेजा गया" },
  PRASAD_DISPATCHED: { en: "Prasad dispatched", hi: "प्रसाद भेजा गया" },
  COMPLETED: { en: "Completed", hi: "पूर्ण" },
  CANCELLED: { en: "Cancelled", hi: "रद्द" },
  REFUNDED: { en: "Refunded", hi: "राशि वापस" },
};

export function trackUrl(code: string) {
  return `${siteConfig.url}/booking/${code}`;
}

/**
 * Payment safal hone ke baad booking confirm karta hai.
 * Idempotent hai — dobara call hone par kuch nahi badalta
 * (Razorpay webhook aur browser callback dono aa sakte hain).
 */
export async function confirmBookingPaid(params: {
  bookingId: string;
  razorpayPaymentId?: string | null;
  demo?: boolean;
}): Promise<{ changed: boolean }> {
  const { bookingId, razorpayPaymentId, demo } = params;

  const updated = await db
    .update(bookings)
    .set({
      status: "CONFIRMED",
      paymentStatus: demo ? "DEMO_SKIPPED" : "CAPTURED",
      razorpayPaymentId: razorpayPaymentId ?? undefined,
      updatedAt: new Date(),
    })
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.status, "PENDING_PAYMENT")),
    )
    .returning();

  if (updated.length === 0) return { changed: false };

  const booking = updated[0];

  // seat count badhao
  await db
    .update(pujas)
    .set({ seatsBooked: sql`${pujas.seatsBooked} + 1` })
    .where(eq(pujas.id, booking.pujaId));

  await db.insert(bookingEvents).values({
    bookingId: booking.id,
    status: "CONFIRMED",
    messageEn: "Payment received and your booking is confirmed. Your name and gotra will be taken in the sankalp.",
    messageHi: "भुगतान प्राप्त हुआ और आपकी बुकिंग कन्फर्म हो गई। संकल्प में आपका नाम व गोत्र लिया जाएगा।",
  });

  // WhatsApp confirmation (agar opt-in kiya hai)
  if (booking.whatsappOptIn) {
    const [detail] = await db
      .select({
        pujaTitleEn: pujas.titleEn,
        pujaDate: pujas.pujaDate,
      })
      .from(pujas)
      .where(eq(pujas.id, booking.pujaId))
      .limit(1);

    await sendBookingConfirmation({
      phone: booking.phone,
      name: booking.devoteeName,
      bookingCode: booking.bookingCode,
      pujaTitle: detail?.pujaTitleEn ?? "Puja",
      pujaDate: detail ? formatDate(detail.pujaDate, "en") : "",
      amount: formatINR(booking.amountInPaise),
      trackUrl: trackUrl(booking.bookingCode),
    });
  }

  return { changed: true };
}

export async function markBookingFailed(bookingId: string) {
  await db
    .update(bookings)
    .set({ paymentStatus: "FAILED", updatedAt: new Date() })
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.status, "PENDING_PAYMENT")),
    );
}

/** Admin panel se status badalna + optional WhatsApp update */
export async function changeBookingStatus(params: {
  bookingId: string;
  status: BookingStatus;
  videoUrl?: string | null;
  prasadTracking?: string | null;
  adminNote?: string | null;
  notify: boolean;
}) {
  const { bookingId, status, videoUrl, prasadTracking, adminNote, notify } = params;

  const [booking] = await db
    .update(bookings)
    .set({
      status,
      videoUrl: videoUrl ?? undefined,
      prasadTracking: prasadTracking ?? undefined,
      adminNote: adminNote ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  if (!booking) return null;

  const label = STATUS_TEXT[status];

  const detailEn =
    status === "VIDEO_SENT" && videoUrl
      ? `Video link: ${videoUrl}`
      : status === "PRASAD_DISPATCHED" && prasadTracking
        ? `Tracking: ${prasadTracking}`
        : (adminNote ?? "");
  const detailHi =
    status === "VIDEO_SENT" && videoUrl
      ? `वीडियो लिंक: ${videoUrl}`
      : status === "PRASAD_DISPATCHED" && prasadTracking
        ? `ट्रैकिंग: ${prasadTracking}`
        : (adminNote ?? "");

  await db.insert(bookingEvents).values({
    bookingId: booking.id,
    status,
    messageEn: detailEn || label.en,
    messageHi: detailHi || label.hi,
    notified: notify && booking.whatsappOptIn,
  });

  if (notify && booking.whatsappOptIn) {
    await sendStatusUpdate({
      phone: booking.phone,
      name: booking.devoteeName,
      bookingCode: booking.bookingCode,
      statusText: label.en,
      detail: detailEn || label.en,
      trackUrl: trackUrl(booking.bookingCode),
    });
  }

  return booking;
}

/** Package aur puja server-side validate karo — kabhi client ki price par bharosa mat karo */
export async function resolvePujaAndPackage(pujaSlug: string, packageId: string) {
  const [row] = await db
    .select({
      pujaId: pujas.id,
      pujaTitleEn: pujas.titleEn,
      pujaDate: pujas.pujaDate,
      seatsTotal: pujas.seatsTotal,
      seatsBooked: pujas.seatsBooked,
      packageId: packages.id,
      priceInPaise: packages.priceInPaise,
      maxMembers: packages.maxMembers,
    })
    .from(pujas)
    .innerJoin(packages, eq(packages.pujaId, pujas.id))
    .where(
      and(
        eq(pujas.slug, pujaSlug),
        eq(pujas.isActive, true),
        eq(packages.id, packageId),
        eq(packages.isActive, true),
      ),
    )
    .limit(1);

  return row ?? null;
}
