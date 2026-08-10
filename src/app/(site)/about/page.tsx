import type { Metadata } from "next";
import Link from "next/link";
import { getLangDict } from "@/lib/lang-server";
import { getSiteStats, getTemples } from "@/lib/queries";
import { pick } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Pooja Path connects devotees anywhere in the world with authentic Vedic pujas at India's holiest temples.",
};

export default async function AboutPage() {
  const { lang, t } = await getLangDict();
  const [stats, temples] = await Promise.all([getSiteStats(), getTemples()]);

  return (
    <>
      <section className="bg-temple-gradient py-12 text-center text-saffron-50 sm:py-16">
        <div className="container-x">
          <h1 className="font-display text-3xl text-gold-100 sm:text-4xl">{t.nav.about}</h1>
          <div className="divider-gold mt-4" />
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-saffron-100/80">
            {t.tagline}
          </p>
        </div>
      </section>

      <section className="container-x max-w-3xl py-12">
        <div className="prose-devotional">
          {lang === "hi" ? (
            <>
              <p>
                पूजा पथ की शुरुआत एक साधारण प्रश्न से हुई — जो भक्त काम, दूरी अथवा
                स्वास्थ्य के कारण मंदिर तक नहीं पहुँच सकता, क्या उसकी श्रद्धा कम हो जाती है?
                शास्त्र कहते हैं, नहीं। संकल्प में नाम और गोत्र ही भक्त को पूजा से जोड़ते हैं,
                शरीर की उपस्थिति नहीं।
              </p>
              <h2>हम क्या करते हैं</h2>
              <p>
                हम आपको भारत के ज्योतिर्लिंगों, शक्तिपीठों और तीर्थ क्षेत्रों के विद्वान
                पंडितों से जोड़ते हैं। आप पूजा चुनते हैं, अपना नाम, गोत्र और मोबाइल नंबर देते
                हैं — बस इतना। पंडित जी शुभ मुहूर्त में आपके नाम से संकल्प लेकर पूजा संपन्न
                करते हैं, और पूरी पूजा का वीडियो आपके व्हाट्सएप पर पहुँच जाता है। मंदिर का
                प्रसाद कूरियर से आपके घर आता है।
              </p>
              <h2>हमारा वचन</h2>
              <ul>
                <li>हर पूजा वास्तविक मंदिर में, वास्तविक पंडित जी द्वारा संपन्न होती है।</li>
                <li>वीडियो संपादित नहीं होता — संकल्प से पूर्णाहुति तक पूरा।</li>
                <li>कोई छिपा हुआ शुल्क नहीं। जो मूल्य दिखता है, वही देना है।</li>
                <li>आपकी जानकारी केवल संकल्प और अपडेट के लिए — कभी बेची नहीं जाती।</li>
              </ul>
              <h2>कोई अकाउंट नहीं</h2>
              <p>
                हमने जानबूझकर लॉगिन नहीं रखा। पासवर्ड याद रखना, ओटीपी का इंतज़ार करना — ये
                सब भक्ति और भक्त के बीच अनावश्यक दीवारें हैं। नाम, गोत्र, नंबर — बस इतने से
                काम हो जाता है।
              </p>
            </>
          ) : (
            <>
              <p>
                Pooja Path began with a simple question — when a devotee cannot reach the
                temple because of work, distance or health, does their shraddha count for
                less? The shastras say no. It is the name and gotra in the sankalp that bind
                a devotee to the puja, not the physical presence of the body.
              </p>
              <h2>What we do</h2>
              <p>
                We connect you with learned pandits at the Jyotirlingas, Shakti Peeths and
                tirth kshetras of Bharat. You choose a puja and give your name, gotra and
                mobile number — that is all. The pandit ji performs the puja at the
                auspicious muhurt with your sankalp, and the complete video reaches you on
                WhatsApp. Temple prasad is couriered to your home.
              </p>
              <h2>Our promise</h2>
              <ul>
                <li>Every puja is performed at a real temple by a real pandit.</li>
                <li>The video is never edited — from sankalp to purnahuti, in full.</li>
                <li>No hidden charges. The price you see is the price you pay.</li>
                <li>Your details are used only for the sankalp and updates — never sold.</li>
              </ul>
              <h2>No account, by design</h2>
              <p>
                We deliberately built this without a login. Remembering passwords and waiting
                for OTPs are unnecessary walls between a devotee and their prayer. Name,
                gotra, number — that is enough.
              </p>
            </>
          )}
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            { k: `${stats.templeCount}+`, v: t.trust.temples },
            { k: `${stats.pujaCount}+`, v: lang === "hi" ? "आगामी पूजाएँ" : "Upcoming Pujas" },
            { k: "60+", v: t.trust.pandits },
          ].map((s) => (
            <div key={s.v} className="card p-5 text-center">
              <p className="font-display text-2xl font-bold text-saffron-700">{s.k}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink/55">
                {s.v}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-2xl">
          {lang === "hi" ? "हमारे मंदिर एवं तीर्थ क्षेत्र" : "Our Temples & Tirth Kshetras"}
        </h2>
        <div className="mt-3 h-px w-24 bg-gold-line" />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {temples.map((tm) => (
            <li key={tm.id} className="card p-4">
              <p className="text-[14px] font-bold text-maroon-800">
                {pick(lang, tm.nameEn, tm.nameHi)}
              </p>
              <p className="mt-0.5 text-[12px] text-ink/55">
                {pick(lang, tm.cityEn, tm.cityHi)}, {pick(lang, tm.stateEn, tm.stateHi)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link href="/pujas" className="btn-primary px-7 py-3">
            {t.cta.viewAll}
          </Link>
        </div>
      </section>
    </>
  );
}
