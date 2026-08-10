import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { getLangDict } from "@/lib/lang-server";
import { siteConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Talk to the Pooja Path team on WhatsApp, phone or email.",
};

export default async function ContactPage() {
  const { lang, t } = await getLangDict();
  const waNumber = siteConfig.whatsapp.replace(/\D/g, "");

  const cards = [
    {
      icon: "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Z",
      label: "WhatsApp",
      value: siteConfig.whatsapp,
      href: `https://wa.me/${waNumber}`,
    },
    {
      icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z",
      label: lang === "hi" ? "फ़ोन" : "Phone",
      value: siteConfig.phone,
      href: `tel:${siteConfig.phone}`,
    },
    {
      icon: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2 8 6 8-6",
      label: lang === "hi" ? "ईमेल" : "Email",
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
    },
  ];

  return (
    <>
      <section className="bg-temple-gradient py-12 text-center text-saffron-50 sm:py-16">
        <div className="container-x">
          <h1 className="font-display text-3xl text-gold-100 sm:text-4xl">{t.nav.contact}</h1>
          <div className="divider-gold mt-4" />
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-saffron-100/80">
            {lang === "hi"
              ? "कोई भी प्रश्न हो — पूजा, गोत्र, प्रसाद या भुगतान — हम सहायता के लिए तैयार हैं।"
              : "Any question — about a puja, gotra, prasad or payment — we are here to help."}
          </p>
        </div>
      </section>

      <section className="container-x grid gap-8 py-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {cards.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="card card-hover flex items-center gap-4 p-5"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-saffron-100 text-saffron-700">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={c.icon} />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-ink/50">
                  {c.label}
                </span>
                <span className="block truncate text-[15px] font-semibold text-maroon-800">
                  {c.value}
                </span>
              </span>
            </a>
          ))}

          <div className="card bg-saffron-50 p-5">
            <p className="text-[13px] font-bold uppercase tracking-wide text-saffron-700">
              {lang === "hi" ? "सहायता समय" : "Support Hours"}
            </p>
            <p className="mt-2 text-[14px] text-ink/70">
              {lang === "hi"
                ? "प्रातः 9:00 से रात्रि 9:00 (IST) — सातों दिन"
                : "9:00 AM to 9:00 PM (IST) — all seven days"}
            </p>
          </div>
        </div>

        <ContactForm />
      </section>
    </>
  );
}
