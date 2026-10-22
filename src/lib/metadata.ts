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
}

/**
 * Complete metadata for one page. Next.js replaces (does not merge) nested
 * objects such as `openGraph` and `twitter` from the layout, so every page
 * gets the full set here: canonical URL, Open Graph and Twitter card with the
 * site name, locale and preview image.
 */
export function buildPageMetadata({ title, description, path, absoluteTitle = false }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
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
