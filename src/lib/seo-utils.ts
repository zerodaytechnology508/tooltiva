import { ToolMeta } from "./types";
import { SITE, absoluteUrl } from "./site";

/**
 * Structured data for a tool page. Breadcrumbs list only real, crawlable pages
 * (Home → tool); a category level is added once category hub pages exist.
 * FAQPage markup is kept because it describes the visible FAQ accurately, but
 * Google no longer shows FAQ rich results, so no search feature is expected.
 */
export function generateToolJsonLd(tool: ToolMeta) {
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    url: tool.canonicalUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    description: tool.metaDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: SITE.publisher,
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tool.title,
        item: tool.canonicalUrl,
      },
    ],
  };

  return { softwareAppSchema, faqSchema, breadcrumbsSchema };
}
