"use client";

import { useEffect, useRef, useState } from "react";
import { waitForPayment, type PayState } from "@/lib/payments/wait";
import { track } from "@/lib/pixel";

/**
 * Payment page ka chalta-phirta hissa.
 *
 * ══════════════════════════════════════════════════════════════════
 *  Ek hi bada niyam
 * ══════════════════════════════════════════════════════════════════
 *
 *   **Razorpay se kuch bhi ummeed mat rakho.**
 *
 * Purani design me hum Razorpay ke batane ka intezaar karte the — kabhi
 * `callback_url`, kabhi `handler`, kabhi window band hone ka. Teeno chuk
 * sakte hain, aur asli phone par chuke bhi:
 *
 *   • `callback_url` tabhi chalta hai jab domain Razorpay account me
 *     darj ho — warna wo chup-chaap window band kar deta hai
 *   • UPI app na khul paye ("Can't open payment app") to Razorpay apni
 *     "Processing your payment…" screen par hi atka reh jata hai — na
 *     handler, na dismiss
 *   • browser tab hi khali ho jaye to koi JS bacha hi nahi
 *
 * Isliye ab jaanch Razorpay se judi hi nahi hai. **Page khulte hi** har
 * 4 second par apne server se poochhna shuru ho jata hai, aur page khula
 * rehne tak chalta rehta hai. Server har baar Razorpay se seedha confirm
 * karta hai. Paisa aate hi booking page — jahan WhatsApp khud khulta hai.
 *
 * Aur agar tab khali bhi ho gaya, to is page ka apna pata hai
 * (`/pay/PP-...`) — Back dabao, jaanch phir se chalu.
 */

const POLL_MS = 4_000;

/** Ek page-khulne par itni jaanch = 10 minute. Uske baad "jaari rakhein" button. */
const MAX_CHECKS = 150;

type PaytmCheckout = {
  onLoad: (cb: () => void) => void;
  init: (config: Record<string, unknown>) => Promise<void>;
  invoke: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
    Paytm?: { CheckoutJS?: PaytmCheckout };
  }
}

export type PaySession =
  | { mode: "demo" }
  | { mode: "razorpay"; orderId: string; amount: number; currency: string; keyId: string }
  | { mode: "paytm"; mid: string; orderId: string; txnToken: string; amount: string; scriptUrl: string };

function loadScript(src: string, id: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById(id)) return resolve(true);
    const s = document.createElement("script");
    s.src = src;
    s.id = id;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function askServer(code: string): Promise<PayState> {
  try {
    const res = await fetch(`/api/payment/status?code=${encodeURIComponent(code)}`, {
      cache: "no-store",
    });
    if (!res.ok) return "pending";
    const data = (await res.json()) as { paid?: unknown; state?: unknown };
    if (data.paid === true) return "paid";
    if (data.state === "none" || data.state === "failed" || data.state === "pending") {
      return data.state;
    }
    return "pending";
  } catch {
    // Internet gaya — haar mat maano
    return "pending";
  }
}

