"use client";

import { useEffect, useState } from "react";

/**
 * Payment ke turant baad WhatsApp khol dena.
 *
 * Message me poori booking pehle se bhari hoti hai — booking ID, naam,
 * gotra, number, puja, tithi, raashi. Grahak ko bas "send" dabana hota
 * hai, aur aapke paas har booking WhatsApp me aa jati hai.
 *
 * Teen baatein jaan-boojh kar rakhi gayi hain:
 *
 *  1. **Sirf abhi wali booking par** — purani booking dobara kholne par
 *     WhatsApp nahi khulta. Ye faisla server par hota hai: ya to URL me
 *     `?paid=1` ho, ya booking pichhle 5 minute me confirm hui ho.
 *  2. **Rok sakte hain** — countdown ke saath "Rehne dein" bhi hai.
 *  3. **Dobara nahi khulega** — chalte hi URL me `wa=done` lag jata hai,
 *     isliye refresh ya back dabane par phir se nahi chalega.
 */
export default function BookingWhatsapp({
  link,
  seconds = 3,
  hi,
}: {
  link: string;
  seconds?: number;
  hi: boolean;
}) {
  const [left, setLeft] = useState(seconds);
  const [stopped, setStopped] = useState(false);

  // URL me nishaan laga do — refresh ya back dabane par dobara na khule
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("paid");
      url.searchParams.set("wa", "done");
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* purane browser — koi baat nahi */
    }
  }, []);

  useEffect(() => {
    if (stopped) return;

    if (left <= 0) {
      window.location.href = link;
      return;
    }

    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left, stopped, link]);

  if (stopped) return null;

  return (
    <div className="mt-5 rounded-2xl border-2 border-[#25D366] bg-[#25D366]/10 p-4 text-center">
      <p className="text-[15px] font-bold text-maroon-800">
        {hi ? `📲 व्हाट्सएप खुल रहा है… ${left}` : `📲 Opening WhatsApp… ${left}`}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink/65">
        {hi
          ? "आपकी पूरी बुकिंग का संदेश तैयार है — बस भेज दीजिए, हमें आपकी जानकारी मिल जाएगी।"
          : "Your full booking message is ready — just press send and we'll have your details."}
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <a
          href={link}
          className="btn rounded-full bg-[#25D366] px-6 py-2.5 text-[14px] font-bold text-white"
        >
          {hi ? "अभी खोलें" : "Open now"}
        </a>
        <button
          type="button"
          onClick={() => setStopped(true)}
          className="btn rounded-full border border-saffron-300 bg-white px-5 py-2.5 text-[14px] font-semibold text-maroon-800"
        >
          {hi ? "रहने दें" : "Not now"}
        </button>
      </div>
    </div>
  );
}
