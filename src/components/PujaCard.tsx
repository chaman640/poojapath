import Link from "next/link";
import PujaImage from "./PujaImage";
import { getDict, pick, type Lang } from "@/lib/i18n";
import { formatDateShort, formatINR } from "@/lib/utils";
import type { PujaListItem } from "@/lib/queries";

export default function PujaCard({
  puja,
  lang,
}: {
  puja: PujaListItem;
  lang: Lang;
}) {
  const t = getDict(lang);
  const title = pick(lang, puja.titleEn, puja.titleHi);
  const subtitle = pick(lang, puja.subtitleEn, puja.subtitleHi);
  const temple = pick(lang, puja.templeNameEn ?? "", puja.templeNameHi ?? "");
  const city = pick(lang, puja.templeCityEn ?? "", puja.templeCityHi ?? "");
  const category = pick(lang, puja.categoryNameEn ?? "", puja.categoryNameHi ?? "");

  const seatsLeft =
    puja.seatsTotal != null ? Math.max(puja.seatsTotal - puja.seatsBooked, 0) : null;
  const soldOut = seatsLeft === 0;

  return (
    <article className="card card-hover group flex flex-col overflow-hidden">
      <Link href={`/pujas/${puja.slug}`} className="relative block">
        <PujaImage
          imageUrl={puja.imageUrl}
          artKey={puja.artKey}
          alt={title}
          width={640}
          className="aspect-[16/10] w-full"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {category && (
            <span className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              {category}
            </span>
          )}
          {puja.isFeatured && (
            <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[11px] font-bold text-maroon-900">
              ★ {lang === "hi" ? "विशेष" : "Featured"}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-maroon-800 shadow-soft">
          {formatDateShort(puja.pujaDate, lang)}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {temple && (
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-saffron-700">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2 3 9v13h6v-6h6v6h6V9z" />
            </svg>
            <span className="truncate">
              {temple}
              {city ? `, ${city}` : ""}
            </span>
          </p>
        )}

        <h3 className="line-clamp-2 text-[17px] leading-snug">
          <Link href={`/pujas/${puja.slug}`} className="transition group-hover:text-saffron-700">
            {title}
          </Link>
        </h3>

        {subtitle && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink/60">
            {subtitle}
          </p>
        )}

        {seatsLeft !== null && seatsLeft <= 25 && !soldOut && (
          <p className="mt-3 text-[12px] font-bold text-maroon-600">
            🔥 {lang === "hi" ? `केवल ${seatsLeft} ${t.common.seatsLeft}` : `Only ${seatsLeft} ${t.common.seatsLeft}`}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">
              {t.common.from}
            </p>
            <p className="font-display text-xl font-bold text-maroon-800">
              {puja.minPrice ? formatINR(puja.minPrice) : "—"}
            </p>
          </div>

          {soldOut ? (
            <span className="btn-secondary cursor-not-allowed opacity-60">
              {t.common.soldOut}
            </span>
          ) : (
            <Link href={`/pujas/${puja.slug}`} className="btn-primary">
              {t.cta.participate}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
