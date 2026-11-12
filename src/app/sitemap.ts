import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { CATEGORIES, SITE } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = SITE.url;
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/tienda`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...CATEGORIES.map((c) => ({ url: `${base}/tienda?categoria=${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${base}/corporativo`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...products.map((p) => ({ url: `${base}/productos/${p.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
