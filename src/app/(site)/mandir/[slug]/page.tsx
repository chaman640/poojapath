import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PujaCard from "@/components/PujaCard";
import SectionHeading from "@/components/SectionHeading";
import { getLangDict } from "@/lib/lang-server";
import { pick } from "@/lib/i18n";
import { getTempleBySlug, getTemples, getUpcomingPujas } from "@/lib/queries";
import { abs, breadcrumbJsonLd, ogImageUrl, templeJsonLd } from "@/lib/seo";

/**
 * ══════════════════════════════════════════════════════════════════
 *  Mandir ke apne page — SEO ka sabse bada lever
 * ══════════════════════════════════════════════════════════════════
 *
 * Log Google me puja ka naam akela nahi likhte. Wo likhte hain:
 *
 *     "kashi vishwanath mandir puja booking"
 *     "उज्जैन महाकाल मंदिर में पूजा"
 *     "trimbakeshwar kaal sarp puja"
 *
 * Yani **mandir ka naam + shahar + puja** — teeno ek saath. Pehle
 * humari site par aisa koi page tha hi nahi jisme ye teeno shabd ek
 * jagah hon, isliye Google ko dikhane ke liye kuch tha hi nahi.
 *
 * Ab har mandir ka apna pata hai: `/mandir/kashi-vishwanath`.
 * Us page par mandir ka naam (Hindi + English), shahar, rajya, uska
 * parichay, aur wahan hone wali saari pujaein — sab ek jagah.
 *
 * Ye "mandir" wale shabdon par aane ka sabse seedha raasta hai, aur
 * jitne mandir add karenge utne hi naye page apne aap ban jayenge.
 */

type Params = Promise<{ slug: string }>;

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const rows = await getTemples();
    return rows.map((t) => ({ slug: t.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const temple = await getTempleBySlug(slug);
  if (!temple) return { title: "Mandir not found" };

  const title = `Puja at ${temple.nameEn}, ${temple.cityEn} — Book Online`;
  const description =
    `Book Vedic puja at ${temple.nameEn} in ${temple.cityEn}, ${temple.stateEn}. ` +
    `Temple pandits take your name and gotra in the sankalp. You get the full puja video and temple prasad at home.`;

  return {
    title,
    description,
    keywords: [
      temple.nameEn,
      temple.nameHi,
      `${temple.nameEn} puja booking`,
      `${temple.nameEn} online puja`,
      `${temple.cityEn} mandir puja`,
      `${temple.nameHi} में पूजा`,
      `${temple.cityHi} मंदिर पूजा`,
      "mandir me puja booking",
      "online puja booking",
    ],
    alternates: { canonical: `/mandir/${slug}` },
    openGraph: {
      type: "article",
      url: `/mandir/${slug}`,
      title,
      description,
      images: [{ url: ogImageUrl(), width: 1200, height: 630, alt: temple.nameEn }],
    },
  };
}

export default async function TemplePage({ params }: { params: Params }) {
  const { slug } = await params;
  const { lang } = await getLangDict();

  const temple = await getTempleBySlug(slug);
  if (!temple) notFound();

  const pujas = await getUpcomingPujas({ temple: slug, limit: 24 });

  const name = pick(lang, temple.nameEn, temple.nameHi);
  const city = pick(lang, temple.cityEn, temple.cityHi);
  const state = pick(lang, temple.stateEn, temple.stateHi);
  const about = pick(lang, temple.aboutEn, temple.aboutHi);

  const jsonLd = [
    templeJsonLd({
      slug,
      name: temple.nameEn,
      city: temple.cityEn,
      state: temple.stateEn,
      about: temple.aboutEn,
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Mandir", path: "/mandir" },
      { name: temple.nameEn, path: `/mandir/${slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Pujas at ${temple.nameEn}`,
      itemListElement: pujas.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.titleEn,
        url: abs(`/pujas/${p.slug}`),
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* -------- Hero -------- */}
      <section className="bg-temple-gradient text-saffron-50">
        <div className="container-x py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-saffron-100/70">
            <Link href="/" className="hover:underline">
              {lang === "hi" ? "होम" : "Home"}
            </Link>
            <span className="mx-1.5">›</span>
            <Link href="/mandir" className="hover:underline">
              {lang === "hi" ? "मंदिर" : "Mandir"}
            </Link>
          </nav>

          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            {lang === "hi" ? `${name} में पूजा` : `Puja at ${name}`}
          </h1>
          <p className="mt-2 text-[15px] text-saffron-100/85">
            {city}, {state}
          </p>

          {about && (
            <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-saffron-50/90">
              {about}
            </p>
          )}
        </div>
      </section>

      {/* -------- Yahan ki pujaein -------- */}
      <section className="container-x py-14 sm:py-16">
        <SectionHeading
          title={lang === "hi" ? `${name} की पूजाएँ` : `Pujas at ${name}`}
          subtitle={
            lang === "hi"
              ? "आपका नाम और गोत्र संकल्प में लिया जाएगा। पूरा वीडियो और मंदिर का प्रसाद घर पहुँचेगा।"
              : "Your name and gotra are taken in the sankalp. Full video and temple prasad reach your home."
          }
        />

        {pujas.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-saffron-200 bg-saffron-50 px-5 py-6 text-center text-[15px] text-ink/70">
            {lang === "hi"
              ? "इस मंदिर की पूजाएँ जल्द जोड़ी जाएँगी।"
              : "Pujas at this temple will be added soon."}{" "}
            <Link href="/pujas" className="font-semibold text-maroon-700 underline">
              {lang === "hi" ? "सभी पूजाएँ देखें" : "See all pujas"}
            </Link>
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pujas.map((p) => (
              <PujaCard key={p.id} puja={p} lang={lang} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
