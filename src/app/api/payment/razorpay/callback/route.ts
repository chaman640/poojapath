import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { fetchPayment, verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { confirmBookingPaid, markBookingFailed } from "@/lib/booking-service";
import { paymentRedirect } from "@/lib/payments/redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay callback.
 *
 * Payment ke baad Razorpay khud yahan form POST karta hai aur hum user ko
 * booking page par bhej dete hain. Ye tareeka mobile par bharosemand hai —
 * UPI app se wapas aane par bhi redirect nahi tootta (JS handler toot jata tha).
 *
 * CSRF check nahi hota kyunki request bahar se aati hai; iski jagah
 * signature verify + Razorpay se seedha payment fetch hota hai.
 */
export async function POST(req: Request) {
  let fields: Record<string, string> = {};
  try {
    const form = await req.formData();
    for (const [k, v] of form.entries()) fields[k] = String(v);
  } catch {
    try {
      fields = (await req.json()) as Record<string, string>;
    } catch {
      return paymentRedirect(`/track?error=callback`, req);
    }
  }

  const orderId = fields.razorpay_order_id || "";
  const paymentId = fields.razorpay_payment_id || "";
  const signature = fields.razorpay_signature || "";

  /* ---------- Payment fail hua ---------- */
  if (!orderId || !paymentId || !signature) {
    // Razorpay failure par error[metadata] me order id bhejta hai
    let failedOrderId = "";
    try {
      const meta = fields["error[metadata]"];
      if (meta) failedOrderId = (JSON.parse(meta) as { order_id?: string }).order_id ?? "";
    } catch {
      /* ignore */
    }

    if (failedOrderId) {
      const [b] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.providerOrderId, failedOrderId))
        .limit(1);
      if (b) {
        await markBookingFailed(b.id);
        return paymentRedirect(`/booking/${b.bookingCode}?failed=1`, req);
      }
    }
    return paymentRedirect(`/track?error=payment-failed`, req);
  }

  /* ---------- Signature verify ---------- */
  if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
    console.warn("[razorpay] callback signature mismatch for", orderId);
    return paymentRedirect(`/track?error=verify`, req);
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.providerOrderId, orderId))
    .limit(1);

  if (!booking) return paymentRedirect(`/track?error=not-found`, req);

  /* ---------- Razorpay se asli status confirm ---------- */
  try {
    const payment = await fetchPayment(paymentId);
    const amountOk = Number(payment.amount) === booking.amountInPaise;
    const statusOk = payment.status === "captured" || payment.status === "authorized";
    const orderOk = payment.order_id === orderId;

    if (!amountOk || !statusOk || !orderOk) {
      console.warn("[razorpay] callback mismatch", { orderId, amountOk, statusOk, orderOk });
      return paymentRedirect(`/booking/${booking.bookingCode}?pending=1`, req);
    }
  } catch (err) {
    // Signature sahi hai — webhook thodi der me confirm kar dega
    console.error("[razorpay] callback fetch failed:", err);
    return paymentRedirect(`/booking/${booking.bookingCode}?pending=1`, req);
  }

  await confirmBookingPaid({ bookingId: booking.id, providerPaymentId: paymentId });

  return paymentRedirect(`/booking/${booking.bookingCode}?paid=1`, req);
}

/** Kabhi GET aa jaye to booking page par bhej do */
export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("razorpay_order_id");
  if (!orderId) return paymentRedirect(`/track`, req);

  const [booking] = await db
    .select({ code: bookings.bookingCode })
    .from(bookings)
    .where(eq(bookings.providerOrderId, orderId))
    .limit(1);

  return paymentRedirect(booking ? `/booking/${booking.code}` : "/track", req);
}
