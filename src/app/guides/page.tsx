import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GUIDES } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = buildPageMetadata({
  title: "CSV and JSON Guides – Fix Common Data File Problems",
  description:
    "Step-by-step fixes for common CSV and JSON problems: one-column CSVs, lost leading zeros, strange characters, files too big for Excel and invalid JSON.",
  path: "/guides/",
});

export default function GuidesHubPage() {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tooltiva guides",
    url: absoluteUrl("/guides/"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: GUIDES.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.h1,
        url: absoluteUrl(`/guides/${guide.slug}/`),
      })),
    },
  };
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides/") },
    ],
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }} />
      <Breadcrumbs items={[{ name: "Guides" }]} />

      <div className="mt-4 max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">CSV, Excel and JSON guides</h1>
        <p className="text-lg leading-8 text-slate-600 dark:text-slate-400">
          Practical answers to the problems people run into with CSV and JSON files, from spreadsheets that show
          everything in one column to JSON that will not parse. Each guide explains the cause first, then the fix.
        </p>
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        {GUIDES.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/guides/${guide.slug}/`}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-brand-600/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
            >
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-brand-800 dark:text-white dark:group-hover:text-brand-300">
                {guide.h1}
              </h2>
              <p className="mt-2 flex-1 text-base leading-7 text-slate-600 dark:text-slate-400">{guide.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400">
                Read the guide
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
