import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Suspense } from "react";
import MetaPixel from "@/components/MetaPixel";
import { getLang } from "@/lib/lang-server";
import { siteConfig } from "@/lib/env";
import {
  CORE_KEYWORDS,
  SITE_URL,
  ogImageUrl,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

/**
 * Fonts Google Fonts CDN se aate hain (Devanagari + Latin dono).
 * Agar font load na ho to system font par gracefully fallback ho jata hai.
 */
const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Serif:wght@600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@600;700&display=swap";

const TAGLINE = "Online Puja Booking at India's Sacred Temples";

const DESCRIPTION =
  "Book authentic Vedic puja at India's holiest temples. Your name and gotra are taken in the sankalp by temple pandits, you get the full puja video on WhatsApp, and temple prasad reaches your home. Rudrabhishek, Kaal Sarp Dosh, Pitru Dosh, Navgrah Shanti and more.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.name} — ${TAGLINE}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: DESCRIPTION,
  applicationName: siteConfig.name,
  keywords: CORE_KEYWORDS,
  authors: [{ name: siteConfig.legalName || siteConfig.name, url: SITE_URL }],
  creator: siteConfig.legalName || siteConfig.name,
  publisher: siteConfig.legalName || siteConfig.name,
  category: "Religion & Spirituality",

  /**
   * Canonical + bhasha.
   *
   * Ek hi page kai pate se khul sakta hai (www ke saath, `?ref=` ke saath).
   * Canonical Google ko batata hai ki asli pata kaun sa hai — warna Google
   * "duplicate" samajh kar dono ki taakat baant deta hai.
   */
  alternates: {
    canonical: "/",
    languages: {
      "hi-IN": "/",
      "en-IN": "/",
      "x-default": "/",
    },
  },

  /**
   * Icons — **search result me logo yahin se aata hai**.
   *
   * Google mobile search me har link ke saath favicon dikhata hai. Uske
   * liye chaukor, saaf icon chahiye aur `/favicon.ico` ka milna zaroori
   * hai. Isliye teeno roop diye hain: .ico, PNG aur apple-touch-icon.
   */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",

  openGraph: {
    type: "website",
    locale: "hi_IN",
    alternateLocale: ["en_IN"],
    url: SITE_URL,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${TAGLINE}`,
    description: DESCRIPTION,
    images: [
      {
        url: ogImageUrl(),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — online puja booking`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${TAGLINE}`,
    description: DESCRIPTION,
    images: [ogImageUrl()],
  },

  /**
   * `max-image-preview: large` ke bina Google result me sirf chhoti
   * thumbnail dikhata hai. Badi tasveer se click kaafi badhte hain.
   */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  /**
   * Search Console / Bing ka verification code.
   * Render ke Environment me daal dein, ye apne aap lag jayega.
   */
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION } }
      : {}),
  },

  formatDetection: { telephone: true, address: true, email: true },
};

export const viewport: Viewport = {
  themeColor: "#7B1E1E",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();

  /**
   * Sanstha aur website ka parichay — har page par.
   *
   * Ye Google ke liye hai, grahak ko dikhta nahi. Isi se search me
   * aapka logo, naam aur (aage chalkar) knowledge panel banta hai.
   */
  const graph = [organizationJsonLd(), websiteJsonLd()];

  return (
    <html lang={lang === "hi" ? "hi-IN" : "en-IN"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* Meta Pixel — NEXT_PUBLIC_META_PIXEL_ID set ho tabhi chalta hai */}
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
