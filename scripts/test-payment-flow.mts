/**
 * Payment ke baad ka poora raasta test — asli route handlers, asli signature.
 *
 *   npx tsx scripts/test-payment-flow.mts
 *
 * Yahan koi nakli booking-logic nahi hai. Wahi callback route aur wahi webhook
 * route chalte hain jo production me chalte hain. Sirf Razorpay ke jawab nakli
 * hain (sandbox se api.razorpay.com tak nahi pahuncha ja sakta).
 */
import "./load-env.ts";

import { createHmac } from "node:crypto";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const serverOnly = req.resolve("server-only");
req.cache[serverOnly] = {
  id: serverOnly,
  filename: serverOnly,
  loaded: true,
  exports: {},
} as unknown as NodeModule;

const KEY_SECRET = "secret_for_test";
process.env.RAZORPAY_KEY_ID = "rzp_live_flowtest";
process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
process.env.RAZORPAY_WEBHOOK_SECRET = "webhook_secret_test";
process.env.PAYMENT_PROVIDER = "razorpay";
process.env.WHATSAPP_PROVIDER = "none";
process.env.NEXT_PUBLIC_SITE_URL = "https://anusthanpooja.site";

/* ---------------- Nakli Razorpay ---------------- */

type Pay = {
  id: string;
  status: string;
  amount: number;
  order_id: string | null;
  method?: string;
};
const PAYMENTS: Record<string, Pay> = {};

const cjsAxios = req("axios");
(cjsAxios.default ?? cjsAxios).defaults.adapter = async (config: {
  url?: string;
  [k: string]: unknown;
}) => {
  const url = String(config.url ?? "");
  const ok = (data: unknown) => ({
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });

  const op = url.match(/\/orders\/([^/?]+)\/payments/);
  if (op) {
    const items = Object.values(PAYMENTS).filter((p) => p.order_id === op[1]);
    return ok({ entity: "collection", count: items.length, items });
  }

  const o = url.match(/\/orders\/([^/?]+)$/);
  if (o) return ok({ id: o[1], receipt: null, notes: {} });

  const p = url.match(/\/payments\/([^/?]+)$/);
  if (p) {
    const found = PAYMENTS[p[1]];
    if (!found) throw new Error("payment not found");
    return ok(found);
  }

  if (/\/payments(\?|$)/.test(url)) {
    return ok({
      entity: "collection",
      count: Object.keys(PAYMENTS).length,
      items: Object.values(PAYMENTS),
    });
  }

  throw new Error(`test: unexpected call ${url}`);
};

/* ---------------- Imports ---------------- */

const { db, pool } = await import("../src/db");
const { bookings, packages, pujas } = await import("../src/db/schema");
const { eq } = await import("drizzle-orm");
const callback = await import("../src/app/api/payment/razorpay/callback/route");
const webhook = await import("../src/app/api/payment/webhook/route");

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

const TEST_PHONE = "+919876500088";
await db.delete(bookings).where(eq(bookings.phone, TEST_PHONE));

