/** Site-wide constants used by metadata, structured data and navigation. */
export const SITE = {
  name: "Tooltiva",
  url: "https://tooltiva.net",
  tagline: "Free CSV & JSON tools that run in your browser",
  description:
    "Free online tools for CSV and JSON files: change delimiters, convert CSV to JSON and back, and format or fix JSON. Files are processed in your browser and never uploaded.",
  publisher: "CodingTangent",
  locale: "en_US",
  /** Google AdSense publisher ID (also in public/ads.txt). */
  adsenseClient: "ca-pub-1938055904818934",
  /** Default social preview image (1200×630), served from /public. */
  ogImage: {
    url: "/og-default.png",
    width: 1200,
    height: 630,
    alt: "Tooltiva — free CSV and JSON tools that run in your browser",
  },
} as const;

/** Absolute URL for a site path such as "/tools/csv-to-json/". */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}
