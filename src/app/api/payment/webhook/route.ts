import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { confirmBookingPaid, markBookingFailed } from "@/lib/booking-service";
import { recordWebhook } from "@/lib/payments/webhook-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Browser me ye URL kholne par saaf-saaf pata chal jata hai ki
 * Razorpay dashboard me sahi jagah daali gayi hai ya nahi.
 * Koi secret ya niji jaankari yahan nahi jaati.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "razorpay-webhook",
    message:
      "Yehi sahi webhook URL hai. Ise Razorpay Dashboard → Settings → Webhooks me daalein.",
    expects: "POST with x-razorpay-signature",
  });
}

/**
 * Razorpay webhook.
 *
 * Ye endpoint bahar se aata hai isliye CSRF check nahi hota —
 * iski jagah HMAC signature verify hota hai. Bina sahi signature ke
 * koi bhi request reject ho jati hai.
 *
 * Razorpay Dashboard > Settings > Webhooks:
 *   URL:    https://aapka-domain.com/api/payment/webhook
 *   Events: payment.captured, payment.failed, order.paid
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    console.warn("[webhook] invalid signature");
    recordWebhook({
      event: "?",
      ok: false,
      detail: signature
        ? "Signature match nahi hui — Razorpay wala secret aur RAZORPAY_WEBHOOK_SECRET ek jaisa nahi hai."
        : "Signature aayi hi nahi — Razorpay ke webhook me Secret khaali chhoda gaya hai.",
    });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; amount?: number } };
      order?: { entity?: { id?: string } };
    };
  };

  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id ?? event.payload?.order?.entity?.id;
  const eventName = event.event ?? "?";

  if (!orderId) {
    recordWebhook({ event: eventName, ok: true, detail: "Is event me order id nahi thi." });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.providerOrderId, orderId))
    .limit(1);

  if (!booking) {
    recordWebhook({
      event: eventName,
      ok: true,
      detail: `Order ${orderId} ki koi booking nahi mili.`,
    });
    return NextResponse.json({ ok: true, ignored: true });
  }

  recordWebhook({ event: eventName, ok: true, detail: `Booking ${booking.bookingCode}` });

  switch (event.event) {
    case "payment.captured":
    case "order.paid": {
      // amount cross-check
      if (payment?.amount != null && Number(payment.amount) !== booking.amountInPaise) {
        console.warn("[webhook] amount mismatch for", booking.bookingCode);
        return NextResponse.json({ ok: true, ignored: true });
      }
      await confirmBookingPaid({
        bookingId: booking.id,
        providerPaymentId: payment?.id ?? null,
      });
      break;
    }

    case "payment.failed": {
      await markBookingFailed(booking.id);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
