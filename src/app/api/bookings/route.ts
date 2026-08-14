import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookingAddons, bookings } from "@/db/schema";
import { bookingSchema, firstError } from "@/lib/validation";
import { guardPublicPost, jsonError } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { generateBookingCode, hashIp, normalizePhone } from "@/lib/utils";
import { isPaymentLive } from "@/lib/env";
import { createOrder } from "@/lib/razorpay";
import {
  confirmBookingPaid,
  resolveAddons,
  resolvePujaAndPackage,
} from "@/lib/booking-service";

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

  // Add-ons ka daam bhi server par hi jodte hain
  const chosenAddons = await resolveAddons(resolved.pujaId, input.addonIds ?? []);
  const addonsTotal = chosenAddons.reduce((sum, a) => sum + a.priceInPaise, 0);
  const grandTotal = resolved.priceInPaise + addonsTotal;

  // Ghar bhejne wala add-on hai to pata zaroori
  const needsAddress = chosenAddons.some((a) => a.kind === "DELIVERY");
  if (needsAddress) {
    const missing =
      !input.addressLine?.trim() ||
      !input.city?.trim() ||
      !input.state?.trim() ||
      !/^\d{6}$/.test(input.pincode?.trim() ?? "");
    if (missing) {
      return jsonError(
        "Ghar bhejne wale saamaan ke liye poora pata aur 6 digit ka pincode bharna zaroori hai.",
        400,
      );
    }
  }

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
      packageAmountInPaise: resolved.priceInPaise,
      addonsAmountInPaise: addonsTotal,
      amountInPaise: grandTotal,
      status: "PENDING_PAYMENT",
      paymentStatus: "NOT_STARTED",
      whatsappOptIn: input.whatsappOptIn ?? true,
      ipHash: hashIp(ip),
    })
    .returning();

  if (chosenAddons.length > 0) {
    await db.insert(bookingAddons).values(
      chosenAddons.map((a) => ({
        bookingId: created.id,
        addonId: a.id,
        nameEn: a.nameEn,
        nameHi: a.nameHi,
        priceInPaise: a.priceInPaise,
        quantity: 1,
        kind: a.kind,
      })),
    );
  }

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
