import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { GuideMeta } from "@/lib/guides-registry";
import { GUIDES } from "@/lib/guides-registry";
import { TOOLS, toolPath } from "@/lib/tools-registry";
import { AUTHOR, authorSchema } from "@/lib/authors";
import { SITE, absoluteUrl, publisherSchema } from "@/lib/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolIcon } from "@/components/ToolIcon";

const dateFormat = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

/** Page frame for a guide: breadcrumbs, heading, byline, the article, the tools it uses and more guides. */
export function GuideLayout({ guide, children }: { guide: GuideMeta; children: React.ReactNode }) {
  const url = absoluteUrl(`/guides/${guide.slug}/`);
  const tools = guide.tools.map((slug) => TOOLS.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  // Guides that share tools with this one come first, so each guide links to its closest topics.
  const more = GUIDES.filter((g) => g.slug !== guide.slug)
    .map((g, i) => ({ g, i, shared: g.tools.filter((t) => guide.tools.includes(t)).length }))
    .sort((a, b) => b.shared - a.shared || a.i - b.i)
    .slice(0, 6)
    .map(({ g }) => g);
  const faqs = guide.faqs ?? [];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.h1,
    description: guide.metaDescription,
    url,
    mainEntityOfPage: url,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    image: absoluteUrl(SITE.ogImage.url),
    author: authorSchema(),
    publisher: publisherSchema(),
  };
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides/") },
      { "@type": "ListItem", position: 3, name: guide.title, item: url },
    ],
  };

  const faqSchema = faqs.length > 0 && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <Breadcrumbs items={[{ name: "Guides", href: "/guides/" }, { name: guide.title }]} />

      <article className="mt-6 max-w-3xl">
        <header className="space-y-4 border-b border-slate-200 pb-6 dark:border-slate-800">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white" style={{ textWrap: "balance" }}>
            {guide.h1}
          </h1>
          <p className="text-lg leading-8 text-slate-700 dark:text-slate-300">{guide.summary}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            By{" "}
            <Link href="/about/#author" className="font-semibold text-slate-900 hover:underline dark:text-white">
              {AUTHOR.name}
            </Link>
            , {AUTHOR.role} ·{" "}
            {guide.dateModified !== guide.datePublished ? "Updated " : ""}
            <time dateTime={guide.dateModified}>{formatDate(guide.dateModified)}</time>
          </p>
        </header>

        <div className="content-prose guide-prose mt-8">{children}</div>

        {faqs.length > 0 && (
          <section aria-labelledby="guide-faqs" className="content-prose guide-prose mt-12">
            <h2 id="guide-faqs">Quick answers</h2>
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </section>
        )}
      </article>

      {tools.length > 0 && (
        <section aria-labelledby="guide-tools" className="mt-14 border-t border-slate-200 pt-10 dark:border-slate-800">
          <h2 id="guide-tools" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Tools used in this guide
          </h2>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={toolPath(tool)}
                  className="group flex h-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-600/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    <ToolIcon name={tool.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-base font-semibold text-slate-900 group-hover:text-brand-800 dark:text-white dark:group-hover:text-brand-300">
                      {tool.title}
                      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-400">{tool.shortDescription}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="more-guides" className="mt-12">
        <h2 id="more-guides" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          More guides
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
          {more.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}/`} className="text-base font-medium text-brand-700 hover:underline dark:text-brand-400">
                {g.h1}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Metadata helper values for a guide page. */
export function guideArticleMeta(guide: GuideMeta) {
  return { publishedTime: guide.datePublished, modifiedTime: guide.dateModified, author: AUTHOR.name };
}
