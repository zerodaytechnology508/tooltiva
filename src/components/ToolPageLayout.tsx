import React from "react";
import type { ToolMeta } from "@/lib/types";
import { generateToolJsonLd } from "@/lib/seo-utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQAccordion } from "@/components/FAQAccordion";
import { RelatedTools } from "@/components/RelatedTools";
import { ToolIcon } from "@/components/ToolIcon";

/**
 * The shared structure of every tool page: structured data, breadcrumbs,
 * heading and intro, the interactive tool, explanatory content, FAQ and
 * related tools. Pages supply only what is specific to them.
 */
export function ToolPageLayout({
  tool,
  children,
  content,
}: {
  tool: ToolMeta;
  /** The interactive tool. */
  children: React.ReactNode;
  /** Explanatory sections shown under the tool (use <ContentSection>). */
  content: React.ReactNode;
}) {
  const { softwareAppSchema, faqSchema, breadcrumbsSchema } = generateToolJsonLd(tool);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }} />

      <Breadcrumbs items={[{ name: tool.title }]} />

      <header className="mt-4 flex items-start gap-4">
        <span className="mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 sm:flex dark:bg-brand-950 dark:text-brand-300">
          <ToolIcon name={tool.icon} className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{tool.h1}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-400">
            {tool.intro}
          </p>
        </div>
      </header>

      <div className="mt-8">{children}</div>

      <div className="mt-16 space-y-12">
        {content}
        <FAQAccordion items={tool.faqs} />
        <RelatedTools currentSlug={tool.slug} />
      </div>
    </div>
  );
}

/** A titled block of explanatory copy, set at a readable line length. */
export function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="content-prose">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
