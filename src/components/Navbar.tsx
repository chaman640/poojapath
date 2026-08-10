"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";
import { cn } from "@/lib/utils";

const links = (t: ReturnType<typeof useLang>["t"]) => [
  { href: "/", label: t.nav.home },
  { href: "/pujas", label: t.nav.pujas },
  { href: "/offerings", label: t.nav.offerings },
  { href: "/products", label: t.nav.products },
  { href: "/track", label: t.nav.track },
  { href: "/contact", label: t.nav.contact },
];

export default function Navbar() {
  const { t, toggle, switching, lang } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Route badalte hi mobile menu band ho jaye
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = links(t);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-saffron-100 bg-cream/95 shadow-soft backdrop-blur"
          : "bg-cream/70 backdrop-blur-sm",
      )}
    >
      <div className="h-1 w-full bg-gradient-to-r from-saffron-600 via-gold-400 to-maroon-700" />

      <nav className="container-x flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-saffron-600 to-maroon-700 text-lg font-bold text-gold-200 shadow-soft">
            ॐ
          </span>
          <span className="leading-none">
            <span className="block font-display text-lg font-bold text-maroon-800">
              {t.brand}
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-saffron-700">
              {lang === "hi" ? "श्रद्धा • सेवा • संकल्प" : "Shraddha • Seva • Sankalp"}
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-0.5 lg:flex">
          {nav.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-saffron-100 text-maroon-800"
                      : "text-ink/70 hover:bg-saffron-50 hover:text-maroon-800",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={switching}
            className="rounded-full border border-saffron-300 bg-white px-3 py-1.5 text-xs font-bold text-maroon-800 transition hover:bg-saffron-50 disabled:opacity-50"
            aria-label="Change language"
          >
            {t.common.language}
          </button>

          <Link href="/pujas" className="btn-primary hidden sm:inline-flex">
            {t.cta.bookNow}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-saffron-200 bg-white text-maroon-800 lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {open ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="animate-floatUp border-t border-saffron-100 bg-cream lg:hidden">
          <ul className="container-x flex flex-col py-2">
            {nav.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block border-b border-saffron-100/70 py-3 text-[15px] font-semibold text-maroon-800"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="py-3">
              <Link href="/pujas" className="btn-primary w-full">
                {t.cta.bookNow}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
