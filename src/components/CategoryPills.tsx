import Link from "next/link";
import { pick, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Cat = {
  slug: string;
  nameEn: string;
  nameHi: string;
  count: number;
};

export default function CategoryPills({
  lang,
  categories,
  active,
  allLabel,
}: {
  lang: Lang;
  categories: Cat[];
  active?: string;
  allLabel: string;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Link
        href="/pujas"
        className={cn(
          "rounded-full border px-4 py-1.5 text-[13px] font-semibold transition",
          !active
            ? "border-saffron-600 bg-saffron-600 text-white"
            : "border-saffron-200 bg-white text-maroon-800 hover:border-saffron-400",
        )}
      >
        {allLabel}
      </Link>

      {categories
        .filter((c) => c.count > 0)
        .map((c) => (
          <Link
            key={c.slug}
            href={`/pujas?category=${encodeURIComponent(c.slug)}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-[13px] font-semibold transition",
              active === c.slug
                ? "border-saffron-600 bg-saffron-600 text-white"
                : "border-saffron-200 bg-white text-maroon-800 hover:border-saffron-400",
            )}
          >
            {pick(lang, c.nameEn, c.nameHi)}
            <span className="ml-1.5 text-[11px] opacity-60">{c.count}</span>
          </Link>
        ))}
    </div>
  );
}
