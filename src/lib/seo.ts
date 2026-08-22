import { siteConfig } from "./env";

/**
 * ══════════════════════════════════════════════════════════════════
 *  SEO — ek hi jagah
 * ══════════════════════════════════════════════════════════════════
 *
 * Google ko teen cheezein chahiye, teeno yahan se aati hain:
 *
 *  1. **Saaf title aur description** — har page ka apna, dohraya hua nahi
 *  2. **Structured data (JSON-LD)** — Google ko machine-padhne layak
 *     bataana ki ye kya cheez hai: sanstha, puja, daam, mandir, sawal-jawab
 *  3. **Logo** — search me link ke saath aapka logo tabhi aata hai jab
 *     `Organization` schema me `logo` ho aur wo image saaf, chaukor aur
 *     kam se kam 112×112 ho. Wahi `siteLogoUrl()` deta hai.
 *
 * Note: JSON-LD hamesha English me rakha jata hai. Google ise padhta hai,
 * grahak nahi — aur English naam duniya bhar ke search me kaam aate hain.
 */

export const SITE_URL = siteConfig.url.replace(/\/$/, "");

export function abs(path = ""): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Search results me dikhne wala logo (chaukor, 512×512) */
export function siteLogoUrl(): string {
  return abs("/icon-512.png");
}

/** Social share aur search ke liye badi tasveer (1200×630) */
export function ogImageUrl(): string {
  return abs("/og-image.png");
}

/* ------------------------------------------------------------------ */
/*  Keywords                                                           */
/* ------------------------------------------------------------------ */

/**
 * Ye wo shabd hain jinse log sach me dhoondhte hain.
 *
 * Jaan-boojh kar do tarah ke shabd rakhe gaye hain:
 *  • **Aam** — "online puja booking", "मंदिर में पूजा"
 *  • **Khaas** — "rudrabhishek kashi vishwanath online"
 *
 * Khaas wale kam log dhoondhte hain, par unme sabse upar aana asaan hai
 * aur wahi log booking bhi karte hain. Nayi website ke liye yahi raasta
 * sahi hai — aam shabdon par pehle din se pehla number kisi ka nahi aata.
 */
export const CORE_KEYWORDS = [
  "online puja booking",
  "online pooja booking india",
  "temple puja online",
  "mandir me puja booking",
  "book puja at temple",
  "vedic puja online",
  "puja path online",
  "pooja path booking",
  "online rudrabhishek",
  "kaal sarp dosh puja online",
  "pitru dosh puja online",
  "mangal dosh nivaran puja",
  "navgrah shanti puja online",
  "chadhava online",
  "temple prasad delivery",
  "puja video sankalp",
  "gotra sankalp puja",
  "ऑनलाइन पूजा बुकिंग",
  "मंदिर में पूजा",
  "पूजा पाठ ऑनलाइन",
  "रुद्राभिषेक ऑनलाइन",
  "काल सर्प दोष पूजा",
  "पितृ दोष पूजा",
  "प्रसाद घर पर",
];

/* ------------------------------------------------------------------ */
/*  JSON-LD                                                            */
/* ------------------------------------------------------------------ */

type Json = Record<string, unknown>;

/**
 * Sanstha ka parichay — **yahi search me logo laata hai**.
 *
 * Google is `logo` field ko padhkar hi knowledge panel aur result ke
 * saath aapka chinh dikhata hai. Isliye image chaukor, saaf aur
 * kam se kam 112×112 honi chahiye (humari 512×512 hai).
 */
export function organizationJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": abs("/#organization"),
    name: siteConfig.name,
    legalName: siteConfig.legalName || siteConfig.name,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: siteLogoUrl(),
      width: 512,
      height: 512,
    },
    image: ogImageUrl(),
    description:
      "Anusthan Pooja books authentic Vedic pujas at India's holiest temples. Your name and gotra are taken in the sankalp, you receive the full puja video, and temple prasad is delivered to your home.",
    email: siteConfig.email,
    telephone: siteConfig.phone,
    areaServed: { "@type": "Country", name: "India" },
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
      ...(siteConfig.address ? { streetAddress: siteConfig.address } : {}),
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: siteConfig.phone,
        email: siteConfig.email,
        areaServed: "IN",
        availableLanguage: ["Hindi", "English"],
      },
    ],
  };
}

/**
 * Website ka parichay + search box.
 *
 * `SearchAction` se Google kabhi-kabhi result ke neeche aapki apni search
 * patti dikhata hai — usse click bhi badhta hai aur bharosa bhi.
 */
export function websiteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": abs("/#website"),
    url: SITE_URL,
    name: siteConfig.name,
    inLanguage: ["hi-IN", "en-IN"],
    publisher: { "@id": abs("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: abs("/pujas?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Result me "Home › Pujas › Rudrabhishek" jaisi patti */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}

/** Sawal-jawab — Google inhe seedha result me dikha deta hai */
export function faqJsonLd(items: { q: string; a: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/**
 * Puja ko "kharidne layak cheez" ki tarah bataana.
 *
 * Isse Google result me daam aur "in stock" dikha sakta hai — jisse
 * click kaafi badh jate hain.
 */
export function pujaProductJsonLd(p: {
  slug: string;
  title: string;
  description: string;
  image?: string | null;
  minPriceInPaise: number;
  templeName?: string;
  available: boolean;
  validUntil?: Date;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": abs(`/pujas/${p.slug}#product`),
    name: p.title,
    description: p.description.slice(0, 300),
    ...(p.image ? { image: [p.image] } : { image: [ogImageUrl()] }),
    brand: { "@type": "Brand", name: siteConfig.name },
    category: "Religious Services > Puja Booking",
    ...(p.templeName ? { additionalProperty: [{ "@type": "PropertyValue", name: "Temple", value: p.templeName }] } : {}),
    offers: {
      "@type": "Offer",
      url: abs(`/pujas/${p.slug}`),
      priceCurrency: "INR",
      price: (p.minPriceInPaise / 100).toFixed(2),
      availability: p.available
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      ...(p.validUntil ? { priceValidUntil: p.validUntil.toISOString().slice(0, 10) } : {}),
      seller: { "@id": abs("/#organization") },
    },
  };
}

/** Mandir ka page — jagah ke hisaab se dhoondhne walon ke liye */
export function templeJsonLd(t: {
  slug: string;
  name: string;
  city: string;
  state: string;
  about?: string;
  image?: string | null;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "PlaceOfWorship",
    "@id": abs(`/mandir/${t.slug}#place`),
    name: t.name,
    url: abs(`/mandir/${t.slug}`),
    ...(t.about ? { description: t.about.slice(0, 300) } : {}),
    ...(t.image ? { image: [t.image] } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: t.city,
      addressRegion: t.state,
      addressCountry: "IN",
    },
  };
}
