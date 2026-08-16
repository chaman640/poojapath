import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { jsonError } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { reconcileByBookingCode } from "@/lib/payments/reconcile";
import type { PayState } from "@/lib/payments/wait";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Mera paisa pahuncha ya nahi?" — payment page har 4 second ye poochhta hai.
 *
 * Har call par pehle Razorpay se **seedha** poochha jata hai (reconcile),
 * phir database ka jawab bhejte hain. Isliye jawab tab bhi sahi aata hai
 * jab Razorpay ka callback ya webhook chuk gaya ho — ya jab Razorpay ne
 * browser ko kuch bataya hi na ho.
 *
 * Sirf booking code chahiye — wahi code jo grahak ke paas pehle se hai.
 * Koi nayi jaankari bahar nahi jati: bas status.
 */

const PAID_STATUSES = new Set([
  "PAID",
  "CONFIRMED",
  "PERFORMED",
  "VIDEO_SENT",
  "PRASAD_DISPATCHED",
  "COMPLETED",
]);

function stateOf(verdict: string | undefined, paid: boolean): PayState {
  if (paid) return "paid";
  if (verdict === "no-attempt" || verdict === "no-order") return "none";
  if (verdict === "failed") return "failed";
  // in-progress, amount-mismatch, error, not-configured, throttled — intezaar
  return "pending";
}

export async function GET(req: Request) {
  const ip = clientIp(req);
  // Ek booking ke peechhe 40+ call lag sakte hain (UPI der karta hai)
  const limit = rateLimit(`pay-status:${ip}`, { limit: 400, windowMs: 15 * 60_000 });
  if (!limit.ok) return jsonError("Bahut zyada requests. Thodi der baad dekhein.", 429);

  const code = (new URL(req.url).searchParams.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(code)) return jsonError("Booking code sahi nahi hai.", 400);

  // Throttle chhota (3s) — page har 4 second poochhta hai, har poochh
  // sach me Razorpay tak pahunchni chahiye.
  const report = await reconcileByBookingCode(code, { throttleMs: 3_000 }).catch(() => null);

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
    paid,
    state: stateOf(report?.verdict, paid),
  });
}
