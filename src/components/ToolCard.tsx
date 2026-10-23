import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ToolMeta } from "@/lib/types";
import { ToolIcon } from "@/components/ToolIcon";

/** A linked card for one tool, used on the home page and the All tools page. */
export function ToolCard({ tool, headingLevel = "h3" }: { tool: ToolMeta; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <Link
      href={`/tools/${tool.slug}/`}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-brand-600/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <ToolIcon name={tool.icon} className="h-5 w-5" />
      </span>
      <Heading className="mt-4 text-lg font-semibold text-slate-900 group-hover:text-brand-800 dark:text-white dark:group-hover:text-brand-300">
        {tool.title}
      </Heading>
      <span className="mt-2 flex-1 text-base leading-7 text-slate-600 dark:text-slate-400">{tool.shortDescription}</span>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400">
        Open tool
        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
