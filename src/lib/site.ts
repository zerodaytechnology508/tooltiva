/** Site-wide constants used by metadata, structured data and navigation. */
export const SITE = {
  name: "Tooltiva",
  url: "https://tooltiva.net",
  tagline: "Free CSV & JSON tools that run in your browser",
  description:
    "Free CSV and JSON tools: view, split, merge, dedupe and convert CSVs, change delimiters, and fix JSON. Everything runs in your browser; nothing is uploaded.",
  publisher: "CodingTangent",
  /** CodingTangent's public profile (used as the publisher's schema.org sameAs and in the footer). */
  publisherProfile: "https://www.facebook.com/profile.php?id=61593446905932",
  supportEmail: "support@tooltiva.net",
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

/** schema.org Organization for CodingTangent, the publisher of Tooltiva. */
export function publisherSchema() {
  return {
    "@type": "Organization",
    name: SITE.publisher,
    logo: absoluteUrl("/logo.png"),
    sameAs: [SITE.publisherProfile],
  };
}
