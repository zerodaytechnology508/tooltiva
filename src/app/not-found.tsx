import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { TOOLS, toolPath } from "@/lib/tools-registry";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for does not exist. Open one of Tooltiva's CSV and JSON tools instead.",
};

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Page not found</h1>
      <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
        This page doesn&apos;t exist or has moved. These tools might be what you were looking for:
      </p>
      <ul className="mt-6 space-y-2 text-base">
        {TOOLS.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={toolPath(tool)}
              className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
            >
              {tool.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-5 py-2.5 text-base font-semibold text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-slate-950 dark:hover:bg-brand-400"
      >
        Go to the home page
      </Link>
    </div>
  );
}
