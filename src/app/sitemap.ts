import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllActivePujaSlugs, getCategoriesWithCount, getTemples } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Sitemap — Google ko "ye rahe mere saare page" ki list.
 *
 * `priority` Google ko batata hai ki aapki nazar me kaun sa page kitna
 * zaroori hai, aur `changeFrequency` kitni jaldi dobara aana chahiye.
 * Puja aur mandir ke page sabse upar rakhe gaye hain — wahi paisa laate
 * hain. Legal page sabse neeche.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { path: "", priority: 1.0, freq: "daily" as const },
    { path: "/pujas", priority: 0.95, freq: "daily" as const },
    { path: "/mandir", priority: 0.9, freq: "weekly" as const },
    { path: "/offerings", priority: 0.8, freq: "weekly" as const },
    { path: "/products", priority: 0.8, freq: "weekly" as const },
    { path: "/pricing", priority: 0.7, freq: "monthly" as const },
    { path: "/about", priority: 0.6, freq: "monthly" as const },
    { path: "/contact", priority: 0.6, freq: "monthly" as const },
    { path: "/track", priority: 0.4, freq: "monthly" as const },
    { path: "/legal/privacy", priority: 0.2, freq: "yearly" as const },
    { path: "/legal/terms", priority: 0.2, freq: "yearly" as const },
    { path: "/legal/refund", priority: 0.2, freq: "yearly" as const },
    { path: "/legal/shipping", priority: 0.2, freq: "yearly" as const },
  ].map((p) => ({
    url: `${base}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  let pujaPages: MetadataRoute.Sitemap = [];
  let templePages: MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];

  // Database available na ho to sirf static pages — sitemap phir bhi bane
  try {
    const rows = await getAllActivePujaSlugs();
    pujaPages = rows.map((r) => ({
      url: `${base}/pujas/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));
  } catch {
    /* chhod do */
  }

  try {
    const rows = await getTemples();
    templePages = rows.map((t) => ({
      url: `${base}/mandir/${t.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  } catch {
    /* chhod do */
  }

  try {
    const rows = await getCategoriesWithCount();
    categoryPages = rows.map((c) => ({
      url: `${base}/pujas?category=${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    /* chhod do */
  }

  return [...staticPages, ...pujaPages, ...templePages, ...categoryPages];
}
