import { SITE } from "./site";

/** The person who writes and maintains Tooltiva's guides (shown in bylines and Article structured data). */
export const AUTHOR = {
  name: "Rana Muhammad Usman",
  role: "Web developer, founder of CodingTangent",
  location: "Lahore, Punjab, Pakistan",
  bio: "Rana Muhammad Usman is a web developer based in Lahore, Punjab, Pakistan, and the founder of CodingTangent, the studio behind Tooltiva. He builds data tools that run in the browser and writes these guides from the problems people bring to them.",
  url: `${SITE.url}/about/#author`,
};

/** schema.org Person for the author, linked to CodingTangent as employer. */
export function authorSchema() {
  return {
    "@type": "Person",
    name: AUTHOR.name,
    jobTitle: AUTHOR.role,
    url: AUTHOR.url,
    address: { "@type": "PostalAddress", addressLocality: "Lahore", addressRegion: "Punjab", addressCountry: "PK" },
    worksFor: { "@type": "Organization", name: SITE.publisher, sameAs: [SITE.publisherProfile] },
  };
}
