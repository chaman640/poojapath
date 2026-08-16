/**
 * Intezaar ke niyam ka test — "safal payment kabhi fail na dikhe".
 *
 *   npm run test:payment-wait
 *
 * Yahan asli waqt nahi beetta. `wait` nakli hai, isliye 10 minute ka
 * intezaar millisecond me jaanch liya jata hai.
 */
import { waitForPayment, type PayState } from "../src/lib/payments/wait";

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

/** Script ke hisaab se jawab dene wala nakli server (aakhri jawab dohrata hai) */
function fakeServer(script: PayState[]) {
  let i = 0;
  return {
    ask: async () => {
      const v = script[Math.min(i, script.length - 1)];
      i++;
      return v;
    },
  };
}

const GAP = 4_000;
const PAGE_CHECKS = 150; // payment page 10 minute tak dekhta hai

async function run(
  script: PayState[],
  o: { maxChecks?: number; alive?: () => boolean } = {},
) {
  const server = fakeServer(script);
  let elapsed = 0;
  const seen: number[] = [];
  const out = await waitForPayment({
    maxChecks: o.maxChecks ?? PAGE_CHECKS,
    gapMs: GAP,
    ask: server.ask,
    wait: async (ms) => {
      elapsed += ms;
    },
    alive: o.alive ?? (() => true),
    onCheck: (n) => seen.push(n),
  });
  return { ...out, elapsedMs: elapsed, ticks: seen };
}

console.log("\n🧪 Payment ka intezaar — niyam ki jaanch\n");

/* ---------- 1. ASLI DIKKAT: UPI dheere aaya ---------- *
 * Grahak GPay me paisa de chuka hai, par Razorpay ko abhi khabar nahi.
 * Gateway "koi koshish nahi" bolta hai — bilkul waisa hi jaisa tab bolta
 * hai jab kisi ne payment kiya hi na ho. Yahin par purana code haar
 * maan leta tha aur "payment fail" dikha deta tha.
 */
{
  const { paid, checks } = await run(["none", "none", "none", "none", "pending", "paid"]);
  console.log("1) UPI dheere aaya (gateway pehle khaali, phir paisa)");
  check("paid mila", paid, true);
  check("6 jaanch me pakad liya", checks, 6);
}

/* ---------- 2. Bahut hi dheere — 100 baar khaali, phir paisa ---------- */
{
  const script: PayState[] = Array<PayState>(100).fill("none").concat(["paid"]);
  const { paid, checks } = await run(script);
  console.log("\n2) 100 baar gateway khaali bola, phir paisa aaya");
  check("paid mila", paid, true);
  check("101 jaanch", checks, 101);
}

/* ---------- 3. Razorpay ne pehli koshish 'failed' batayi ---------- *
 * Ek hi order par do koshishein hoti hain. Pehli fail dikhne se doosri
 * safal koshish kabhi nazarandaz nahi honi chahiye.
 */
{
  const script: PayState[] = Array<PayState>(30).fill("failed").concat(["paid"]);
  const { paid, checks } = await run(script);
  console.log("\n3) 30 baar 'failed' dikha, phir paisa aa gaya");
  check("paid mila (fail par ruka hi nahi)", paid, true);
  check("31 jaanch", checks, 31);
}

/* ---------- 4. Sach me kuch nahi hua ---------- */
{
  const { paid, last, checks, elapsedMs } = await run(["none"]);
  console.log("\n4) Grahak ne window band kar di, kuch kiya hi nahi");
  check("paid nahi", paid, false);
  check("gateway ka aakhri jawab bata diya", last, "none");
  check("poore 150 baar dekha", checks, PAGE_CHECKS);
  check("~10 minute tak dekha", elapsedMs, 149 * GAP);
}

/* ---------- 5. Internet gaya ---------- *
 * askServer aise me "pending" deta hai — jhooth nahi bolna chahiye.
 */
{
  const { paid, last } = await run(["pending"]);
  console.log("\n5) Poore samay jawab nahi mila (internet/server dikkat)");
  check("paid nahi", paid, false);
  check("aakhri jawab pending (kabhi 'nahi hua' nahi)", last, "pending");
}

/* ---------- 6. Page band ho gaya ---------- */
{
  let n = 0;
  const { paid, checks } = await run(["none"], {
    alive: () => {
      n++;
      return n < 5;
    },
  });
  console.log("\n6) Page band ho gaya / nayi koshish shuru");
  check("turant ruk gaya", checks < 5, true);
  check("paid nahi (par koi jhoothi fail bhi nahi)", paid, false);
}

/* ---------- 7. Paisa turant mil gaya ---------- */
{
  const { paid, checks, elapsedMs } = await run(["paid"]);
  console.log("\n7) Paisa pehli hi jaanch me confirm");
  check("paid mila", paid, true);
  check("sirf 1 jaanch", checks, 1);
  check("koi der nahi", elapsedMs, 0);
}

/* ---------- 8. Ginti sahi dikhti hai ---------- */
{
  const { ticks } = await run(["none", "none", "paid"]);
  console.log("\n8) Screen par jaanch ki ginti");
  check("1, 2, 3 dikhi", ticks.join(","), "1,2,3");
}

/* ---------- 9. SABSE ZAROORI GUARANTEE ---------- *
 * Kisi bhi haalat me, kahin bhi paisa aata hai to nateeja hamesha paid.
 * Chahe uske pehle kitne bhi "none" / "failed" / "pending" aaye hon.
 */
{
  let bad = 0;
  let tried = 0;
  const noise: PayState[] = ["none", "failed", "pending"];

  for (let where = 0; where <= 40; where++) {
    for (const a of noise) {
      for (const b of noise) {
        const script: PayState[] = [];
        for (let i = 0; i < where; i++) script.push(i % 2 === 0 ? a : b);
        script.push("paid");
        tried++;
        const { paid } = await run(script);
        if (!paid) {
          bad++;
          console.log(`     ✗ [${script.slice(0, 6).join(",")}…] → paid=false`);
        }
      }
    }
  }

  console.log(`\n9) ${tried} alag-alag haalat — har us script me jisme paisa aata hai`);
  check("ek baar bhi paid ko miss nahi kiya", bad, 0);
}

console.log(`\n${fail === 0 ? "✨" : "⚠️"}  ${pass} pass, ${fail} fail\n`);
process.exit(fail === 0 ? 0 : 1);
