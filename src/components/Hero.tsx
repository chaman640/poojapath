import Link from "next/link";
import { getDict, type Lang } from "@/lib/i18n";

function Check() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-gold-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export default function Hero({
  lang,
  stats,
}: {
  lang: Lang;
  stats: { pujaCount: number; templeCount: number };
}) {
  const t = getDict(lang);

  return (
    <section className="relative overflow-hidden bg-temple-gradient text-saffron-50">
      {/* decorative mandala */}
      <div className="decor pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] opacity-[0.13]">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <g fill="none" stroke="#FDE68A" strokeWidth="0.7">
            <circle cx="100" cy="100" r="95" />
            <circle cx="100" cy="100" r="78" strokeDasharray="2 4" />
            <circle cx="100" cy="100" r="58" />
            <circle cx="100" cy="100" r="34" />
            {Array.from({ length: 24 }, (_, i) => i * 15).map((deg) => (
              <ellipse
                key={deg}
                cx="100"
                cy="26"
                rx="6"
                ry="17"
                transform={`rotate(${deg} 100 100)`}
              />
            ))}
          </g>
        </svg>
      </div>
      <div className="decor pointer-events-none absolute -bottom-32 -left-24 h-[360px] w-[360px] rounded-full bg-gold-500/10 blur-3xl" />

      <div className="container-x relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
        <div className="animate-floatUp">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/35 bg-gold-500/12 px-4 py-1.5 text-xs font-bold text-gold-200">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-300" />
            {t.hero.badge}
          </span>

          <h1 className="mt-6 font-display text-4xl leading-[1.15] text-gold-100 sm:text-5xl lg:text-[3.4rem]">
            {t.hero.title}
            <br />
            <span className="bg-gradient-to-r from-gold-300 via-gold-200 to-gold-400 bg-clip-text text-transparent">
              {t.hero.titleAccent}
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-[1.8] text-saffron-100/85 sm:text-base">
            {t.hero.subtitle}
          </p>

          <ul className="mt-7 grid gap-2.5 sm:grid-cols-3">
            {[t.hero.point1, t.hero.point2, t.hero.point3].map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-saffron-50/90">
                <Check />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/pujas"
              className="btn rounded-full bg-gold-500 px-7 py-3 text-[15px] font-bold text-maroon-900 shadow-lift transition hover:bg-gold-400 active:scale-[.98]"
            >
              {t.cta.participate}
            </Link>
            <Link
              href="/track"
              className="btn rounded-full border border-gold-300/40 px-7 py-3 text-[15px] font-bold text-gold-100 transition hover:bg-white/10"
            >
              {t.cta.trackBooking}
            </Link>
          </div>
        </div>

        {/* Right: floating info card */}
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-gold-300/20 to-transparent blur-2xl" />
          <div className="relative rounded-[2rem] border border-gold-300/25 bg-white/[0.07] p-7 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-gold-300/20 pb-5">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-500/20 text-3xl text-gold-200">
                ॐ
              </span>
              <div>
                <p className="font-display text-lg font-bold text-gold-100">
                  {lang === "hi" ? "आपका संकल्प, हमारी सेवा" : "Your Sankalp, Our Seva"}
                </p>
                <p className="text-xs text-saffron-100/70">
                  {lang === "hi"
                    ? "वैदिक विधि • प्रामाणिक मंदिर • पूरा वीडियो"
                    : "Vedic vidhi • Authentic temples • Full video"}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-5">
              {[
                { k: `${stats.pujaCount}+`, v: lang === "hi" ? "आगामी पूजाएँ" : "Upcoming Pujas" },
                { k: `${stats.templeCount}+`, v: t.trust.temples },
                { k: "24-48h", v: lang === "hi" ? "वीडियो डिलीवरी" : "Video Delivery" },
                { k: "7-10d", v: lang === "hi" ? "प्रसाद डिलीवरी" : "Prasad Delivery" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-2xl font-bold text-gold-200">{s.k}</dt>
                  <dd className="mt-0.5 text-xs text-saffron-100/70">{s.v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 rounded-2xl border border-gold-300/20 bg-maroon-900/25 p-4">
              <p className="text-[13px] leading-relaxed text-saffron-100/85">
                {lang === "hi"
                  ? "“कोई अकाउंट नहीं, कोई पासवर्ड नहीं। बस नाम, गोत्र और मोबाइल नंबर — बाकी सब हम पर छोड़ दीजिए।”"
                  : "“No account, no password. Just your name, gotra and mobile number — leave the rest to us.”"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* bottom wave */}
      <svg
        className="decor block w-full"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 60V22c180 26 360 34 540 22s360-38 540-30 240 22 360 30v16z" fill="#FFF9F2" />
      </svg>
    </section>
  );
}
