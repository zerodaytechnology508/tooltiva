import { ToolMeta } from "./types";

export function generateToolJsonLd(tool: ToolMeta) {
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": tool.title,
    "url": tool.canonicalUrl,
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "description": tool.metaDescription,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "creator": {
      "@type": "Organization",
      "name": "CodingTangent",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": tool.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://tooltiva.net/",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": tool.category,
        "item": "https://tooltiva.net/#tools",
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": tool.title,
        "item": tool.canonicalUrl,
      },
    ],
  };

  return { softwareAppSchema, faqSchema, breadcrumbsSchema };
}
