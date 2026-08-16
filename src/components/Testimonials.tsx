import SectionHeading from "./SectionHeading";
import { getDict, pick, type Lang } from "@/lib/i18n";
import type { Testimonial } from "@/db/schema";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < n ? "#D4A017" : "#E8DCC8"}
          aria-hidden="true"
        >
          <path d="m12 2 3 6.5 7 .9-5 4.9 1.2 7L12 18l-6.2 3.3L7 14.3 2 9.4l7-.9z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials({
  lang,
  items,
}: {
  lang: Lang;
  items: Testimonial[];
}) {
  const t = getDict(lang);
  if (items.length === 0) return null;

  return (
    <section className="bg-white/60 py-16 sm:py-20">
      <div className="container-x">
        <SectionHeading title={t.sections.devoteeCorner} subtitle={t.sections.devoteeSub} />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <figure key={item.id} className="card flex h-full flex-col p-6">
              <span className="font-display text-4xl leading-none text-saffron-200">“</span>

              <blockquote className="prose-devotional mt-1 flex-1 text-[14px]">
                {pick(lang, item.textEn, item.textHi)}
              </blockquote>

              <figcaption className="mt-5 flex items-center gap-3 border-t border-saffron-100 pt-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-saffron-500 to-maroon-700 font-display text-base font-bold text-white">
                  {item.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-maroon-800">{item.name}</p>
                  <p className="text-xs text-ink/55">{item.city}</p>
                </div>
                <div className="ml-auto text-right">
                  <Stars n={item.rating} />
                  {item.verified && (
                    <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-green-700">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5z" />
                      </svg>
                      {t.common.verified}
                    </p>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
