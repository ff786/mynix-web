import type { MetadataRoute } from "next";
import { getStorefront } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

/**
 * Public pages for search engines (cart, checkout, account and invoices are
 * private), plus every category view and product page shown on the website.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const { products, categories } = await getStorefront();

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({
      url: `${SITE_URL}/catalog?category=${category.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/products/${product.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.image ? [`${SITE_URL}${product.image}`] : undefined,
    })),
    { url: `${SITE_URL}/track`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
