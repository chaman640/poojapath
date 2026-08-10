import type { Metadata } from "next";
import Link from "next/link";
import PujaCard from "@/components/PujaCard";
import CategoryPills from "@/components/CategoryPills";
import { getLangDict } from "@/lib/lang-server";
import { getCategoriesWithCount, getUpcomingPujas } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Upcoming Pujas",
  description:
    "Browse upcoming pujas at Jyotirlingas, Shakti Peeths and tirth kshetras across Bharat. Book with your name and gotra — video and prasad included.",
};

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function PujasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { lang, t } = await getLangDict();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const category = (sp.category ?? "").trim().slice(0, 80) || undefined;

  const [pujas, cats] = await Promise.all([
    getUpcomingPujas({ q: q || undefined, category }),
    getCategoriesWithCount(),
  ]);

  return (
    <>
      <section className="bg-temple-gradient py-12 text-saffron-50 sm:py-16">
        <div className="container-x text-center">
          <h1 className="font-display text-3xl text-gold-100 sm:text-4xl">
            {t.sections.upcoming}
          </h1>
          <div className="divider-gold mt-4" />
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-saffron-100/80">
            {t.sections.upcomingSub}
          </p>

          <form action="/pujas" method="GET" className="mx-auto mt-7 flex max-w-xl gap-2">
            {category && <input type="hidden" name="category" value={category} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t.common.searchPh}
              maxLength={80}
              className="input border-transparent bg-white/95"
            />
            <button type="submit" className="btn rounded-full bg-gold-500 px-6 font-bold text-maroon-900 hover:bg-gold-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </form>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="mb-9">
          <CategoryPills
            lang={lang}
            categories={cats}
            active={category}
            allLabel={t.common.allCategories}
          />
        </div>

        {pujas.length === 0 ? (
          <div className="card mx-auto max-w-md p-10 text-center">
            <p className="text-4xl">🪔</p>
            <p className="mt-4 text-ink/60">{t.common.noResults}</p>
            <Link href="/pujas" className="btn-secondary mt-6">
              {t.common.allCategories}
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-center text-sm text-ink/55">
              {pujas.length} {lang === "hi" ? "पूजाएँ मिलीं" : "pujas found"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pujas.map((p) => (
                <PujaCard key={p.id} puja={p} lang={lang} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
