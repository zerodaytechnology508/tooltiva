import React from "react";
import Link from "next/link";
import { TOOLS } from "@/lib/tools-registry";
import type { ToolCategory } from "@/lib/types";
import { buildPageMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolCard } from "@/components/ToolCard";

export const metadata = buildPageMetadata({
  title: "All Tools – Free CSV and JSON Tools",
  description:
    "Every Tooltiva tool in one place: view, split, merge and convert CSV files, change delimiters, and format or validate JSON. Free, no sign-up, nothing uploaded.",
  path: "/tools/",
});

const GROUPS: { category: ToolCategory; id: string; title: string; intro: string }[] = [
  {
    category: "Data & CSV",
    id: "csv-tools",
    title: "CSV and data tools",
    intro: "Open, split, merge and remove duplicates from CSV files, and convert data between CSV and JSON.",
  },
  {
    category: "Image",
    id: "image-tools",
    title: "Image tools",
    intro: "Resize photos and signatures to the exact size in KB, pixels or centimetres that online forms ask for.",
  },
  {
    category: "Developer",
    id: "json-tools",
    title: "JSON and developer tools",
    intro: "Format, validate and repair JSON from APIs, logs and config files.",
  },
];

export default function ToolsHubPage() {
  const groups = GROUPS.map((group) => ({ ...group, tools: TOOLS.filter((t) => t.category === group.category) })).filter(
    (group) => group.tools.length > 0
  );

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Tooltiva tools",
    url: absoluteUrl("/tools/"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: TOOLS.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.title,
        url: tool.canonicalUrl,
      })),
    },
  };
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Tools", item: absoluteUrl("/tools/") },
    ],
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }} />
      <Breadcrumbs items={[{ name: "Tools" }]} />

      <div className="mt-4 max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">All tools</h1>
        <p className="text-lg leading-8 text-slate-600 dark:text-slate-400">
          Free tools for everyday CSV and JSON work. Each one runs entirely in your browser: nothing you open or
          paste is uploaded, and there is no account to create.
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.category} aria-labelledby={group.id} className="mt-12 space-y-5">
          <div>
            <h2
              id={group.id}
              className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white"
            >
              {group.title}
            </h2>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-400">{group.intro}</p>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.tools.map((tool) => (
              <li key={tool.id}>
                <ToolCard tool={tool} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-12 border-t border-slate-200 pt-8 text-base text-slate-600 dark:border-slate-800 dark:text-slate-400">
        Missing a tool you need? Tell us at{" "}
        <a href="mailto:support@tooltiva.net" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
          support@tooltiva.net
        </a>
        . Read{" "}
        <Link href="/about/" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
          how Tooltiva works
        </Link>{" "}
        to learn how your data is handled.
      </p>
    </div>
  );
}
