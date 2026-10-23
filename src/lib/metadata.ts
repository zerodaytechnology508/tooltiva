import type { Metadata } from "next";
import { SITE, absoluteUrl } from "./site";

interface PageMetadataInput {
  /** Page title without the "| Tooltiva" suffix (the layout template adds it). */
  title: string;
  description: string;
  /** Site path with a trailing slash, e.g. "/tools/csv-to-json/". */
  path: string;
  /** Use the title as-is, without the layout's "| Tooltiva" suffix. */
  absoluteTitle?: boolean;
  /** Marks the page as an article (Open Graph type "article") with its dates and author. */
  article?: { publishedTime: string; modifiedTime: string; author: string };
}

/**
 * Complete metadata for one page. Next.js replaces (does not merge) nested
 * objects such as `openGraph` and `twitter` from the layout, so every page
 * gets the full set here: canonical URL, Open Graph and Twitter card with the
 * site name, locale and preview image.
 */
export function buildPageMetadata({ title, description, path, absoluteTitle = false, article }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      ...(article
        ? {
            type: "article" as const,
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime,
            authors: [article.author],
          }
        : { type: "website" as const }),
      siteName: SITE.name,
      locale: SITE.locale,
      url,
      title: socialTitle,
      description,
      images: [{ ...SITE.ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [SITE.ogImage.url],
    },
  };
}
