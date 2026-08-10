import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SacredArt from "@/components/SacredArt";
import BookingForm from "@/components/BookingForm";
import PujaCard from "@/components/PujaCard";
import { getLangDict } from "@/lib/lang-server";
import { pick, pickList } from "@/lib/i18n";
import { formatDate, formatINR } from "@/lib/utils";
import { isPaymentLive, siteConfig } from "@/lib/env";
import { getPujaBySlug, getUpcomingPujas } from "@/lib/queries";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPujaBySlug(slug);
  if (!data) return { title: "Puja not found" };

  return {
    title: data.puja.titleEn,
    description: data.puja.subtitleEn || data.puja.descriptionEn.slice(0, 155),
    alternates: { canonical: `/pujas/${slug}` },
  };
}

export default async function PujaDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { lang, t } = await getLangDict();

  const data = await getPujaBySlug(slug);
  if (!data) notFound();

  const { puja, temple, category, packages } = data;
  const related = (await getUpcomingPujas({ limit: 4 })).filter((p) => p.slug !== slug).slice(0, 3);

  const title = pick(lang, puja.titleEn, puja.titleHi);
  const subtitle = pick(lang, puja.subtitleEn, puja.subtitleHi);
  const description = pick(lang, puja.descriptionEn, puja.descriptionHi);
  const benefits = pickList(lang, puja.benefitsEn, puja.benefitsHi);
  const rituals = pickList(lang, puja.ritualsEn, puja.ritualsHi);
  const templeName = temple ? pick(lang, temple.nameEn, temple.nameHi) : "";
  const templeCity = temple ? pick(lang, temple.cityEn, temple.cityHi) : "";
  const templeState = temple ? pick(lang, temple.stateEn, temple.stateHi) : "";
  const templeAbout = temple ? pick(lang, temple.aboutEn, temple.aboutHi) : "";
  const categoryName = category ? pick(lang, category.nameEn, category.nameHi) : "";

  const minPrice = Math.min(...packages.map((p) => p.priceInPaise));
  const seatsLeft =
    puja.seatsTotal != null ? Math.max(puja.seatsTotal - puja.seatsBooked, 0) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: puja.titleEn,
    startDate: puja.pujaDate.toISOString(),
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    description: puja.subtitleEn,
    location: {
      "@type": "Place",
      name: temple?.nameEn ?? "Temple",
      address: `${temple?.cityEn ?? ""}, ${temple?.stateEn ?? ""}, India`,
    },
    organizer: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    offers: {
      "@type": "Offer",
      price: (minPrice / 100).toFixed(2),
      priceCurrency: "INR",
      availability:
        seatsLeft === 0 ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `${siteConfig.url}/pujas/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON ke andar "<" ko escape kar dete hain taaki koi </script> se
        // bahar na nikal sake (defence in depth — input pehle hi validate hai)
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-temple-gradient text-saffron-50">
        <div className="container-x grid gap-8 py-12 lg:grid-cols-[1.25fr_1fr] lg:py-16">
          <div>
            <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-saffron-100/65">
              <Link href="/" className="hover:text-gold-200">{t.nav.home}</Link>
              <span>/</span>
              <Link href="/pujas" className="hover:text-gold-200">{t.nav.pujas}</Link>
              {categoryName && (
                <>
                  <span>/</span>
                  <span className="text-gold-200">{categoryName}</span>
                </>
              )}
            </nav>

            <h1 className="font-display text-3xl leading-tight text-gold-100 sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-saffron-100/85">
                {subtitle}
              </p>
            )}

            <dl className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gold-300/20 bg-white/[0.07] px-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-gold-200/80">
                  {t.common.date}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-saffron-50">
                  {formatDate(puja.pujaDate, lang)}
                </dd>
              </div>
              {templeName && (
                <div className="rounded-2xl border border-gold-300/20 bg-white/[0.07] px-4 py-3 sm:col-span-2">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-gold-200/80">
                    {t.common.temple}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-saffron-50">
                    {templeName}
                    {templeCity && ` — ${templeCity}, ${templeState}`}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <p className="font-display text-2xl font-bold text-gold-200">
                {t.common.from} {formatINR(minPrice)}
              </p>
              {seatsLeft !== null && (
                <span className="rounded-full bg-gold-500/20 px-3 py-1 text-xs font-bold text-gold-100 ring-1 ring-gold-300/30">
                  {seatsLeft > 0
                    ? `${seatsLeft} ${t.common.seatsLeft}`
                    : t.common.soldOut}
                </span>
              )}
              <a href="#booking" className="btn rounded-full bg-gold-500 px-6 py-2.5 font-bold text-maroon-900 hover:bg-gold-400">
                {t.cta.participate}
              </a>
            </div>
          </div>

          <div className="relative">
            <SacredArt
              artKey={puja.artKey}
              rounded="rounded-3xl"
              className="aspect-[4/3] w-full shadow-lift ring-1 ring-gold-300/25"
            />
          </div>
        </div>
      </section>

      {/* ---------------- Body ---------------- */}
      <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-start">
        <article className="space-y-10">
          {description && (
            <section>
              <h2 className="text-xl">{lang === "hi" ? "पूजा के बारे में" : "About this Puja"}</h2>
              <div className="mt-3 h-px w-20 bg-gold-line" />
              <p className="prose-devotional mt-4 whitespace-pre-line">{description}</p>
            </section>
          )}

          {benefits.length > 0 && (
            <section>
              <h2 className="text-xl">{t.common.benefits}</h2>
              <div className="mt-3 h-px w-20 bg-gold-line" />
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {benefits.map((b) => (
                  <li key={b} className="flex gap-3 rounded-xl border border-saffron-100 bg-white p-3.5">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-saffron-100 text-[13px] text-saffron-700">
                      ✓
                    </span>
                    <span className="text-[14px] leading-relaxed text-ink/75">{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {rituals.length > 0 && (
            <section>
              <h2 className="text-xl">{t.common.rituals}</h2>
              <div className="mt-3 h-px w-20 bg-gold-line" />
              <ol className="mt-4 space-y-3">
                {rituals.map((r, i) => (
                  <li key={r} className="flex gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-maroon-700 font-display text-xs font-bold text-gold-200">
                      {i + 1}
                    </span>
                    <span className="pt-1 text-[14px] leading-relaxed text-ink/75">{r}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {templeAbout && (
            <section className="rounded-2xl border border-saffron-100 bg-white p-6">
              <h2 className="text-lg">
                {lang === "hi" ? "मंदिर के बारे में" : "About the Temple"}
              </h2>
              <p className="mt-1 text-[12px] font-bold uppercase tracking-wide text-saffron-700">
                {templeName} — {templeCity}, {templeState}
              </p>
              <p className="prose-devotional mt-3">{templeAbout}</p>
            </section>
          )}

          <section className="rounded-2xl bg-saffron-50 p-6">
            <h2 className="text-lg">{lang === "hi" ? "आपको क्या मिलेगा" : "What you receive"}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {(lang === "hi"
                ? [
                    "संकल्प में आपका नाम व गोत्र",
                    "पूरी पूजा का वीडियो (24-48 घंटे में)",
                    "मंदिर का प्रसाद घर तक (7-10 दिन)",
                    "पूजा संपन्नता प्रमाण-पत्र",
                  ]
                : [
                    "Your name & gotra in the sankalp",
                    "Complete puja video (in 24-48 hours)",
                    "Temple prasad at home (7-10 days)",
                    "Puja completion certificate",
                  ]
              ).map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[14px] text-ink/75">
                  <span className="mt-1 text-saffron-600">◆</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </article>

        {/* ---------------- Booking sidebar ---------------- */}
        <aside id="booking" className="lg:sticky lg:top-24">
          <div className="card p-5 sm:p-6">
            <BookingForm
              pujaSlug={puja.slug}
              pujaTitle={title}
              paymentLive={isPaymentLive()}
              packages={packages.map((p) => ({
                id: p.id,
                nameEn: p.nameEn,
                nameHi: p.nameHi,
                priceInPaise: p.priceInPaise,
                mrpInPaise: p.mrpInPaise,
                maxMembers: p.maxMembers,
                featuresEn: p.featuresEn,
                featuresHi: p.featuresHi,
                isPopular: p.isPopular,
              }))}
            />
          </div>
        </aside>
      </div>

      {/* ---------------- Related ---------------- */}
      {related.length > 0 && (
        <section className="bg-white/60 py-14">
          <div className="container-x">
            <h2 className="text-2xl">{lang === "hi" ? "अन्य आगामी पूजाएँ" : "Other Upcoming Pujas"}</h2>
            <div className="mt-3 h-px w-24 bg-gold-line" />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PujaCard key={p.id} puja={p} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
