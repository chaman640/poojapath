import type { Metadata } from "next";
import SacredArt from "@/components/SacredArt";
import { getLangDict } from "@/lib/lang-server";
import { pick } from "@/lib/i18n";
import { formatINR } from "@/lib/utils";
import { siteConfig } from "@/lib/env";
import { getProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Divine Store",
  description:
    "Energised rudraksh malas, yantras, parad shivling and puja samagri, delivered across India.",
};

export default async function ProductsPage() {
  const { lang, t } = await getLangDict();
  const items = await getProducts();
  const waNumber = siteConfig.whatsapp.replace(/\D/g, "");

  const groups = Array.from(
    items.reduce((map, p) => {
      const key = pick(lang, p.groupEn, p.groupHi);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
      return map;
    }, new Map<string, typeof items>()),
  );

  return (
    <>
      <section className="bg-temple-gradient py-12 text-center text-saffron-50 sm:py-16">
        <div className="container-x">
          <h1 className="font-display text-3xl text-gold-100 sm:text-4xl">
            {t.sections.store}
          </h1>
          <div className="divider-gold mt-4" />
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-saffron-100/80">
            {t.sections.storeSub}
          </p>
        </div>
      </section>

      <section className="container-x space-y-14 py-12">
        {groups.map(([group, list]) => (
          <div key={group}>
            <h2 className="text-2xl">{group}</h2>
            <div className="mt-3 h-px w-24 bg-gold-line" />

            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((p) => {
                const discount =
                  p.mrpInPaise && p.mrpInPaise > p.priceInPaise
                    ? Math.round(((p.mrpInPaise - p.priceInPaise) / p.mrpInPaise) * 100)
                    : 0;

                return (
                  <article key={p.id} className="card card-hover flex flex-col overflow-hidden">
                    <div className="relative">
                      <SacredArt artKey={p.artKey} className="aspect-square w-full" />
                      {discount > 0 && (
                        <span className="absolute right-3 top-3 rounded-full bg-maroon-700 px-2.5 py-1 text-[11px] font-bold text-gold-200">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-[14px] leading-snug">
                        {pick(lang, p.nameEn, p.nameHi)}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink/55">
                        {pick(lang, p.descEn, p.descHi)}
                      </p>

                      <div className="mt-auto pt-4">
                        <p className="flex items-baseline gap-2">
                          <span className="font-display text-lg font-bold text-maroon-800">
                            {formatINR(p.priceInPaise)}
                          </span>
                          {p.mrpInPaise && p.mrpInPaise > p.priceInPaise && (
                            <span className="text-[12px] text-ink/40 line-through">
                              {formatINR(p.mrpInPaise)}
                            </span>
                          )}
                        </p>

                        <a
                          href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                            `${lang === "hi" ? "मुझे यह चाहिए" : "I want to order"}: ${p.nameEn}`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary mt-3 w-full text-[13px]"
                        >
                          {p.inStock ? t.cta.bookNow : lang === "hi" ? "स्टॉक में नहीं" : "Out of stock"}
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
