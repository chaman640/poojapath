/**
 * Reconcile engine ka test — asli Razorpay ki jagah nakli jawab dete hain.
 *
 * Chalane ka tareeka:  npx tsx scripts/test-reconcile.ts
 *
 * Sandbox se api.razorpay.com tak nahi pahuncha ja sakta, isliye axios ka
 * adapter badal kar Razorpay ke jawab khud bana rahe hain. Iske alawa poora
 * code wahi hai jo production me chalta hai — booking-service, DB, sab kuch.
 */
import "./load-env.ts";

import { createRequire } from "node:module";

// "server-only" Next ke bahar chalne par error phenkta hai — test ke liye khaali kar do
const req = createRequire(import.meta.url);
const serverOnly = req.resolve("server-only");
req.cache[serverOnly] = {
  id: serverOnly,
  filename: serverOnly,
  loaded: true,
  exports: {},
} as unknown as NodeModule;

process.env.RAZORPAY_KEY_ID = "rzp_test_reconcile";
process.env.RAZORPAY_KEY_SECRET = "secret_for_test";
process.env.PAYMENT_PROVIDER = "razorpay";
process.env.WHATSAPP_PROVIDER = "none";

/* ---------------- Nakli Razorpay ---------------- */

type Attempt = { id: string; status: string; amount: number; method?: string; error_description?: string };
const ORDERS: Record<string, Attempt[] | "boom"> = {};

// Razorpay SDK CommonJS axios use karta hai — usi instance ka adapter badalna hai
const cjsAxios = req("axios");
(cjsAxios.default ?? cjsAxios).defaults.adapter = async (config: {
  url?: string;
  [k: string]: unknown;
}) => {
  const url = String(config.url ?? "");
  const m = url.match(/\/orders\/([^/]+)\/payments/);
  if (!m) throw new Error(`test: unexpected call ${url}`);

  const items = ORDERS[m[1]];
  if (items === "boom" || items === undefined) {
    const err = new Error("getaddrinfo ENOTFOUND api.razorpay.com");
    throw err;
  }

  return {
    data: { entity: "collection", count: items.length, items },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
};

/* ---------------- Test ---------------- */

const { db, pool } = await import("../src/db");
const { bookings, packages, pujas } = await import("../src/db/schema");
const { reconcileBooking, cleanupAbandoned } = await import("../src/lib/payments/reconcile");
const { eq } = await import("drizzle-orm");

let pass = 0;
let fail = 0;

function check(name: string, got: unknown, want: unknown) {
  if (got === want) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}\n       mila:    ${String(got)}\n       chahiye: ${String(want)}`);
    fail++;
  }
}

async function makeBooking(opts: {
  orderId: string | null;
  amount: number;
  provider?: string;
  ageHours?: number;
}) {
  const [puja] = await db.select({ id: pujas.id }).from(pujas).limit(1);
  const [pkg] = await db
    .select({ id: packages.id })
    .from(packages)
    .where(eq(packages.pujaId, puja.id))
    .limit(1);

  const created = new Date(Date.now() - (opts.ageHours ?? 0) * 3600_000);

  const [row] = await db
    .insert(bookings)
    .values({
      bookingCode: `TEST-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
      pujaId: puja.id,
      packageId: pkg.id,
      devoteeName: "Test Devotee",
      gotra: "Kashyap",
      phone: "+919876500099",
      amountInPaise: opts.amount,
      packageAmountInPaise: opts.amount,
      status: "PENDING_PAYMENT",
      paymentStatus: "CREATED",
      paymentProvider: opts.provider ?? "razorpay",
      providerOrderId: opts.orderId,
      whatsappOptIn: false,
      createdAt: created,
    })
    .returning();

  return row;
}

async function statusOf(id: string) {
  const [r] = await db
    .select({ s: bookings.status, p: bookings.paymentStatus, pid: bookings.providerPaymentId })
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  return r;
}

const TEST_PHONE = "+919876500099";

// pichhle run ka kachra saaf
await db.delete(bookings).where(eq(bookings.phone, TEST_PHONE));

console.log("\n🧪 Reconcile engine test\n");

/* 1. Paisa mil chuka hai → confirm */
{
  ORDERS["order_paid"] = [
    { id: "pay_ok1", status: "captured", amount: 165100, method: "upi" },
  ];
  const b = await makeBooking({ orderId: "order_paid", amount: 165100 });
  const r = await reconcileBooking(b, { force: true });
  const after = await statusOf(b.id);

  console.log("1) Razorpay: captured");
  check("verdict", r.verdict, "confirmed-now");
  check("booking status", after.s, "CONFIRMED");
  check("payment status", after.p, "CAPTURED");
  check("payment id save hua", after.pid, "pay_ok1");
}

/* 2. Koi koshish hi nahi hui → chhedо mat */
{
  ORDERS["order_empty"] = [];
  const b = await makeBooking({ orderId: "order_empty", amount: 1100 });
  const r = await reconcileBooking(b, { force: true });
  const after = await statusOf(b.id);

  console.log("\n2) Razorpay: koi payment attempt nahi (aapke ₹11 wale case)");
  check("verdict", r.verdict, "no-attempt");
  check("booking pending hi rahi", after.s, "PENDING_PAYMENT");
}

