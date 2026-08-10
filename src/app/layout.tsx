import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLang } from "@/lib/lang-server";
import { siteConfig } from "@/lib/env";

/**
 * Fonts Google Fonts CDN se aate hain (Devanagari + Latin dono).
 * Agar font load na ho to system font par gracefully fallback ho jata hai.
 */
const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Serif:wght@600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@600;700&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Online Puja Booking at Sacred Temples of Bharat`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Book authentic Vedic pujas at India's holiest temples and tirth kshetras. Your name and gotra in the sankalp, full puja video, and temple prasad delivered to your home.",
  keywords: [
    "online puja booking",
    "puja at temple",
    "rudrabhishek online",
    "kaal sarp dosh puja",
    "pitru dosh puja",
    "chadhava online",
    "पूजा बुकिंग",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Online Puja Booking`,
    description:
      "Sacred pujas at holy temples, performed in your name. Video + prasad included.",
  },
  robots: { index: true, follow: true },
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

  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      </head>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
