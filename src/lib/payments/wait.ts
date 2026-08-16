/**
 * "Paisa aaya kya?" — intezaar ka niyam.
 *
 * Ye file browser aur server dono jagah chal sakti hai, isliye isme na
 * `fetch` hai, na `setTimeout`, na React, na database. Poochhna aur rukna
 * dono bahar se aate hain — isi wajah se iski poori jaanch test me ho
 * jaati hai (`scripts/test-payment-wait.mts`).
 *
 * ══════════════════════════════════════════════════════════════════
 *  Ye niyam itna chhota kyun hai
 * ══════════════════════════════════════════════════════════════════
 *
 * Pehle yahan chalaki thi: "teen baar 'koshish nahi' aaya to maan lo
 * payment hua hi nahi", "do baar 'failed' aaya to bata do". Har chalaki
 * ne ek nayi galti paida ki — kyunki UPI me ek khatarnak khaali waqt
 * hota hai:
 *
 *   Grahak GPay me paisa de chuka hota hai, par Razorpay ko NPCI se
 *   khabar milne me 10 se 60 second lagte hain. Us beech Razorpay kehta
 *   hai "is order par ek bhi koshish darj nahi hai" — bilkul wahi jawab
 *   jo tab aata hai jab grahak ne kuch kiya hi na ho.
 *
 * Bahar se dono halat ek jaisi dikhti hain. Isliye ab ye niyam **koi
 * faisla karta hi nahi**. Wo sirf ek kaam janta hai:
 *
 *     paisa aa gaya → `paid: true`, bas.
 *
 * "Payment nahi hua" jaisa faisla yahan kabhi nahi hota. Wo kaam admin
 * panel ka hai, jahan Razorpay ka poora record saamne hota hai.
 *
 * Isi wajah se ek safal payment ko "fail" batana ab **mumkin hi nahi** —
 * kehne wali line hi maujood nahi hai.
 */

export type PayState =
  /** paisa aa gaya, booking confirm ho chuki */
  | "paid"
  /** koshish chal rahi hai, ya abhi pata nahi */
  | "pending"
  /** gateway par abhi tak ek bhi koshish darj nahi */
  | "none"
  /** bank ne is koshish ko mana kar diya */
  | "failed";

export type WaitOpts = {
  /** Isse zyada baar nahi poochhenge */
  maxChecks: number;
  /** Do jaanch ke beech ka antar */
  gapMs: number;
  /** Server se ek baar poochho */
  ask: () => Promise<PayState>;
  /** Itni der ruko */
  wait: (ms: number) => Promise<void>;
  /** false hote hi sab chhod do (page band, ya nayi koshish shuru) */
  alive: () => boolean;
  /** Har jaanch se pehle — screen par ginti dikhane ke liye */
  onCheck?: (n: number) => void;
};

export type WaitResult = {
  /** Sirf yahi pakka faisla hai */
  paid: boolean;
  /** Aakhri baar gateway ne kya kaha — sirf batane ke liye, faisle ke liye nahi */
  last: PayState;
  /** Kitni baar poochha */
  checks: number;
};

export async function waitForPayment(o: WaitOpts): Promise<WaitResult> {
  let last: PayState = "pending";
  let checks = 0;

  for (let i = 0; i < o.maxChecks; i++) {
    if (!o.alive()) return { paid: false, last, checks };
    if (i > 0) await o.wait(o.gapMs);
    if (!o.alive()) return { paid: false, last, checks };

    checks = i + 1;
    o.onCheck?.(checks);
    last = await o.ask();

    if (last === "paid") return { paid: true, last, checks };
  }

  return { paid: false, last, checks };
}
