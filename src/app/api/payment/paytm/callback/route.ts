import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { paytm } from "@/lib/payments";
import { confirmBookingPaid, markBookingFailed } from "@/lib/booking-service";
import { paymentRedirect } from "@/lib/payments/redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Paytm callback.
 *
 * Payment ke baad Paytm khud yahan form POST karta hai (browser ke through).
 * Isliye CSRF check nahi hota — bharosa do cheezon par hai:
 *   1. Paytm ka checksum (CHECKSUMHASH) verify karna
 *   2. Paytm ke server se seedha Transaction Status poochhna
 * Browser se aaye "STATUS" par kabhi bharosa nahi karte.
 */
export async function POST(req: Request) {
  let fields: Record<string, string> = {};
  try {
    const form = await req.formData();
    for (const [k, v] of form.entries()) fields[k] = String(v);
  } catch {
    // kabhi-kabhi JSON bhi aa sakta hai
    try {
      fields = (await req.json()) as Record<string, string>;
    } catch {
      return paymentRedirect(`/track?error=callback`, req);
    }
  }

  const orderId = fields.ORDERID || fields.orderId || "";
  const checksum = fields.CHECKSUMHASH || "";

  if (!orderId) {
    return paymentRedirect(`/track?error=missing-order`, req);
  }

  // 1. Checksum verify
  const checksumOk = paytm.verifySignature({ ...fields }, checksum);
  if (!checksumOk) {
    console.warn("[paytm] checksum mismatch for order", orderId);
    return paymentRedirect(`/booking/${orderId}?verify=failed`, req);
  }

  // 2. Booking dhoondo
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.providerOrderId, orderId))
    .limit(1);

  if (!booking) {
    return paymentRedirect(`/track?error=not-found`, req);
  }

  // 3. Paytm se asli sthiti poochho (server-to-server)
  try {
    const status = await paytm.fetchTransactionStatus(orderId);

    const amountOk =
      status.amountInPaise === null || status.amountInPaise === booking.amountInPaise;

    if (status.success && amountOk) {
      await confirmBookingPaid({
        bookingId: booking.id,
        providerPaymentId: status.txnId,
      });
      return paymentRedirect(`/booking/${booking.bookingCode}`, req);
    }

    if (status.pending) {
      return paymentRedirect(`/booking/${booking.bookingCode}?pending=1`, req);
    }

    await markBookingFailed(booking.id);
    return paymentRedirect(`/booking/${booking.bookingCode}?failed=1`, req);
  } catch (err) {
    console.error("[paytm] status check failed:", err);
    return paymentRedirect(`/booking/${booking.bookingCode}?pending=1`, req);
  }
}

/** Agar koi galti se GET kare to booking page par bhej do */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("ORDERID") ?? url.searchParams.get("orderId");
  return paymentRedirect(orderId ? `/booking/${orderId}` : "/track", req);
}
