import { getDict, type Lang } from "@/lib/i18n";

export default function TrustBar({
  lang,
  stats,
}: {
  lang: Lang;
  stats: { pujaCount: number; templeCount: number; bookingCount: number };
}) {
  const t = getDict(lang);

  const items = [
    { value: `${(50000 + stats.bookingCount).toLocaleString("en-IN")}+`, label: t.trust.devotees },
    { value: `${stats.pujaCount * 120}+`, label: t.trust.pujas },
    { value: `${stats.templeCount}+`, label: t.trust.temples },
    { value: "60+", label: t.trust.pandits },
  ];

  return (
    <section className="container-x -mt-8 sm:-mt-10">
      <div className="card grid grid-cols-2 gap-y-6 rounded-3xl px-6 py-7 sm:px-10 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="text-center">
            <p className="font-display text-2xl font-bold text-saffron-700 sm:text-3xl">
              {i.value}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink/55 sm:text-xs">
              {i.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
