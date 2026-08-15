import "server-only";

import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { confirmBookingPaid, markBookingFailed } from "../booking-service";
import * as razorpay from "./razorpay";
import * as paytm from "./paytm";

/**
 * ------------------------------------------------------------------
 *  Reconciliation — "payment ho gaya par booking pending dikh rahi hai"
 *  ka pakka ilaaj.
 * ------------------------------------------------------------------
 *
 * Booking confirm hone ke teen raaste hain:
 *   1. Browser callback  — user payment ke baad wapas site par aata hai
 *   2. Webhook           — Razorpay khud humein batata hai
 *   3. Reconcile (ye)    — hum khud gateway se poochhte hain
 *
 * Pehle do raaste toot sakte hain: mobile par UPI app se wapas na aana,
 * net kat jana, webhook dashboard me register na hona, ya webhook secret
 * galat hona. Isliye teesra raasta sabse zaroori hai — jab bhi koi
 * pending booking dikhayi jati hai (booking page, track page, admin),
 * hum seedha gateway se poochh lete hain ki paisa aaya ya nahi.
 *
 * Faisla hamesha gateway ke jawab se hota hai, browser se aayi kisi
 * jaankari se nahi.
 */

export type ReconcileVerdict =
  | "already-done" // booking pehle hi confirm hai
  | "confirmed-now" // gateway ne paisa mila bataya → abhi confirm kiya
  | "in-progress" // payment shuru hui hai, bank ka jawab baaki hai
  | "no-attempt" // is order par koi payment koshish hui hi nahi
  | "failed" // koshish hui par fail ho gayi
  | "amount-mismatch" // paisa aaya par galat raashi — haath se dekhna padega
  | "no-order" // order hi nahi bana (gateway tak baat nahi pahunchi)
  | "not-configured" // is provider ki keys server par nahi hain
  | "demo" // demo mode ki booking
  | "error"; // gateway se baat nahi ho payi

export type ReconcileReport = {
  bookingId: string;
  bookingCode: string;
  verdict: ReconcileVerdict;
  changed: boolean;
  /** Admin ko dikhane laayak seedhi baat */
  message: string;
  provider: string;
  orderId: string | null;
  paymentId: string | null;
  attempts: razorpay.OrderPayment[];
};

type BookingRow = typeof bookings.$inferSelect;

/* ------------------------------------------------------------------ */
/*  Throttle — public page se baar-baar gateway na pitein             */
/* ------------------------------------------------------------------ */

const lastChecked = new Map<string, number>();
const THROTTLE_MS = 15_000;

