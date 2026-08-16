/**
 * Intezaar ke niyam ka test — "safal payment kabhi fail na dikhe".
 *
 *   npx tsx scripts/test-payment-watch.mts
 *
 * Yahan asli waqt nahi beetta. `wait` nakli hai, isliye 3 minute ka
 * intezaar millisecond me jaanch liya jata hai. Har test ek asli haalat
 * hai jo grahak ke saath ho chuki hai ya ho sakti hai.
 */
import { watchForPayment, type PayState } from "../src/lib/payment-watch";

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

/** Ek script ke hisaab se jawab dene wala nakli server */
function fakeServer(script: PayState[]) {
  let i = 0;
  const asked: PayState[] = [];
  return {
    ask: async () => {
      const v = script[Math.min(i, script.length - 1)];
      i++;
      asked.push(v);
      return v;
    },
    get count() {
      return i;
    },
    asked,
  };
}

/** Waqt nakli — turant beet jata hai, par ginti rakhte hain */
function fakeClock() {
  let total = 0;
  return {
    wait: async (ms: number) => {
      total += ms;
    },
    get elapsedMs() {
      return total;
    },
  };
}

const GAP = 5_000;

async function run(script: PayState[], minChecks = 6, maxChecks = 30, alive = () => true) {
  const server = fakeServer(script);
  const clock = fakeClock();
  const ticks: number[] = [];
  const result = await watchForPayment({
    minChecks,
    maxChecks,
    gapMs: GAP,
    ask: server.ask,
    wait: clock.wait,
    alive,
    onTick: (n) => ticks.push(n),
  });
  return { result, checks: server.count, elapsedMs: clock.elapsedMs, ticks };
}

console.log("\n🧪 Payment ka intezaar — niyam ki jaanch\n");

/* ---------- 1. ASLI DIKKAT: UPI dheere aaya ---------- *
 * Grahak GPay me paisa de chuka hai, par Razorpay ko 20 second tak khabar
 * hi nahi. Pehle hum 4.5 second me "payment nahi hua" bol dete the.
 */
{
  const script: PayState[] = ["none", "none", "none", "none", "pending", "paid"];
  const { result, checks } = await run(script);

  console.log("1) UPI dheere aaya (shuru me gateway khaali, phir paisa aaya)");
  check("nateeja = paid", result, "paid");
  check("6 baar poochha (jaldi nahi ruka)", checks, 6);
}

/* ---------- 2. Bahut hi dheere — 12 baar khaali, phir paisa ---------- *
 * Grahak ne GPay khola, thoda time liya, phir approve kiya. Poore ek minute
 * tak Razorpay ke paas kuch darj nahi tha.
 */
{
  const script: PayState[] = [
    "none", "none", "none", "none", "none", "none",
    "none", "none", "none", "none", "none", "none",
    "paid",
  ];
  const { result, checks, elapsedMs } = await run(script);

  console.log("\n2) Ek minute tak gateway khaali, phir paisa aaya");
  check("nateeja = paid", result, "paid");
  check("13 baar poochha", checks, 13);
  check("60 second tak ruka", elapsedMs, 60_000);
}

/* ---------- 3. Halchal dikhi to lambe tak ruko ---------- */
{
  const script: PayState[] = [
    "none", "pending", "pending", "pending", "pending", "pending",
    "pending", "pending", "pending", "pending", "pending", "pending",
    "pending", "pending", "pending", "pending", "pending", "pending",
    "paid",
  ];
  const { result, checks, elapsedMs } = await run(script);

  console.log("\n3) Bank ka jawab bahut der se aaya (19 jaanch baad)");
  check("nateeja = paid", result, "paid");
  check("19 baar poochha", checks, 19);
  check("90 second tak ruka", elapsedMs, 90_000);
}

/* ---------- 4. Sach me payment nahi kiya ---------- */
{
  const { result, checks, elapsedMs } = await run(["none"]);

  console.log("\n4) Grahak ne window band kar di, kuch kiya hi nahi");
  check("nateeja = none", result, "none");
  check("poore 18 baar poochha (jaldi nahi ruka)", checks, 18);
  check("85 second tak dekha", elapsedMs, 85_000);
}

/* ---------- 5. "fail" ek jawab par nahi maanna ---------- *
 * Razorpay pehli koshish ko failed bata sakta hai jabki doosri chal rahi ho.
 */
{
  const script: PayState[] = ["failed", "failed", "failed", "failed", "failed", "pending", "paid"];
  const { result } = await run(script);

  console.log("\n5) Pehli koshish fail dikhi, phir paisa aa gaya");
  check("nateeja = paid (fail par nahi ruka)", result, "paid");
}

/* ---------- 6. Sach me bank ne mana kiya ---------- */
{
  const { result, checks } = await run(["failed"]);

  console.log("\n6) Bank ne sach me mana kar diya");
  check("nateeja = failed", result, "failed");
  check("18 baar poochhne ke baad hi maana", checks, 18);
}

/* ---------- 7. Internet gaya (server jawab hi nahi de raha) ---------- *
 * askServer aise me "pending" deta hai. Jhooth nahi bolna chahiye.
 */
{
  const { result } = await run(["pending"]);

  console.log("\n7) Poore samay jawab nahi mila (internet/server dikkat)");
  check("nateeja = pending (kabhi 'nahi hua' nahi)", result, "pending");
}

/* ---------- 8. Grahak ne khud roka ---------- */
{
  let alive = true;
  let n = 0;
  const server = fakeServer(["none"]);
  const clock = fakeClock();
  const result = await watchForPayment({
    minChecks: 6,
    maxChecks: 30,
    gapMs: GAP,
    ask: async () => {
      n++;
      if (n >= 2) alive = false; // doosri jaanch ke baad "maine payment nahi kiya"
      return server.ask();
    },
    wait: clock.wait,
    alive: () => alive,
  });

  console.log("\n8) Grahak ne 'maine भुगतान nahi kiya' daba diya");
  check("turant ruk gaya", n, 2);
  check("nateeja = pending (jhoothi fail nahi)", result, "pending");
}

/* ---------- 9. Pehli hi jaanch me paisa mil gaya ---------- */
{
  const { result, checks, elapsedMs } = await run(["paid"]);

  console.log("\n9) Paisa turant confirm ho gaya");
  check("nateeja = paid", result, "paid");
  check("sirf 1 baar poochha", checks, 1);
  check("koi der nahi hui", elapsedMs, 0);
}

/* ---------- 10. Sabse zaroori guarantee ---------- *
 * Jis bhi script me kahin bhi "paid" aata hai, nateeja hamesha "paid" hona
 * chahiye — chahe uske pehle kitne bhi "none" ya "failed" aaye hon.
 */
{
  let bad = 0;
  const noise: PayState[] = ["none", "failed", "pending"];

  for (let where = 0; where < 12; where++) {
    for (const fillerA of noise) {
      for (const fillerB of noise) {
        const script: PayState[] = [];
        for (let i = 0; i < where; i++) script.push(i % 2 === 0 ? fillerA : fillerB);
        script.push("paid");
        const { result } = await run(script, 6, 30);
        if (result !== "paid") {
          bad++;
          console.log(`     ✗ [${script.join(",")}] → ${result}`);
        }
      }
    }
  }

  console.log("\n10) 108 alag-alag halaat — har us script me jisme paisa aata hai");
  check("kabhi bhi paid ko fail nahi bataya", bad, 0);
}

console.log(`\n${fail === 0 ? "✨" : "⚠️"}  ${pass} pass, ${fail} fail\n`);
process.exit(fail === 0 ? 0 : 1);
