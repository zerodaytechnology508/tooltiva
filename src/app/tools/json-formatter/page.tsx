import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolJsonLd } from "@/lib/seo-utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQAccordion } from "@/components/FAQAccordion";
import { JSONFormatterClient } from "@/components/tools/JSONFormatterClient";
import { Code2, FileSpreadsheet, ArrowLeftRight, ArrowRight, Wrench, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "JSON Formatter, Validator & Auto-Fixer - Free & Private Online Tool",
  description:
    "Free online JSON formatter, validator, and syntax fixer. Auto-repair trailing commas and single quotes with an explicit audit log. 100% in-browser private execution.",
  alternates: {
    canonical: "https://tooltiva.net/tools/json-formatter/",
  },
  keywords: [
    "json formatter",
    "json validator",
    "fix invalid json online",
    "beautify json",
    "json syntax repair",
    "fix trailing comma json",
  ],
  openGraph: {
    title: "JSON Formatter, Validator & Auto-Fixer | Tooltiva",
    description:
      "Beautify, inspect, and automatically repair broken JSON syntax with zero server uploads. 100% client-side privacy.",
    url: "https://tooltiva.net/tools/json-formatter/",
  },
};

export default function JSONFormatterPage() {
  const tool = getToolBySlug("json-formatter")!;
  const { softwareAppSchema, faqSchema, breadcrumbsSchema } = generateToolJsonLd(tool);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />

      {/* Top Header & Breadcrumbs */}
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { name: "Developer", href: "/#tools" },
            { name: "JSON Formatter & Fixer" },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                <Code2 className="w-6 h-6" />
              </span>
              JSON Formatter, Validator & Auto-Fixer
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Format, beautify, and validate JSON data. Automatically repair trailing commas, single quotes, and unquoted keys.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tool Component */}
      <JSONFormatterClient />

      {/* Educational & SEO Content Section */}
      <section className="prose dark:prose-invert max-w-none pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 not-prose">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              Transparent Syntax Auto-Repair
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Most online validators merely report an obscure syntax error. Tooltiva goes further: our intelligent Auto-Fixer repairs trailing commas in lists and dictionaries, converts JavaScript single-quotes to standard double-quotes, quotes bare keys, and strips comments. Crucially, we never modify data silently—every change is logged with exact counts and an instant undo option.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              RFC 8259 Compliance & Privacy
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Pasting production API keys, internal configs, or database records into third-party formatting websites creates security and privacy exposure. Tooltiva executes all formatting and syntax checks locally in your browser&apos;s JavaScript engine. Your payloads are not sent by the application to an external processing service.
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6 sm:p-8 space-y-4 not-prose">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Common JSON Errors and How to Prevent Them
          </h2>
          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <li>
              <strong className="text-slate-900 dark:text-white">Trailing commas:</strong> Placing a comma after the final property (e.g. <code>{"{ \"a\": 1, }"}</code>) is permitted in JavaScript, but forbidden in strict JSON (RFC 8259).
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Single quotes:</strong> JSON strictly requires double quotation marks (<code>&quot;</code>) around strings and property keys.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Unquoted keys:</strong> Python dictionaries or JS object literals like <code>{"{ name: \"Alice\" }"}</code> must have their keys wrapped in double quotes.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Comments:</strong> Neither single-line <code>{"//"}</code> nor block <code>{"/* */"}</code> comments are permitted in valid JSON data.
            </li>
          </ul>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <FAQAccordion items={tool.faqs} />

      {/* Related Tools Cross-Links */}
      <section className="pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related Utilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/tools/csv-delimiter-converter/"
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/60 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  CSV Delimiter Converter
                </h3>
                <p className="text-xs text-slate-500">Change separators between semicolon, comma, tab, and pipe.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/tools/csv-to-json/"
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/60 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  CSV ⇄ JSON Converter
                </h3>
                <p className="text-xs text-slate-500">Two-way tabular to JSON transformation.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