function throttled(bookingId: string, now: number): boolean {
  const prev = lastChecked.get(bookingId);
  if (prev && now - prev < THROTTLE_MS) return true;
  lastChecked.set(bookingId, now);
  // map ko chhota rakho
  if (lastChecked.size > 500) {
    for (const [k, v] of lastChecked) {
      if (now - v > 10 * 60_000) lastChecked.delete(k);
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Ek booking                                                         */
/* ------------------------------------------------------------------ */

export async function reconcileBooking(
  booking: BookingRow,
  opts?: { force?: boolean },
): Promise<ReconcileReport> {
  const base = {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    changed: false,
    provider: booking.paymentProvider,
    orderId: booking.providerOrderId,
    paymentId: booking.providerPaymentId,
    attempts: [] as razorpay.OrderPayment[],
  };

  if (booking.status !== "PENDING_PAYMENT") {
    return { ...base, verdict: "already-done", message: "Booking pehle hi confirm hai." };
  }

  if (booking.paymentProvider === "none") {
    return {
      ...base,
      verdict: "demo",
      message: "Demo mode ki booking — koi payment gateway juda nahi tha.",
    };
  }

  if (!booking.providerOrderId) {
    return {
      ...base,
      verdict: "no-order",
      message:
        "Gateway par order bana hi nahi tha — payment window shayad khuli hi nahi. User ko dobara book karne ko kahein.",
    };
  }

  if (!opts?.force && throttled(booking.id, Date.now())) {
    return {
      ...base,
      verdict: "in-progress",
      message: "Abhi-abhi check kiya gaya tha, thodi der me dobara.",
    };
  }

  try {
    if (booking.paymentProvider === "razorpay") {
      return await reconcileRazorpay(booking, base);
    }
    if (booking.paymentProvider === "paytm") {
      return await reconcilePaytm(booking, base);
    }
    return { ...base, verdict: "error", message: `Anjaan provider: ${booking.paymentProvider}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[reconcile] gateway error for", booking.bookingCode, msg);
    return {
      ...base,
      verdict: "error",
      message: `Gateway se baat nahi ho payi: ${msg}`,
    };
  }
}

async function reconcileRazorpay(
  booking: BookingRow,
  base: Omit<ReconcileReport, "verdict" | "message">,
): Promise<ReconcileReport> {
  if (!razorpay.isRazorpayLive()) {
    return {
      ...base,
      verdict: "not-configured",
      message:
        "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET server par set nahi hain — isliye check nahi ho sakta.",
    };
  }

  const attempts = await razorpay.fetchOrderPayments(booking.providerOrderId!);
  const withAttempts = { ...base, attempts };

  const paid = attempts.find(
    (p) => p.status === "captured" || p.status === "authorized",
  );

  if (paid) {
    if (paid.amount !== booking.amountInPaise) {
      console.warn("[reconcile] amount mismatch", booking.bookingCode, paid.amount);
      return {
        ...withAttempts,
        verdict: "amount-mismatch",
        paymentId: paid.id,
        message: `Gateway par ₹${(paid.amount / 100).toFixed(2)} mila par booking ₹${(
          booking.amountInPaise / 100
        ).toFixed(2)} ki hai. Khud dekh kar faisla karein.`,
      };
    }

    const { changed } = await confirmBookingPaid({
      bookingId: booking.id,
      providerPaymentId: paid.id,
    });

    return {
      ...withAttempts,
      verdict: "confirmed-now",
      changed,
      paymentId: paid.id,
      message:
        paid.status === "captured"
          ? "Paisa mil chuka tha — booking ab confirm kar di gayi."
          : "Payment authorize ho chuki thi — booking confirm kar di gayi (capture Razorpay karega).",
    };
  }

  const pendingAttempt = attempts.find(
    (p) => p.status === "created" || p.status === "pending",
  );
  if (pendingAttempt) {
    return {
      ...withAttempts,
      verdict: "in-progress",
      paymentId: pendingAttempt.id,
      message: "Payment shuru hui hai, bank ka jawab abhi baaki hai. Thodi der me dobara dekhein.",
    };
  }

  const failed = attempts.find((p) => p.status === "failed");
  if (failed) {
    await markBookingFailed(booking.id);
    return {
      ...withAttempts,
      verdict: "failed",
      paymentId: failed.id,
      message: `Payment fail hui thi${
        failed.errorDescription ? ` — ${failed.errorDescription}` : ""
      }. Paisa nahi kata. User dobara koshish kar sakta hai.`,
    };
  }

  return {
    ...withAttempts,
    verdict: "no-attempt",
    message:
      "Razorpay par is order ke liye ek bhi payment koshish darj nahi hai — matlab paisa kata hi nahi. User ne payment window band kar di hogi.",
  };
}

async function reconcilePaytm(
  booking: BookingRow,
  base: Omit<ReconcileReport, "verdict" | "message">,
): Promise<ReconcileReport> {
  if (!paytm.isPaytmLive()) {
    return {
      ...base,
      verdict: "not-configured",
      message: "Paytm keys server par set nahi hain — isliye check nahi ho sakta.",
    };
  }

  const status = await paytm.fetchTransactionStatus(booking.providerOrderId!);
  const amountOk =
    status.amountInPaise === null || status.amountInPaise === booking.amountInPaise;

  if (status.success && !amountOk) {
    return {
      ...base,
      verdict: "amount-mismatch",
      paymentId: status.txnId,
      message: `Paytm par raashi alag hai (${status.amountInPaise} paise). Khud dekh kar faisla karein.`,
    };
  }

  if (status.success) {
    const { changed } = await confirmBookingPaid({
      bookingId: booking.id,
      providerPaymentId: status.txnId,
    });
    return {
      ...base,
      verdict: "confirmed-now",
      changed,
      paymentId: status.txnId,
      message: "Paytm par payment safal thi — booking ab confirm kar di gayi.",
    };
  }

  if (status.pending) {
    return {
      ...base,
      verdict: "in-progress",
      message: `Paytm: ${status.resultMsg || "bank ka jawab baaki hai"}.`,
    };
  }

  await markBookingFailed(booking.id);
  return {
    ...base,
    verdict: "failed",
    message: `Paytm: ${status.resultMsg || "payment safal nahi hui"}. Paisa nahi kata.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Aasan wrappers                                                     */
/* ------------------------------------------------------------------ */

export async function reconcileBookingById(
  bookingId: string,
  opts?: { force?: boolean },
): Promise<ReconcileReport | null> {
  const [row] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!row) return null;
  return reconcileBooking(row, opts);
}

/**
 * Booking page khulte hi chalta hai. Chup-chaap — agar gateway se baat
 * na ho paye to user ko kuch nahi dikhta, page normal khulta hai.
 */
export async function reconcileByBookingCode(code: string): Promise<ReconcileReport | null> {
  const [row] = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.bookingCode, code.toUpperCase()),
        eq(bookings.status, "PENDING_PAYMENT"),
      ),
    )
    .limit(1);

  if (!row) return null;
  return reconcileBooking(row).catch(() => null);
}

/**
 * Track page: ek number ki jitni bhi bookings pending hain (haal hi ki),
 * sabko gateway se check kar lo — taaki list me sahi status dikhe.
 */
export async function reconcilePendingForPhone(phone: string, limit = 6): Promise<void> {
  const rows = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.phone, phone),
        eq(bookings.status, "PENDING_PAYMENT"),
        sql`${bookings.createdAt} > now() - interval '14 days'`,
      ),
    )
    .orderBy(desc(bookings.createdAt))
    .limit(limit);

  if (rows.length === 0) return;

  await Promise.all(rows.map((r) => reconcileBooking(r).catch(() => null)));
}

