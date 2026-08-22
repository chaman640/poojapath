import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import HowItWorks from "@/components/HowItWorks";
import PujaCard from "@/components/PujaCard";
import SectionHeading from "@/components/SectionHeading";
import Testimonials from "@/components/Testimonials";
import FaqAccordion from "@/components/FaqAccordion";
import CategoryPills from "@/components/CategoryPills";
import SacredArt from "@/components/SacredArt";
import { getLangDict } from "@/lib/lang-server";
import { pick } from "@/lib/i18n";
import { formatINR } from "@/lib/utils";
import { siteConfig } from "@/lib/env";
import {
  getCategoriesWithCount,
  getFaqs,
  getOfferings,
  getSiteStats,
  getTestimonials,
  getUpcomingPujas,
} from "@/lib/queries";
import { breadcrumbJsonLd, faqJsonLd, ogImageUrl } from "@/lib/seo";

/**
 * Home page ka apna title aur description.
 *
 * Layout wala default har page par lag jata hai, par home page site ka
 * chehra hai — iska title me wahi shabd hone chahiye jo log Google me
 * type karte hain: "online puja booking", "मंदिर में पूजा".
 */
export const metadata: Metadata = {
  title: "Online Puja Booking at India's Sacred Temples | ऑनलाइन पूजा बुकिंग",
  description:
    "Book Vedic puja at India's holiest temples online. Temple pandits take your name and gotra in the sankalp, you receive the full puja video, and temple prasad is delivered to your home. Rudrabhishek, Kaal Sarp Dosh, Pitru Dosh, Navgrah Shanti and more.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "Online Puja Booking at India's Sacred Temples",
    description:
      "Sankalp with your name and gotra, full puja video, temple prasad at home.",
    images: [{ url: ogImageUrl(), width: 1200, height: 630 }],
  },
};

