import { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools-registry";
import { GUIDES } from "@/lib/guides-registry";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://tooltiva.net";

  const toolRoutes = TOOLS.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}/`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const staticRoutes = [
    {
      url: `${baseUrl}/`,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools/`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about/`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy/`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms/`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact/`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  const guideRoutes = [
    { url: `${baseUrl}/guides/`, changeFrequency: "weekly" as const, priority: 0.8 },
    ...GUIDES.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}/`,
      lastModified: guide.dateModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...toolRoutes, ...guideRoutes];
}
