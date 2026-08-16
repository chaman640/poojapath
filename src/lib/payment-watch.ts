/**
 * Payment ke baad "paisa aaya kya?" ka peechha karne wala dimaag.
 *
 * Ye file jaan-boojh kar alag rakhi gayi hai aur bilkul saadi hai — na
 * `fetch`, na `setTimeout`, na React. Poochhna aur rukna dono bahar se
 * diye jate hain. Isi wajah se iski poori jaanch test me ho sakti hai
 * (dekhein `scripts/test-payment-watch.mts`) — aur yahi wo hissa hai
 * jiski galti se safal payment "fail" dikh jata tha.
 *
 * ─────────────────────────────────────────────────────────────────
 * UPI ka khaali waqt
 * ─────────────────────────────────────────────────────────────────
 * Grahak GPay me paisa de chuka hota hai, par Razorpay ko NPCI se khabar
 * milne me 10 se 60 second lag jate hain. Us beech me Razorpay se poochho
 * to wo kehta hai: "is order par ek bhi koshish darj nahi hai" — bilkul
 * wahi jawab jo tab aata hai jab grahak ne bina paise diye window band
 * ki ho. Dono halat bahar se ek jaisi dikhti hain.
 *
 * Isliye niyam ye hai: **jaldi kabhi mat ruko.**
 *   • kam se kam `minChecks` baar poochho, chahe jawab kuch bhi ho
 *   • beech me zara si bhi halchal dikhi to `maxChecks` tak ruko
 *   • "fail" ek jawab par mat maano — do lagatar chahiye
 */

export type PayState = "paid" | "pending" | "none" | "failed";

/**
 * "Koshish hi nahi hui" maanne se pehle kam se kam itni jaanch.
 * 18 × 5 second = 85 second. UPI collect me grahak ko apne app me approve
 * karne ka poora mauka mil jata hai.
 */
export const NONE_AFTER = 18;

/**
 * "Bank ne mana kar diya" maanne se pehle kam se kam itni jaanch.
 * Razorpay pehli koshish ko `failed` bata deta hai jabki grahak ki doosri
 * koshish chal rahi hoti hai — isliye yahan bhi jaldbaazi nahi.
 */
export const FAILED_AFTER = 18;

export type WatchOpts = {
  /** Itni baar to poochhna hi hai, chahe gateway kuch bhi kahe */
  minChecks: number;
  /** Isse zyada nahi */
  maxChecks: number;
  /** Do jaanch ke beech ka antar */
  gapMs: number;
  /** "koshish hi nahi hui" maanne se pehle itni jaanch */
  noneAfter?: number;
  /** "bank ne mana kiya" maanne se pehle itni jaanch */
  failedAfter?: number;
  /** Server se ek baar poochho */
  ask: () => Promise<PayState>;
  /** Itni der ruko */
  wait: (ms: number) => Promise<void>;
  /** false hote hi sab chhod do (user ne "maine payment nahi kiya" daba diya) */
  alive: () => boolean;
  /** Har jaanch se pehle — screen par ginti dikhane ke liye */
  onTick?: (n: number) => void;
};

export async function watchForPayment(o: WatchOpts): Promise<PayState> {
  const noneAfter = Math.max(o.minChecks, o.noneAfter ?? NONE_AFTER);
  const failedAfter = Math.max(o.minChecks, o.failedAfter ?? FAILED_AFTER);

  let sawAttempt = false;
  let failedInARow = 0;

  for (let i = 0; i < o.maxChecks; i++) {
    if (!o.alive()) return "pending";
    if (i > 0) await o.wait(o.gapMs);
    if (!o.alive()) return "pending";

    o.onTick?.(i + 1);
    const state = await o.ask();

    // Paisa mil gaya — bas, yahin khatam
    if (state === "paid") return "paid";

    if (state === "failed") {
      failedInARow++;
      sawAttempt = true;
    } else {
      failedInARow = 0;
      if (state === "pending") sawAttempt = true;
    }

    const n = i + 1;

    // Bank ne mana kiya — teen lagatar jawab chahiye, aur wo bhi der tak dekhne ke baad
    if (n >= failedAfter && failedInARow >= 3) return "failed";

    // Shuru se ab tak gateway par ek bhi koshish darj nahi hui
    if (n >= noneAfter && !sawAttempt && state === "none") return "none";
  }

  // Waqt khatam. Halchal dikhi thi to "pending" — kabhi "nahi hua" mat kaho.
  return sawAttempt ? "pending" : "none";
}