export default async function HomePage() {
  const { lang, t } = await getLangDict();

  const [pujas, cats, offerings, reviews, faqs, stats] = await Promise.all([
    getUpcomingPujas({ limit: 6 }),
    getCategoriesWithCount(),
    getOfferings(),
    getTestimonials(6),
    getFaqs(8),
    getSiteStats(),
  ]);

  const waNumber = siteConfig.whatsapp.replace(/\D/g, "");

  /**
   * Sawal-jawab Google ko bhi bata dete hain.
   *
   * Iska seedha fayda: Google kabhi-kabhi ye sawal apne result me hi
   * khol deta hai, jisse aapki jagah result me badi ho jati hai aur
   * click badhte hain. Sawal wahi hain jo page par dikhte hain — Google
   * chhupa hua content pasand nahi karta.
   */
  const pageJsonLd = [
    breadcrumbJsonLd([{ name: "Home", path: "/" }]),
    ...(faqs.length
      ? [faqJsonLd(faqs.map((f) => ({ q: f.questionEn, a: f.answerEn })))]
      : []),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <Hero lang={lang} stats={stats} />
      <TrustBar lang={lang} stats={stats} />

      {/* ---------------- Upcoming pujas ---------------- */}
      <section className="container-x py-16 sm:py-20">
        <SectionHeading title={t.sections.upcoming} subtitle={t.sections.upcomingSub} />

        <div className="mb-9">
          <CategoryPills lang={lang} categories={cats} allLabel={t.common.allCategories} />
        </div>

        {pujas.length === 0 ? (
          <p className="py-10 text-center text-ink/55">{t.common.noResults}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pujas.map((p) => (
              <PujaCard key={p.id} puja={p} lang={lang} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/pujas" className="btn-secondary px-7 py-3">
            {t.cta.viewAll}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <div className="bg-white/60">
        <HowItWorks lang={lang} />
      </div>

      {/* ---------------- Chadhava ---------------- */}
      {offerings.length > 0 && (
        <section className="container-x py-16 sm:py-20">
          <SectionHeading title={t.sections.chadhava} subtitle={t.sections.chadhavaSub} />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.slice(0, 3).map((o) => (
              <article key={o.id} className="card card-hover overflow-hidden">
                <SacredArt artKey={o.artKey} className="aspect-[16/9] w-full" />
                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-saffron-700">
                    {pick(lang, o.templeNameEn, o.templeNameHi)}
                  </p>
                  <h3 className="mt-1.5 text-base leading-snug">
                    {pick(lang, o.titleEn, o.titleHi)}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink/60">
                    {pick(lang, o.descEn, o.descHi)}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-maroon-800">
                      {formatINR(o.priceInPaise)}
                    </span>
                    <Link href="/offerings" className="btn-ghost text-[13px]">
                      {t.cta.viewDetails} →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/offerings" className="btn-secondary px-6 py-2.5">
              {t.nav.offerings} →
            </Link>
          </div>
        </section>
      )}

      {/* ---------------- Why us ---------------- */}
      <section className="bg-temple-gradient py-16 text-saffron-50 sm:py-20">
        <div className="container-x">
          <h2 className="section-title text-gold-100">{t.sections.whyUs}</h2>
          <div className="divider-gold mt-4" />

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5z",
                t: lang === "hi" ? "प्रामाणिक मंदिर" : "Authentic Temples",
                d: lang === "hi"
                  ? "हर पूजा वास्तविक ज्योतिर्लिंग, शक्तिपीठ अथवा तीर्थ क्षेत्र में ही संपन्न होती है।"
                  : "Every puja is performed at a real Jyotirlinga, Shakti Peeth or tirth kshetra.",
              },
              {
                icon: "M23 7l-7 5 7 5V7zM1 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1z",
                t: lang === "hi" ? "पूरा वीडियो, बिना कट" : "Full Video, Uncut",
                d: lang === "hi"
                  ? "संकल्प से पूर्णाहुति तक — संपादित क्लिप नहीं, पूरी पूजा।"
                  : "From sankalp to purnahuti — the complete puja, not an edited clip.",
              },
              {
                icon: "M20 6 9 17l-5-5",
                t: lang === "hi" ? "विद्वान वैदिक पंडित" : "Learned Vedic Pandits",
                d: lang === "hi"
                  ? "कर्मकांड में प्रशिक्षित पंडित जी, जिनका मंदिर से वर्षों का संबंध है।"
                  : "Pandits trained in karmakand with years of association with the temple.",
              },
              {
                icon: "M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z",
                t: lang === "hi" ? "सुरक्षित भुगतान" : "Secure Payment",
                d: lang === "hi"
                  ? "रेज़रपे द्वारा संचालित। आपकी कार्ड/UPI जानकारी हम तक पहुँचती ही नहीं।"
                  : "Powered by Razorpay. Your card/UPI details never reach our servers.",
              },
            ].map((f) => (
              <div key={f.t} className="text-center sm:text-left">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gold-500/15 text-gold-200 ring-1 ring-gold-300/25 sm:mx-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={f.icon} />
                  </svg>
                </span>
                <h3 className="mt-4 text-base text-gold-100">{f.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-saffron-100/75">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Testimonials ---------------- */}
      <Testimonials lang={lang} items={reviews} />

      {/* ---------------- FAQ ---------------- */}
      <section className="container-x py-16 sm:py-20">
        <SectionHeading title={t.sections.faq} subtitle={t.sections.faqSub} />
        <FaqAccordion items={faqs} />
      </section>

      {/* ---------------- WhatsApp CTA ---------------- */}
      <section className="container-x pb-8">
        <div className="card relative overflow-hidden rounded-3xl bg-gradient-to-br from-saffron-50 to-white px-6 py-10 text-center sm:px-12">
          <div className="decor pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-300/20 blur-2xl" />
          <span className="text-4xl">🪔</span>
          <h2 className="mt-4 text-2xl sm:text-3xl">
            {lang === "hi"
              ? "हर पूजा तिथि की सूचना व्हाट्सएप पर पाएँ"
              : "Get every puja date on WhatsApp"}
          </h2>
          <p className="section-sub">
            {lang === "hi"
              ? "एकादशी, अमावस्या, प्रदोष और विशेष अनुष्ठानों की समय पर सूचना — बिना किसी शुल्क के।"
              : "Timely reminders for Ekadashi, Amavasya, Pradosh and special anushthans — free of cost."}
          </p>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
              lang === "hi" ? "मुझे पूजा अपडेट भेजें" : "Send me puja updates",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn mt-6 rounded-full bg-[#25D366] px-7 py-3 text-[15px] font-bold text-white shadow-soft transition hover:brightness-105"
          >
            {t.cta.talkToUs}
          </a>
        </div>
      </section>
    </>
  );
}
