"use client";

import Link from "next/link";
import { useLang } from "./LanguageProvider";

type Props = {
  phone: string;
  whatsapp: string;
  email: string;
  address?: string;
};

export default function Footer({ phone, whatsapp, email, address }: Props) {
  const { t } = useLang();
  const year = new Date().getFullYear();
  const waLink = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  return (
    <footer className="mt-20 bg-temple-gradient text-saffron-50">
      <div className="h-1 w-full bg-gradient-to-r from-gold-500 via-gold-200 to-gold-500" />

      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-500/20 text-xl text-gold-200 ring-1 ring-gold-300/40">
              ॐ
            </span>
            <span className="font-display text-xl font-bold text-gold-100">
              {t.brand}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-saffron-100/80">
            {t.footer.about}
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.09c-.25.69-1.44 1.32-1.99 1.4-.53.08-1.2.11-1.94-.12a17.6 17.6 0 0 1-1.76-.65c-3.1-1.34-5.12-4.46-5.28-4.67-.15-.21-1.26-1.67-1.26-3.19s.8-2.26 1.08-2.57c.28-.31.61-.39.82-.39l.59.01c.19.01.44-.07.69.53.25.6.86 2.08.94 2.23.08.15.13.33.02.54-.1.21-.16.33-.31.51-.16.18-.33.4-.47.54-.15.15-.31.32-.13.63.18.31.79 1.3 1.69 2.11 1.16 1.03 2.14 1.35 2.45 1.5.31.16.49.13.67-.08.18-.21.77-.9.98-1.21.21-.31.41-.26.69-.15.28.1 1.77.83 2.08.98.31.16.51.23.59.36.08.13.08.75-.17 1.44Z" />
            </svg>
            {t.cta.talkToUs}
          </a>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gold-200">
            {t.footer.quick}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { href: "/pujas", label: t.nav.pujas },
              { href: "/offerings", label: t.nav.offerings },
              { href: "/products", label: t.nav.products },
              { href: "/track", label: t.nav.track },
              { href: "/pricing", label: t.nav.pricing },
              { href: "/about", label: t.nav.about },
              { href: "/contact", label: t.nav.contact },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-saffron-100/80 transition hover:text-gold-200"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gold-200">
            {t.footer.legal}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { href: "/legal/privacy", label: t.footer.privacy },
              { href: "/legal/terms", label: t.footer.terms },
              { href: "/legal/refund", label: t.footer.refund },
              { href: "/legal/shipping", label: t.footer.shipping },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-saffron-100/80 transition hover:text-gold-200"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gold-200">
            {t.footer.contact}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-saffron-100/80">
            <li>
              <a href={`tel:${phone}`} className="transition hover:text-gold-200">
                {phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${email}`} className="transition hover:text-gold-200">
                {email}
              </a>
            </li>
            <li className="pt-2 text-xs leading-relaxed text-saffron-100/60">
              Support: 9 AM – 9 PM (IST), saatoṁ din
            </li>
            {address && (
              <li className="pt-2 text-xs leading-relaxed text-saffron-100/60">
                {address}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-gold-300/15">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-saffron-100/70 sm:flex-row">
          <p>
            © {year} {t.brand}. {t.footer.rights}
          </p>
          <p>{t.footer.madeWith} 🪔</p>
        </div>
      </div>
    </footer>
  );
}
