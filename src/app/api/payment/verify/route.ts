import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { isPaymentLive } from "@/lib/payments";
import { bookings } from "@/db/schema";
import { verifyPaymentSchema } from "@/lib/validation";
import { guardPublicPost, jsonError } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fetchPayment, verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { confirmBookingPaid } from "@/lib/booking-service";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const csrf = guardPublicPost(req);
  if (csrf) return csrf;

  const ip = clientIp(req);
  const limit = rateLimit(`verify:${ip}`, { limit: 30, windowMs: 15 * 60_000 });
  if (!limit.ok) return jsonError("Bahut zyada requests.", 429);

  if (!isPaymentLive()) return jsonError("Payment gateway configure nahi hai.", 400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) return jsonError("Payment details adhoore hain.", 400);

  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = parsed.data;

  // 1. Signature verify (HMAC) — sabse pehle
  if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
    console.warn("[payment] signature mismatch for order", orderId);
    return jsonError("Payment verify nahi hua. Support se sampark karein.", 400);
  }

  // 2. Booking dhoondo
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.providerOrderId, orderId))
    .limit(1);

  if (!booking) return jsonError("Booking nahi mili.", 404);

  // 3. Razorpay se asli status aur amount confirm karo (server-to-server)
  try {
    const payment = await fetchPayment(paymentId);
    const amountOk = Number(payment.amount) === booking.amountInPaise;
    const statusOk = payment.status === "captured" || payment.status === "authorized";
    const orderOk = payment.order_id === orderId;

    if (!amountOk || !statusOk || !orderOk) {
      console.warn("[payment] mismatch", {
        orderId,
        amountOk,
        statusOk,
        orderOk,
        status: payment.status,
      });
      return jsonError("Payment confirm nahi hua. Support se sampark karein.", 400);
    }
  } catch (err) {
    console.error("[payment] fetch failed:", err);
    // Signature sahi hai — webhook baad me confirm kar dega
    return NextResponse.json({
      ok: true,
      bookingCode: booking.bookingCode,
      pending: true,
    });
  }

  await confirmBookingPaid({ bookingId: booking.id, providerPaymentId: paymentId });

  return NextResponse.json({ ok: true, bookingCode: booking.bookingCode });
}