/** Admin page ke liye — saari pending bookings ek saath */
export async function reconcileAllPending(limit = 25): Promise<ReconcileReport[]> {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.status, "PENDING_PAYMENT"))
    .orderBy(desc(bookings.createdAt))
    .limit(limit);

  const out: ReconcileReport[] = [];
  for (const row of rows) {
    out.push(await reconcileBooking(row, { force: true }));
  }
  return out;
}

/**
 * Purani adhuri bookings hatana.
 *
 * Sirf wahi hatti hain jinke baare me gateway ne saaf kaha ho ki koi
 * payment nahi hui ("no-attempt" ya "failed") aur jo kaafi purani ho
 * chuki hain. Jinka jawab nahi mila unhein haath nahi lagate — kabhi
 * bhi kisi asli payment wali booking ko cancel nahi karna hai.
 */
export async function cleanupAbandoned(olderThanHours = 6): Promise<number> {
  const rows = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "PENDING_PAYMENT"),
        lt(bookings.createdAt, new Date(Date.now() - olderThanHours * 3600_000)),
      ),
    )
    .limit(100);

  const doomed: string[] = [];
  for (const row of rows) {
    const report = await reconcileBooking(row, { force: true }).catch(() => null);
    if (report && (report.verdict === "no-attempt" || report.verdict === "failed")) {
      doomed.push(row.id);
    }
  }

  if (doomed.length === 0) return 0;

  await db
    .update(bookings)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(inArray(bookings.id, doomed), eq(bookings.status, "PENDING_PAYMENT")));

  return doomed.length;
}
