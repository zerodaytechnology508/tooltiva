import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOLS } from "@/lib/tools-registry";
import { ToolIcon } from "@/components/ToolIcon";

/** Links to every other tool, generated from the registry so no page is left out. */
export function RelatedTools({ currentSlug }: { currentSlug: string }) {
  const others = TOOLS.filter((tool) => tool.slug !== currentSlug);
  return (
    <section aria-labelledby="related-tools" className="border-t border-slate-200 pt-10 dark:border-slate-800">
      <h2 id="related-tools" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Related tools
      </h2>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/tools/${tool.slug}/`}
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
  );
}