async function makeBooking(orderId: string, amount: number) {
  const [puja] = await db.select({ id: pujas.id }).from(pujas).limit(1);
  const [pkg] = await db
    .select({ id: packages.id })
    .from(packages)
    .where(eq(packages.pujaId, puja.id))
    .limit(1);

  const [row] = await db
    .insert(bookings)
    .values({
      bookingCode: `FLOW-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
      pujaId: puja.id,
      packageId: pkg.id,
      devoteeName: "Flow Test",
      gotra: "Kashyap",
      phone: TEST_PHONE,
      amountInPaise: amount,
      packageAmountInPaise: amount,
      status: "PENDING_PAYMENT",
      paymentStatus: "CREATED",
      paymentProvider: "razorpay",
      providerOrderId: orderId,
      whatsappOptIn: false,
    })
    .returning();
  return row;
}

async function statusOf(id: string) {
  const [r] = await db
    .select({ s: bookings.status, p: bookings.paymentStatus })
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  return r;
}

function checkoutSignature(orderId: string, paymentId: string) {
  return createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
}

function formRequest(fields: Record<string, string>) {
  const body = new URLSearchParams(fields).toString();
  return new Request("https://anusthanpooja.site/api/payment/razorpay/callback", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      host: "anusthanpooja.site",
      "x-forwarded-proto": "https",
    },
    body,
  });
}

function webhookRequest(payload: unknown, secret = "webhook_secret_test") {
  const raw = JSON.stringify(payload);
  const sig = createHmac("sha256", secret).update(raw).digest("hex");
  return new Request("https://anusthanpooja.site/api/payment/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "x-razorpay-signature": sig },
    body: raw,
  });
}

console.log("\n🧪 Payment ke baad ka poora raasta\n");

/* ---------- 1. Browser callback: sab kuch sahi ---------- */
{
  const b = await makeBooking("order_cb1", 100);
  PAYMENTS["pay_cb1"] = { id: "pay_cb1", status: "captured", amount: 100, order_id: "order_cb1" };

  const res = await callback.POST(
    formRequest({
      razorpay_order_id: "order_cb1",
      razorpay_payment_id: "pay_cb1",
      razorpay_signature: checkoutSignature("order_cb1", "pay_cb1"),
    }),
  );
  const html = await res.text();
  const after = await statusOf(b.id);

  console.log("1) Razorpay ne callback kiya (₹1, captured)");
  check("HTTP 200", res.status, 200);
  check("booking CONFIRMED", after.s, "CONFIRMED");
  check("redirect booking page par", html.includes(`/booking/${b.bookingCode}`), true);
  check("paid=1 laga", html.includes("paid=1"), true);
}

/* ---------- 2. Callback: signature naqli ---------- */
{
  const b = await makeBooking("order_cb2", 100);
  PAYMENTS["pay_cb2"] = { id: "pay_cb2", status: "captured", amount: 100, order_id: "order_cb2" };

  const res = await callback.POST(
    formRequest({
      razorpay_order_id: "order_cb2",
      razorpay_payment_id: "pay_cb2",
      razorpay_signature: "0".repeat(64),
    }),
  );
  const html = await res.text();

  console.log("\n2) Naqli signature ke saath callback");
  check("booking confirm NAHI hui", (await statusOf(b.id)).s, "PENDING_PAYMENT");
  check("track par bheja gaya", html.includes("/track?error=verify"), true);
}

/* ---------- 3. Callback: payment abhi 'created' hai ---------- */
{
  const b = await makeBooking("order_cb3", 100);
  PAYMENTS["pay_cb3"] = { id: "pay_cb3", status: "created", amount: 100, order_id: "order_cb3" };

  const res = await callback.POST(
    formRequest({
      razorpay_order_id: "order_cb3",
      razorpay_payment_id: "pay_cb3",
      razorpay_signature: checkoutSignature("order_cb3", "pay_cb3"),
    }),
  );
  const html = await res.text();

  console.log("\n3) Callback aaya par Razorpay abhi 'created' keh raha hai");
  check("booking pending hi rahi", (await statusOf(b.id)).s, "PENDING_PAYMENT");
  check("pending=1 dikhaya", html.includes("pending=1"), true);
}

/* ---------- 4. Webhook: payment.captured ---------- */
{
  const b = await makeBooking("order_wh1", 100);
  const res = await webhook.POST(
    webhookRequest({
      event: "payment.captured",
      payload: {
        payment: { entity: { id: "pay_wh1", order_id: "order_wh1", amount: 100 } },
      },
    }),
  );

  console.log("\n4) Webhook: payment.captured");
  check("HTTP 200", res.status, 200);
  check("booking CONFIRMED", (await statusOf(b.id)).s, "CONFIRMED");
}

/* ---------- 5. Webhook: order.paid ---------- */
{
  const b = await makeBooking("order_wh2", 100);
  const res = await webhook.POST(
    webhookRequest({
      event: "order.paid",
      payload: {
        payment: { entity: { id: "pay_wh2", order_id: "order_wh2", amount: 100 } },
        order: { entity: { id: "order_wh2" } },
      },
    }),
  );

  console.log("\n5) Webhook: order.paid");
  check("HTTP 200", res.status, 200);
  check("booking CONFIRMED", (await statusOf(b.id)).s, "CONFIRMED");
}

/* ---------- 6. Webhook: galat secret ---------- */
{
  const b = await makeBooking("order_wh3", 100);
  const res = await webhook.POST(
    webhookRequest(
      {
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_wh3", order_id: "order_wh3", amount: 100 } } },
      },
      "GALAT_SECRET",
    ),
  );

  console.log("\n6) Webhook galat secret ke saath (Render me secret alag ho to yahi hoga)");
  check("HTTP 401", res.status, 401);
  check("booking pending hi rahi", (await statusOf(b.id)).s, "PENDING_PAYMENT");
}

/* ---------- 7. Webhook: raashi alag ---------- */
{
  const b = await makeBooking("order_wh4", 165100);
  await webhook.POST(
    webhookRequest({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_wh4", order_id: "order_wh4", amount: 100 } } },
    }),
  );

  console.log("\n7) Webhook me raashi alag");
  check("booking confirm NAHI hui", (await statusOf(b.id)).s, "PENDING_PAYMENT");
}

/* ---------- 8. Webhook + callback dono aa gaye ---------- */
{
  const b = await makeBooking("order_both", 100);
  PAYMENTS["pay_both"] = {
    id: "pay_both",
    status: "captured",
    amount: 100,
    order_id: "order_both",
  };

  const [before] = await db
    .select({ n: pujas.seatsBooked })
    .from(pujas)
    .where(eq(pujas.id, b.pujaId));

  await webhook.POST(
    webhookRequest({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_both", order_id: "order_both", amount: 100 } } },
    }),
  );
  await callback.POST(
    formRequest({
      razorpay_order_id: "order_both",
      razorpay_payment_id: "pay_both",
      razorpay_signature: checkoutSignature("order_both", "pay_both"),
    }),
  );

  const [after] = await db
    .select({ n: pujas.seatsBooked })
    .from(pujas)
    .where(eq(pujas.id, b.pujaId));

  console.log("\n8) Webhook aur callback dono aaye");
  check("booking CONFIRMED", (await statusOf(b.id)).s, "CONFIRMED");
  check("seat sirf 1 hi badhi", after.n - before.n, 1);
}

/* ---------- 9. Callback ka GET (Razorpay kabhi GET bhi karta hai) ---------- */
{
  const b = await makeBooking("order_get", 100);
  const res = await callback.GET(
    new Request(
      "https://anusthanpooja.site/api/payment/razorpay/callback?razorpay_order_id=order_get",
      { headers: { host: "anusthanpooja.site", "x-forwarded-proto": "https" } },
    ),
  );
  const html = await res.text();

  console.log("\n9) Callback par GET aaya");
  check("HTTP 200", res.status, 200);
  check("sahi booking page par bheja", html.includes(`/booking/${b.bookingCode}`), true);
}

/* ---------- 10. Webhook URL browser me kholna ---------- */
{
  const res = await webhook.GET();
  const json = (await res.json()) as { endpoint?: string };
  console.log("\n10) Webhook URL browser me kholne par");
  check("HTTP 200", res.status, 200);
  check("sahi endpoint bataya", json.endpoint, "razorpay-webhook");
}

await db.delete(bookings).where(eq(bookings.phone, TEST_PHONE));
console.log(`\n${fail === 0 ? "✨" : "⚠️"}  ${pass} pass, ${fail} fail\n`);
await pool.end();
process.exit(fail === 0 ? 0 : 1);
