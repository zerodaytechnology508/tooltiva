import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolJsonLd } from "@/lib/seo-utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQAccordion } from "@/components/FAQAccordion";
import { CSVToJSONClient } from "@/components/tools/CSVToJSONClient";
import { ArrowLeftRight, FileSpreadsheet, Code2, ArrowRight, Layers, Cpu } from "lucide-react";

export const metadata: Metadata = {
  title: "CSV to JSON & JSON to CSV Converter - Free & Private Online Tool",
  description:
    "Convert CSV to JSON and JSON to CSV instantly. Two-way transformation with smart type detection and formatting options. 100% in-browser private execution.",
  alternates: {
    canonical: "https://tooltiva.net/tools/csv-to-json/",
  },
  keywords: [
    "csv to json",
    "json to csv converter",
    "convert csv to json online",
    "csv to json with headers",
    "two way csv json converter",
  ],
  openGraph: {
    title: "CSV ⇄ JSON Converter - Free & Private | Tooltiva",
    description:
      "Transform tabular spreadsheets into JSON or flatten JSON into CSV locally in your browser without uploading tool content.",
    url: "https://tooltiva.net/tools/csv-to-json/",
  },
};

export default function CSVToJSONPage() {
  const tool = getToolBySlug("csv-to-json")!;
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
            { name: "Data & CSV", href: "/#tools" },
            { name: "CSV ⇄ JSON Converter" },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                <ArrowLeftRight className="w-6 h-6" />
              </span>
              CSV to JSON and JSON to CSV Converter
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Transform CSV rows into JSON objects or flatten JSON into clean CSV files. Fast, private, and type-aware.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tool Component */}
      <CSVToJSONClient />

      {/* Educational & SEO Content Section */}
      <section className="prose dark:prose-invert max-w-none pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 not-prose">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              CSV vs. JSON: Choosing the Right Format
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              CSV (Comma-Separated Values) is the standard format for tabular analysis in spreadsheet software like Microsoft Excel and Google Sheets. JSON (JavaScript Object Notation) is the primary data exchange format for REST and GraphQL APIs. Converting between them enables developers to import database tables into frontend apps and analysts to export API payloads into BI tools.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-brand-500" />
              Smart Type Inference
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              By default, all CSV values are plain text strings. Tooltiva intelligently identifies numbers, floating-point decimals, and boolean flags (&quot;true&quot; or &quot;false&quot;), casting them into proper native JSON types. If you need exact character-for-character preservation without numeric coercion, you can disable type inference with a single click.
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6 sm:p-8 space-y-4 not-prose">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            How to Convert Data Between CSV and JSON
          </h2>
          <ol className="list-decimal list-inside space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <li>
              <strong className="text-slate-900 dark:text-white">Choose direction:</strong> Select either <em>CSV ➔ JSON</em> or <em>JSON ➔ CSV</em> mode using the top toggle.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Provide data:</strong> Paste raw content or upload a local file (.csv, .json, or .txt).
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Select formatting options:</strong> For JSON output, select your indentation (2 spaces, 4 spaces, or compact minified) and data structure (Array of Objects or 2D Array).
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Inspect table preview:</strong> Review the parsed table grid to verify columns and data types.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Export:</strong> Copy your converted code or download the generated file to your local computer.
            </li>
          </ol>
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
            href="/tools/json-formatter/"
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/60 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  JSON Formatter & Auto-Fixer
                </h3>
                <p className="text-xs text-slate-500">Validate, format, and repair malformed JSON syntax.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
