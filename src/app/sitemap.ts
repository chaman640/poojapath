import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/env";
import { getAllActivePujaSlugs } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");

  const staticPages = [
    "",
    "/pujas",
    "/offerings",
    "/products",
    "/about",
    "/contact",
    "/track",
    "/legal/privacy",
    "/legal/terms",
    "/legal/refund",
    "/legal/shipping",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  let pujaPages: MetadataRoute.Sitemap = [];
  try {
    const rows = await getAllActivePujaSlugs();
    pujaPages = rows.map((r) => ({
      url: `${base}/pujas/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));
  } catch {
    // database available na ho to sirf static pages
  }

  return [...staticPages, ...pujaPages];
}
