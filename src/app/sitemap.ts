import { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools-registry";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://tooltiva.net";
  const now = new Date();

  const toolRoutes = TOOLS.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}/`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const staticRoutes = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  return [...staticRoutes, ...toolRoutes];
}
