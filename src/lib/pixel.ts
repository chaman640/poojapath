/**
 * ══════════════════════════════════════════════════════════════════
 *  Meta Pixel — Facebook/Instagram ko batana ki kya hua
 * ══════════════════════════════════════════════════════════════════
 *
 * Pixel ka faayda aaj nahi, kal hai. Aaj wo chup-chaap ye jama karta hai
 * ki kaun aaya, kisne puja dekhi, kisne paisa diya. Jab 50-100 booking ka
 * data jama ho jata hai, tab Meta khud aise log dhoondhne lagta hai jo
 * pehle wale kharidaron jaise hain — aur wahan se ad ka kharch aadha ho
 * jata hai.
 *
 * Isliye ise **aaj hi** lagana chahiye, chahe ad kal chalayein.
 *
 * ─────────────────────────────────────────────────────────────────
 *  Bina Pixel ID ke kuch nahi hota
 * ─────────────────────────────────────────────────────────────────
 * `NEXT_PUBLIC_META_PIXEL_ID` set nahi hai to poora Pixel band rehta hai —
 * na script load hoti hai, na koi request jati hai. Isliye local par aur
 * test me site bilkul saaf chalti hai.
 *
 * ─────────────────────────────────────────────────────────────────
 *  Niji jaankari kabhi nahi bhejte
 * ─────────────────────────────────────────────────────────────────
 * Grahak ka naam, number, gotra, pata — kuch bhi Meta ko nahi jata.
 * Sirf itna: "kisi ne puja dekhi", "kisi ne ₹201 diya". Booking code bhi
 * nahi bhejte; uski jagah puja ka slug jata hai.
 */

/** Ad manager se mila Pixel ID (15-16 digit ka number) */
export function pixelId(): string {
  return (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim();
}

export function pixelOn(): boolean {
  return /^\d{10,20}$/.test(pixelId());
}

type FbqParams = Record<string, string | number | string[]>;

declare global {
  interface Window {
    fbq?: {
      (...args: unknown[]): void;
      queue?: unknown[];
      loaded?: boolean;
    };
    _fbq?: unknown;
  }
}

/**
 * Ek event bhejo.
 *
 * `eventId` dedupe ke liye hai: agar aage chalkar server se bhi wahi event
 * bheja jaye (Conversions API), to Meta dono ko ek hi maan lega, do nahi.
 */
export function track(event: string, params?: FbqParams, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    if (eventId) window.fbq("track", event, params ?? {}, { eventID: eventId });
    else window.fbq("track", event, params ?? {});
  } catch {
    /* ad blocker ya network — site par koi asar nahi padna chahiye */
  }
}

/**
 * Ek hi event dobara na jaye.
 *
 * Booking page refresh karne par `Purchase` dobara chala jata tha, jisse
 * Ads Manager me nakli bikri dikhne lagti hai — aur usi galat data par
 * Meta aage optimize karta hai. Isliye har booking ka nishaan browser me
 * rakh lete hain.
 */
export function trackOnce(key: string, event: string, params?: FbqParams) {
  if (typeof window === "undefined") return;
  const mark = `pp:px:${event}:${key}`;
  try {
    if (localStorage.getItem(mark)) return;
    localStorage.setItem(mark, "1");
  } catch {
    /* private mode — dedupe nahi ho payega, par event to jana chahiye */
  }
  track(event, params, `${event}-${key}`);
}
