import { ToolMeta } from "./types";
import { absoluteUrl, publisherSchema } from "./site";
import { toolSection } from "./tools-registry";

/**
 * Structured data for a tool page. Breadcrumbs match the visible trail:
 * Home → section hub (/tools/ or /image-tools/) → tool.
 * FAQPage markup is kept because it describes the visible FAQ accurately, but
 * Google no longer shows FAQ rich results, so no search feature is expected.
 */
export function generateToolJsonLd(tool: ToolMeta) {
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    url: tool.canonicalUrl,
    applicationCategory: tool.category === "Image" ? "MultimediaApplication" : "DeveloperApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    description: tool.metaDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: publisherSchema(),
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
        name: toolSection(tool).name,
        item: absoluteUrl(toolSection(tool).path),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.title,
        item: tool.canonicalUrl,
      },
    ],
  };

  return { softwareAppSchema, faqSchema, breadcrumbsSchema };
}
