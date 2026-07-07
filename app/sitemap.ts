import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { guideArticles } from "@/lib/guide/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/kit`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const guideRoutes: MetadataRoute.Sitemap = guideArticles.map((article) => ({
    url: `${SITE_URL}/guide/${article.slug}`,
    lastModified: article.updated,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...guideRoutes];
}
