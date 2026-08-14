import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { confirmBookingPaid, markBookingFailed } from "@/lib/booking-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  if (!orderId) return NextResponse.json({ ok: true, ignored: true });

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.providerOrderId, orderId))
    .limit(1);

  if (!booking) return NextResponse.json({ ok: true, ignored: true });

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
