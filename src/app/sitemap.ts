import { MetadataRoute } from "next";
import { TOOLS, toolPath } from "@/lib/tools-registry";
import { GUIDES } from "@/lib/guides-registry";
import { KB_SIZE_PAGES, kbSizePath } from "@/lib/kb-sizes";

/** Newest of a list of YYYY-MM-DD dates. */
function newest(dates: string[]): string {
  return [...dates].sort().at(-1)!;
}

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://tooltiva.net";

  const toolRoutes = TOOLS.map((tool) => ({
    url: `${baseUrl}${toolPath(tool)}`,
    lastModified: tool.lastUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const sizeRoutes = KB_SIZE_PAGES.map((page) => ({
    url: `${baseUrl}${kbSizePath(page)}`,
    lastModified: page.lastUpdated,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const dataTools = TOOLS.filter((t) => t.category !== "Image").map((t) => t.lastUpdated);
  const imagePages = [...TOOLS.filter((t) => t.category === "Image").map((t) => t.lastUpdated), ...KB_SIZE_PAGES.map((p) => p.lastUpdated)];
  const guideDates = GUIDES.map((g) => g.dateModified);

  const staticRoutes = [
    {
      url: `${baseUrl}/`,
      lastModified: newest([...dataTools, ...imagePages, ...guideDates]),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools/`,
      lastModified: newest(dataTools),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/image-tools/`,
      lastModified: newest(imagePages),
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
    { url: `${baseUrl}/guides/`, lastModified: newest(guideDates), changeFrequency: "weekly" as const, priority: 0.8 },
    ...GUIDES.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}/`,
      lastModified: guide.dateModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...toolRoutes, ...sizeRoutes, ...guideRoutes];
}
