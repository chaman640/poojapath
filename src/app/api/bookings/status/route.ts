import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { jsonError } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { reconcileByBookingCode } from "@/lib/payments/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Mera paisa pahuncha ya nahi?" — browser ye sawaal yahan poochhta hai.
 *
 * Payment window band hone ke baad BookingWizard har kuch second me ye
 * route call karta hai. Har call par hum pehle Razorpay se seedha poochh
 * lete hain (reconcile), phir database ka jawab bhejte hain. Isliye
 * jawab tab bhi sahi aata hai jab Razorpay ka callback ya webhook chuk
 * gaya ho.
 *
 * Sirf booking code chahiye — wahi code jo grahak ke paas pehle se hai
 * aur jisse /booking/<code> page bhi khulta hai. Koi nayi jaankari
 * bahar nahi jati: bas status aur "paisa aaya kya".
 */

/** Ye status matlab paisa aa chuka hai */
const PAID_STATUSES = new Set([
  "PAID",
  "CONFIRMED",
  "PERFORMED",
  "VIDEO_SENT",
  "PRASAD_DISPATCHED",
  "COMPLETED",
]);

/**
 * Razorpay kya keh raha hai, ek shabd me — browser isi se tay karta hai ki
 * aur intezaar karna hai ya nahi.
 *
 *   paid    → paisa aa gaya, booking page khol do
 *   pending → koshish chal rahi hai (ya abhi pata nahi) → intezaar karo
 *   none    → gateway par ek bhi koshish darj nahi → sach me payment nahi hua
 *   failed  → bank ne mana kar diya
 */
function attemptOf(verdict: string | undefined, paid: boolean): "paid" | "pending" | "none" | "failed" {
  if (paid) return "paid";
  if (verdict === "no-attempt" || verdict === "no-order") return "none";
  if (verdict === "failed") return "failed";
  // in-progress, amount-mismatch, error, not-configured, throttled — sab me intezaar hi theek hai
  return "pending";
}

export async function GET(req: Request) {
  const ip = clientIp(req);
  // Ek booking ke peechhe ~30 call lag sakte hain (UPI der karta hai)
  const limit = rateLimit(`booking-status:${ip}`, { limit: 300, windowMs: 15 * 60_000 });
  if (!limit.ok) return jsonError("Bahut zyada requests. Thodi der baad dekhein.", 429);

  const code = (new URL(req.url).searchParams.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(code)) return jsonError("Booking code sahi nahi hai.", 400);

  /**
   * Gateway se seedha poochho — callback/webhook chuk gaya ho to yahin pakda jayega.
   *
   * Throttle sirf 4 second ka, 15 ka nahi: grahak saamne baitha intezaar kar
   * raha hai aur UPI ka jawab 30-60 second bhi le leta hai. 15 second wale
   * throttle me poore intezaar me sirf do baar hi Razorpay tak baat pahunchti
   * thi — isi wajah se dheere aane wale UPI payment "fail" dikh jate the.
   */
  const report = await reconcileByBookingCode(code, { throttleMs: 4_000 }).catch(() => null);

  const [row] = await db
    .select({ status: bookings.status })
    .from(bookings)
    .where(eq(bookings.bookingCode, code))
    .limit(1);

  if (!row) return jsonError("Booking nahi mili.", 404);

  const paid = PAID_STATUSES.has(row.status);

  return NextResponse.json({
    ok: true,
    code,
    status: row.status,
    paid,
    attempt: attemptOf(report?.verdict, paid),
  });
}
