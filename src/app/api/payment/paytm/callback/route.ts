import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { siteConfig } from "@/lib/env";
import { paytm } from "@/lib/payments";
import { confirmBookingPaid, markBookingFailed } from "@/lib/booking-service";

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
  const base = siteConfig.url.replace(/\/$/, "");

  let fields: Record<string, string> = {};
  try {
    const form = await req.formData();
    for (const [k, v] of form.entries()) fields[k] = String(v);
  } catch {
    // kabhi-kabhi JSON bhi aa sakta hai
    try {
      fields = (await req.json()) as Record<string, string>;
    } catch {
      return NextResponse.redirect(`${base}/track?error=callback`, 303);
    }
  }

  const orderId = fields.ORDERID || fields.orderId || "";
  const checksum = fields.CHECKSUMHASH || "";

  if (!orderId) {
    return NextResponse.redirect(`${base}/track?error=missing-order`, 303);
  }

  // 1. Checksum verify
  const checksumOk = paytm.verifySignature({ ...fields }, checksum);
  if (!checksumOk) {
    console.warn("[paytm] checksum mismatch for order", orderId);
    return NextResponse.redirect(`${base}/booking/${orderId}?verify=failed`, 303);
  }

  // 2. Booking dhoondo
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.providerOrderId, orderId))
    .limit(1);

  if (!booking) {
    return NextResponse.redirect(`${base}/track?error=not-found`, 303);
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
      return NextResponse.redirect(`${base}/booking/${booking.bookingCode}`, 303);
    }

    if (status.pending) {
      return NextResponse.redirect(
        `${base}/booking/${booking.bookingCode}?pending=1`,
        303,
      );
    }

    await markBookingFailed(booking.id);
    return NextResponse.redirect(
      `${base}/booking/${booking.bookingCode}?failed=1`,
      303,
    );
  } catch (err) {
    console.error("[paytm] status check failed:", err);
    return NextResponse.redirect(
      `${base}/booking/${booking.bookingCode}?pending=1`,
      303,
    );
  }
}

/** Agar koi galti se GET kare to booking page par bhej do */
export async function GET(req: Request) {
  const base = siteConfig.url.replace(/\/$/, "");
  const url = new URL(req.url);
  const orderId = url.searchParams.get("ORDERID") ?? url.searchParams.get("orderId");
  return NextResponse.redirect(orderId ? `${base}/booking/${orderId}` : `${base}/track`, 303);
}
