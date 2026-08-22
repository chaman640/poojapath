import type { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import { getLangDict } from "@/lib/lang-server";
import { pick } from "@/lib/i18n";
import { getTemples } from "@/lib/queries";
import { abs, breadcrumbJsonLd, ogImageUrl } from "@/lib/seo";

/**
 * Saare mandir ek jagah.
 *
 * Do kaam karta hai: grahak ko jagah ke hisaab se dhoondhne deta hai,
 * aur Google ko har mandir ke page tak pahunchne ka seedha raasta deta
 * hai (isse naye page jaldi index hote hain).
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Temples — Book Puja at India's Sacred Mandirs | मंदिर",
  description:
    "Choose a temple and book Vedic puja there. Kashi, Ujjain, Trimbakeshwar and more — sankalp with your name and gotra, full puja video, and temple prasad delivered home.",
  keywords: [
    "mandir puja booking",
    "temple puja online india",
    "book puja at temple",
    "मंदिर में पूजा",
    "मंदिर पूजा बुकिंग",
  ],
  alternates: { canonical: "/mandir" },
  openGraph: {
    url: "/mandir",
    title: "Book Puja at India's Sacred Temples",
    description: "Choose a temple and book your puja — video and prasad included.",
    images: [{ url: ogImageUrl(), width: 1200, height: 630 }],
  },
};

export default async function TemplesPage() {
  const { lang } = await getLangDict();
  const temples = await getTemples();

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Mandir", path: "/mandir" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Temples",
      itemListElement: temples.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.nameEn,
        url: abs(`/mandir/${t.slug}`),
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-x py-12 sm:py-16">
        <SectionHeading
          title={lang === "hi" ? "मंदिर" : "Temples"}
          subtitle={
            lang === "hi"
              ? "जिस मंदिर में पूजा करवानी है, उसे चुनिए।"
              : "Pick the temple where you want your puja performed."
          }
        />

        {temples.length === 0 ? (
          <p className="mt-8 text-center text-[15px] text-ink/60">
            {lang === "hi" ? "मंदिर जल्द जोड़े जाएँगे।" : "Temples will be added soon."}
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {temples.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/mandir/${t.slug}`}
                  className="block h-full rounded-2xl border border-saffron-100 bg-white p-5 shadow-soft transition hover:border-saffron-300"
                >
                  <p className="font-display text-lg font-bold text-maroon-800">
                    {pick(lang, t.nameEn, t.nameHi)}
                  </p>
                  <p className="mt-1 text-[13.5px] text-ink/60">
                    {pick(lang, t.cityEn, t.cityHi)}, {pick(lang, t.stateEn, t.stateHi)}
                  </p>
                  <p className="mt-3 text-[13px] font-semibold text-saffron-700">
                    {lang === "hi" ? "पूजाएँ देखें →" : "See pujas →"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