/* 3. Fail hui koshish */
{
  ORDERS["order_failed"] = [
    { id: "pay_bad", status: "failed", amount: 1100, error_description: "Payment was not completed on time" },
  ];
  const b = await makeBooking({ orderId: "order_failed", amount: 1100 });
  const r = await reconcileBooking(b, { force: true });
  const after = await statusOf(b.id);

  console.log("\n3) Razorpay: failed");
  check("verdict", r.verdict, "failed");
  check("booking pending hi rahi", after.s, "PENDING_PAYMENT");
  check("payment status FAILED", after.p, "FAILED");
}

/* 4. Bank ka jawab baaki */
{
  ORDERS["order_created"] = [{ id: "pay_wait", status: "created", amount: 1100 }];
  const b = await makeBooking({ orderId: "order_created", amount: 1100 });
  const r = await reconcileBooking(b, { force: true });
  check("\n4) verdict in-progress", (await Promise.resolve(r.verdict)), "in-progress");
  check("booking pending hi rahi", (await statusOf(b.id)).s, "PENDING_PAYMENT");
}

/* 5. Raashi alag — kabhi confirm mat karo */
{
  ORDERS["order_short"] = [{ id: "pay_short", status: "captured", amount: 100 }];
  const b = await makeBooking({ orderId: "order_short", amount: 165100 });
  const r = await reconcileBooking(b, { force: true });
  const after = await statusOf(b.id);

  console.log("\n5) Razorpay: captured par ₹1 (raashi alag)");
  check("verdict", r.verdict, "amount-mismatch");
  check("booking confirm NAHI hui", after.s, "PENDING_PAYMENT");
}

/* 6. Gateway se baat hi nahi hui */
{
  ORDERS["order_boom"] = "boom";
  const b = await makeBooking({ orderId: "order_boom", amount: 1100 });
  const r = await reconcileBooking(b, { force: true });

  console.log("\n6) Razorpay tak pahuncha hi nahi (network down)");
  check("verdict", r.verdict, "error");
  check("booking chhui tak nahi gayi", (await statusOf(b.id)).s, "PENDING_PAYMENT");
}

/* 7. Order hi nahi bana tha */
{
  const b = await makeBooking({ orderId: null, amount: 1100 });
  const r = await reconcileBooking(b, { force: true });
  console.log("\n7) Order id hi nahi hai");
  check("verdict", r.verdict, "no-order");
}

/* 8. Dobara chalane par kuch nahi badalta (idempotent) */
{
  ORDERS["order_twice"] = [{ id: "pay_twice", status: "captured", amount: 1100 }];
  const b = await makeBooking({ orderId: "order_twice", amount: 1100 });

  const [before] = await db.select({ n: pujas.seatsBooked }).from(pujas).where(eq(pujas.id, b.pujaId));
  const r1 = await reconcileBooking(b, { force: true });
  const fresh = (await db.select().from(bookings).where(eq(bookings.id, b.id)))[0];
  const r2 = await reconcileBooking(fresh, { force: true });
  const [after] = await db.select({ n: pujas.seatsBooked }).from(pujas).where(eq(pujas.id, b.pujaId));

  console.log("\n8) Do baar chalaya (webhook + page load dono aa sakte hain)");
  check("pehli baar changed", r1.changed, true);
  check("doosri baar kuch nahi badla", r2.verdict, "already-done");
  check("seat sirf 1 hi badhi", after.n - before.n, 1);
}

/* 9. Throttle — public page se baar-baar gateway na pite */
{
  ORDERS["order_throttle"] = [];
  const b = await makeBooking({ orderId: "order_throttle", amount: 1100 });
  await reconcileBooking(b); // force nahi
  const again = await reconcileBooking(b); // turant dobara
  console.log("\n9) Turant dobara check (throttle)");
  check("doosri call gateway tak nahi gayi", again.attempts.length === 0 && again.verdict === "in-progress", true);
}

/* 10. Cleanup sirf saaf-saaf abandoned ko hataye */
{
  ORDERS["order_old_empty"] = [];
  ORDERS["order_old_boom"] = "boom";
  ORDERS["order_old_paid"] = [{ id: "pay_old", status: "captured", amount: 1100 }];

  const dead = await makeBooking({ orderId: "order_old_empty", amount: 1100, ageHours: 40 });
  const unknown = await makeBooking({ orderId: "order_old_boom", amount: 1100, ageHours: 40 });
  const paid = await makeBooking({ orderId: "order_old_paid", amount: 1100, ageHours: 40 });

  await cleanupAbandoned(6);

  console.log("\n10) Purani adhuri bookings ki safai");
  check("jiska payment hua hi nahi → CANCELLED", (await statusOf(dead.id)).s, "CANCELLED");
  check("jiska jawab nahi mila → chhua nahi", (await statusOf(unknown.id)).s, "PENDING_PAYMENT");
  check("jiska paisa aaya tha → CONFIRMED (cancel nahi!)", (await statusOf(paid.id)).s, "CONFIRMED");
}

/* ---------------- Safai ---------------- */
await db.delete(bookings).where(eq(bookings.phone, "+919876500099"));

console.log(`\n${fail === 0 ? "✨" : "⚠️"}  ${pass} pass, ${fail} fail\n`);
await pool.end();
process.exit(fail === 0 ? 0 : 1);