export default function PayBox({
  code,
  amountLabel,
  brand,
  pujaTitle,
  devoteeName,
  phone,
  email,
  session,
  amountValue,
  hi,
}: {
  code: string;
  amountLabel: string;
  amountValue: number;
  brand: string;
  pujaTitle: string;
  devoteeName: string;
  phone: string;
  email: string | null;
  session: PaySession;
  hi: boolean;
}) {
  /** idle → grahak abhi tak nahi daba; waiting → paise ka intezaar */
  const [phase, setPhase] = useState<"idle" | "waiting" | "done" | "stopped">("idle");
  const [checks, setChecks] = useState(0);
  const [note, setNote] = useState("");
  const [openFailed, setOpenFailed] = useState(false);
  const liveRef = useRef(true);
  const runRef = useRef(0);

  // Page band hone par sab rok do
  useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
    };
  }, []);

  /**
   * Jaanch page khulte hi shuru — grahak ke kuch dabane ka intezaar nahi.
   *
   * Grahak agar pehle hi UPI app se paisa de chuka hai aur laut kar aaya
   * hai, to use kuch karna hi nahi padega: page khulte hi pakad liya jayega.
   */
  useEffect(() => {
    const my = runRef.current + 1;
    runRef.current = my;

    void (async () => {
      const out = await waitForPayment({
        maxChecks: MAX_CHECKS,
        gapMs: POLL_MS,
        ask: () => askServer(code),
        wait: sleep,
        alive: () => liveRef.current && runRef.current === my,
        onCheck: (n) => setChecks(n),
      });

      if (!liveRef.current || runRef.current !== my) return;

      if (out.paid) {
        setPhase("done");
        // Poora page reload jaan-boojh kar (router.push nahi): booking page
        // ko bilkul taaza server render chahiye taaki reconcile chale aur
        // WhatsApp khule. Yahan andaze ki gunjaish nahi rakhni.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/booking/${code}?paid=1`;
        return;
      }

      // 10 minute ho gaye — jaanch band. Yahan "payment nahi hua" NAHI
      // kehte; sirf itna ki abhi tak nahi aaya, aur dobara dekh sakte hain.
      setPhase("stopped");
    })();

    return () => {
      runRef.current += 1;
    };
  }, [code]);

  async function startPayment() {
    setNote("");
    setOpenFailed(false);
    setPhase("waiting");

    // Meta ko: is grahak ne payment shuru kiya. Purchase se pehle ka
    // sabse kaam ka signal — isi par Meta "kharidne wale" pehchanta hai.
    track("InitiateCheckout", { value: amountValue, currency: "INR", content_name: pujaTitle });

    /* ---------------- Demo ---------------- */
    if (session.mode === "demo") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/booking/${code}`;
      return;
    }

    /* ---------------- Paytm ---------------- */
    if (session.mode === "paytm") {
      const ok = await loadScript(session.scriptUrl, "paytm-checkout-js");
      if (!ok || !window.Paytm?.CheckoutJS) {
        setOpenFailed(true);
        return;
      }
      const checkout = window.Paytm.CheckoutJS;
      checkout.onLoad(() => {
        void checkout
          .init({
            root: "",
            flow: "DEFAULT",
            data: {
              orderId: session.orderId,
              token: session.txnToken,
              tokenType: "TXN_TOKEN",
              amount: session.amount,
            },
            merchant: { mid: session.mid, redirect: true },
            handler: { notifyMerchant: () => undefined },
          })
          .then(() => checkout.invoke())
          .catch(() => setOpenFailed(true));
      });
      return;
    }

    /* ---------------- Razorpay ---------------- */
    const ready = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js",
      "razorpay-checkout-js",
    );
    if (!ready || !window.Razorpay) {
      setOpenFailed(true);
      return;
    }

    /**
     * Yahan jaan-boojh kar `callback_url`, `redirect` aur `handler` —
     * teeno nahi diye gaye.
     *
     * Inki zaroorat hi nahi rahi: upar wala pehredaar pehle se chal raha
     * hai aur wo Razorpay se nahi, humare apne server se poochhta hai.
     * Kam hisse = kam tootne ki jagah.
     */
    const rzp = new window.Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency,
      name: brand,
      description: pujaTitle.slice(0, 120),
      order_id: session.orderId,
      prefill: { name: devoteeName, contact: phone, email: email || undefined },
      notes: { bookingCode: code },
      theme: { color: "#C2410C" },
      modal: {
        // Window band hui — kuch mat bolo. Pehredaar chal hi raha hai.
        ondismiss: () => undefined,
      },
    });

    rzp.open();
  }

  /* ------------------------------------------------------------------ */

  if (phase === "done") {
    return (
      <div className="mt-6 rounded-2xl border-2 border-green-500 bg-green-50 p-5 text-center">
        <p className="text-[16px] font-bold text-green-800">
          {hi ? "✅ भुगतान मिल गया — बुकिंग खुल रही है…" : "✅ Payment received — opening your booking…"}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => void startPayment()}
        className="btn-big w-full bg-gradient-to-r from-saffron-600 to-saffron-500 text-white shadow-soft"
      >
        {phase === "idle"
          ? `${hi ? "अभी भुगतान करें" : "Pay now"} • ${amountLabel}`
          : `${hi ? "दोबारा भुगतान करें" : "Try payment again"} • ${amountLabel}`}
      </button>

      {/* -------- Pehredaar chal raha hai -------- */}
      {phase === "waiting" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-2xl border-2 border-saffron-300 bg-saffron-50 p-4 text-center"
        >
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-saffron-200 border-t-saffron-600" />
          <p className="mt-3 text-[15px] font-bold text-maroon-800">
            {hi ? "भुगतान का इंतज़ार है…" : "Waiting for your payment…"}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink/65">
            {hi
              ? "पैसे पहुँचते ही बुकिंग अपने आप खुल जाएगी। UPI में एक मिनट तक लग सकता है।"
              : "Your booking opens by itself the moment the money lands. UPI can take up to a minute."}
          </p>
          {checks > 0 && (
            <p className="mt-2 text-[11.5px] font-bold tracking-wide text-saffron-700">
              {hi ? `जाँच ${checks}` : `Check ${checks}`}
            </p>
          )}
        </div>
      )}

      {/* -------- 10 minute ho gaye -------- */}
      {phase === "stopped" && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-center">
          <p className="text-[14px] font-bold text-amber-900">
            {hi ? "अभी तक पैसे नहीं पहुँचे।" : "The money hasn't arrived yet."}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-amber-900/80">
            {hi
              ? "अगर आपके खाते से पैसे कट गए हैं तो चिंता न करें — पहुँचते ही बुकिंग अपने आप कन्फर्म हो जाएगी। इस पेज को रिफ़्रेश करके फिर से देख सकते हैं।"
              : "If money left your account, don't worry — the booking confirms itself once it lands. Refresh this page to check again."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-full bg-amber-700 px-5 py-2 text-[13px] font-bold text-white"
          >
            {hi ? "फिर से जाँचें" : "Check again"}
          </button>
        </div>
      )}

      {/* -------- Payment window hi nahi khuli -------- */}
      {openFailed && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-[13.5px] leading-relaxed text-red-800"
        >
          {hi
            ? "भुगतान विंडो नहीं खुल पाई। इंटरनेट जाँचकर दोबारा कोशिश करें।"
            : "The payment window could not open. Check your internet and try again."}
        </div>
      )}

      {note && <p className="mt-3 text-center text-[13px] text-ink/60">{note}</p>}

      {/* -------- UPI app na khule to -------- */}
      <details className="mt-4 rounded-2xl bg-saffron-50/60 px-4 py-3">
        <summary className="cursor-pointer text-[13px] font-semibold text-maroon-800">
          {hi ? "UPI ऐप नहीं खुल रही?" : "UPI app not opening?"}
        </summary>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12.5px] leading-relaxed text-ink/65">
          <li>
            {hi
              ? "भुगतान विंडो में 'QR कोड' चुनें और किसी भी UPI ऐप से स्कैन कर लें।"
              : "Pick 'QR code' inside the payment window and scan it from any UPI app."}
          </li>
          <li>
            {hi
              ? "या 'UPI ID' चुनकर अपनी आईडी डालें — रिक्वेस्ट आपकी ऐप में आ जाएगी।"
              : "Or pick 'UPI ID' and type yours — the request arrives inside your app."}
          </li>
          <li>
            {hi
              ? "कार्ड और नेट बैंकिंग भी उसी विंडो में हैं।"
              : "Cards and net banking are in the same window."}
          </li>
          <li>
            {hi
              ? "पैसे कट गए हों तो यह पेज खुला छोड़ दें — बुकिंग अपने आप कन्फर्म हो जाएगी।"
              : "If money was deducted, just leave this page open — the booking confirms itself."}
          </li>
        </ul>
      </details>
    </div>
  );
}
