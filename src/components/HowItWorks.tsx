import SectionHeading from "./SectionHeading";
import { getDict, type Lang } from "@/lib/i18n";

const ICONS = [
  // 1 choose
  "M4 6h16M4 12h10M4 18h7",
  // 2 form
  "M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 8h6M9 12h6M9 16h3",
  // 3 puja
  "M12 3v4M8 21h8M6 21c0-5 2.7-8 6-8s6 3 6 8M12 7a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3z",
  // 4 video
  "M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 10l5-3v10l-5-3z",
  // 5 prasad
  "M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5zM8 9V6a4 4 0 0 1 8 0v3",
];

export default function HowItWorks({ lang }: { lang: Lang }) {
  const t = getDict(lang);

  return (
    <section className="container-x py-16 sm:py-20">
      <SectionHeading title={t.sections.how} subtitle={t.sections.howSub} />

      <ol className="relative grid gap-6 md:grid-cols-5">
        {/* connecting line on desktop */}
        <div className="decor absolute left-0 right-0 top-[38px] hidden h-px bg-gradient-to-r from-transparent via-saffron-300 to-transparent md:block" />

        {t.steps.map((step, i) => (
          <li key={step.t} className="relative flex flex-col items-center text-center">
            <span className="relative z-10 grid h-[76px] w-[76px] place-items-center rounded-2xl border border-saffron-200 bg-white shadow-soft">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-saffron-600"
                aria-hidden="true"
              >
                <path d={ICONS[i]} />
              </svg>
              <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-maroon-700 font-display text-xs font-bold text-gold-200">
                {i + 1}
              </span>
            </span>

            <h3 className="mt-4 text-[15px]">{step.t}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink/60">{step.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
