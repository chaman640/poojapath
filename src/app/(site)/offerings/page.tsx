import type { Metadata } from "next";
import SacredArt from "@/components/SacredArt";
import { getLangDict } from "@/lib/lang-server";
import { pick } from "@/lib/i18n";
import { formatINR } from "@/lib/utils";
import { siteConfig } from "@/lib/env";
import { getOfferings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Chadhava & Offerings",
  description:
    "Offer chunri, bilva patra, sindoor chola, deepdaan and annadaan at India's holiest temples in your name.",
};

export default async function OfferingsPage() {
  const { lang, t } = await getLangDict();
  const items = await getOfferings();
  const waNumber = siteConfig.whatsapp.replace(/\D/g, "");

  return (
    <>
      <section className="bg-temple-gradient py-12 text-center text-saffron-50 sm:py-16">
        <div className="container-x">
          <h1 className="font-display text-3xl text-gold-100 sm:text-4xl">
            {t.sections.chadhava}
          </h1>
          <div className="divider-gold mt-4" />
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-saffron-100/80">
            {t.sections.chadhavaSub}
          </p>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((o) => (
            <article key={o.id} className="card card-hover flex flex-col overflow-hidden">
              <SacredArt artKey={o.artKey} className="aspect-[16/9] w-full" />
              <div className="flex flex-1 flex-col p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-saffron-700">
                  {pick(lang, o.templeNameEn, o.templeNameHi)}
                </p>
                <h2 className="mt-1.5 text-base leading-snug">
                  {pick(lang, o.titleEn, o.titleHi)}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-ink/60">
                  {pick(lang, o.descEn, o.descHi)}
                </p>

                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="font-display text-xl font-bold text-maroon-800">
                    {formatINR(o.priceInPaise)}
                  </span>
                  <a
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                      `${lang === "hi" ? "मुझे यह चढ़ावा अर्पित करना है" : "I want to make this offering"}: ${o.titleEn}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    {t.cta.bookNow}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="card mx-auto mt-12 max-w-2xl rounded-3xl bg-saffron-50 p-7 text-center">
          <p className="text-[15px] leading-relaxed text-ink/70">
            {lang === "hi"
              ? "कोई विशेष चढ़ावा चाहिए जो यहाँ सूचीबद्ध नहीं है? हमें व्हाट्सएप पर बताइए — हम आपके लिए व्यवस्था कर देंगे।"
              : "Need a specific offering that isn't listed here? Tell us on WhatsApp — we will arrange it for you."}
          </p>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn mt-5 rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-bold text-white"
          >
            {t.cta.talkToUs}
          </a>
        </div>
      </section>
    </>
  );
}
