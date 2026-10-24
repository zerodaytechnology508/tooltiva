import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOLS, toolPath } from "@/lib/tools-registry";
import { ToolIcon } from "@/components/ToolIcon";

const MAX_RELATED = 6;

/**
 * Links to the most related tools: the registry's hand-picked `related` list first,
 * then tools of the same category, then the rest. Every tool stays reachable from
 * the header menu, the footer and the /tools/ hub.
 */
export function RelatedTools({ currentSlug }: { currentSlug: string }) {
  const current = TOOLS.find((tool) => tool.slug === currentSlug);
  const picked = (current?.related ?? [])
    .map((slug) => TOOLS.find((tool) => tool.slug === slug))
    .filter((tool): tool is (typeof TOOLS)[number] => !!tool && tool.slug !== currentSlug);
  // Image tools link only to image tools, so each section's pages stay on one topic.
  const pool = current?.category === "Image" ? TOOLS.filter((t) => t.category === "Image") : TOOLS.filter((t) => t.category !== "Image");
  const rest = pool.filter((tool) => tool.slug !== currentSlug && !picked.includes(tool)).sort(
    (a, b) => Number(b.category === current?.category) - Number(a.category === current?.category)
  );
  const others = [...picked, ...rest].slice(0, MAX_RELATED);
  if (others.length === 0) return null;
  return (
    <section aria-labelledby="related-tools" className="border-t border-slate-200 pt-10 dark:border-slate-800">
      <h2 id="related-tools" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Related tools
      </h2>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((tool) => (
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
  );
}
