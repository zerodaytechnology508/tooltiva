import { SITE } from "./site";

/** The person who writes and maintains Tooltiva's guides (shown in bylines and Article structured data). */
export const AUTHOR = {
  name: "Usman",
  role: "Web developer, founder of CodingTangent",
  bio: "Usman is a web developer and the founder of CodingTangent, the studio behind Tooltiva. He builds data tools that run in the browser and writes these guides from the problems people bring to them.",
  /** Public profiles that identify the author or the company (schema.org sameAs). */
  sameAs: [] as string[],
  url: `${SITE.url}/about/#author`,
};
