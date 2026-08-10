import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { bookingSchema, firstError } from "@/lib/validation";
import { guardPublicPost, jsonError } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { generateBookingCode, hashIp, normalizePhone } from "@/lib/utils";
import { isPaymentLive } from "@/lib/env";
import { createOrder } from "@/lib/razorpay";
import { confirmBookingPaid, resolvePujaAndPackage } from "@/lib/booking-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const csrf = guardPublicPost(req);
  if (csrf) return csrf;

  const ip = clientIp(req);
  const limit = rateLimit(`booking:${ip}`, {
    limit: 10,
    windowMs: 60 * 60_000,
    blockMs: 30 * 60_000,
  });
  if (!limit.ok) {
    return jsonError(
      "Bahut zyada requests. Thodi der baad koshish karein.",
      429,
      { retryAfter: limit.retryAfterSeconds },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error), 400);
  const input = parsed.data;

  const phone = normalizePhone(input.phone);
  if (!phone) return jsonError("Sahi 10-digit mobile number daalein.", 400);

  // Puja + package server-side resolve — price kabhi client se nahi lete
  const resolved = await resolvePujaAndPackage(input.pujaSlug, input.packageId);
  if (!resolved) {
    return jsonError("Ye puja ya package ab available nahi hai.", 404);
  }

  if (
    resolved.seatsTotal != null &&
    resolved.seatsBooked >= resolved.seatsTotal
  ) {
    return jsonError("Is puja ki bookings poori ho chuki hain.", 409);
  }

  const memberNames = (input.memberNames ?? [])
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, Math.max(resolved.maxMembers - 1, 0));

  const bookingCode = generateBookingCode();

  const [created] = await db
    .insert(bookings)
    .values({
      bookingCode,
      pujaId: resolved.pujaId,
      packageId: resolved.packageId,
      devoteeName: input.devoteeName,
      gotra: input.gotra,
      phone,
      email: input.email?.trim() || null,
      memberNames,
      sankalp: input.sankalp?.trim() || null,
      addressLine: input.addressLine?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      pincode: input.pincode?.trim() || null,
      amountInPaise: resolved.priceInPaise,
      status: "PENDING_PAYMENT",
      paymentStatus: "NOT_STARTED",
      whatsappOptIn: input.whatsappOptIn ?? true,
      ipHash: hashIp(ip),
    })
    .returning();

  /* ---------- Demo mode: Razorpay keys abhi set nahi hain ---------- */
  if (!isPaymentLive()) {
    await confirmBookingPaid({ bookingId: created.id, demo: true });
    return NextResponse.json({
      ok: true,
      bookingCode: created.bookingCode,
      amountInPaise: created.amountInPaise,
      payment: { mode: "demo" },
    });
  }

  /* ---------- Live: Razorpay order banao ---------- */
  try {
    const order = await createOrder({
      amountInPaise: created.amountInPaise,
      receipt: created.bookingCode,
      notes: {
        bookingCode: created.bookingCode,
        puja: resolved.pujaTitleEn.slice(0, 100),
      },
    });

    await db
      .update(bookings)
      .set({
        razorpayOrderId: order.orderId,
        paymentStatus: "CREATED",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, created.id));

    return NextResponse.json({
      ok: true,
      bookingCode: created.bookingCode,
      amountInPaise: created.amountInPaise,
      payment: {
        mode: "razorpay",
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
      },
    });
  } catch (err) {
    console.error("[razorpay] order create failed:", err);
    return jsonError(
      "Payment gateway se connect nahi ho paya. Thodi der baad koshish karein.",
      502,
    );
  }
}
