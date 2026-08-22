import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * robots.txt
 *
 * Kya chhupana hai: admin, API, aur grahak ke niji page (booking status,
 * payment). Ye Google me kabhi nahi aane chahiye — na inka koi SEO fayda
 * hai, na inhe dusron ko dikhna chahiye.
 *
 * Baaki sab khula hai. Ek galti se `Disallow: /` reh jane par poori site
 * Google se gayab ho jati hai, isliye yahan kuch bhi badalte waqt dhyan
 * rakhein aur baad me Search Console me "robots.txt" jaanch lein.
 */
export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/booking/", "/pay/"],
      },
      // AI/answer engines bhi ab traffic bhejte hain — inhe rokna nahi hai
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
