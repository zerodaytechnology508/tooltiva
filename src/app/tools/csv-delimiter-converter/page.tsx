import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolJsonLd } from "@/lib/seo-utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQAccordion } from "@/components/FAQAccordion";
import { CSVDelimiterConverterClient } from "@/components/tools/CSVDelimiterConverterClient";
import { ArrowLeftRight, Code2, ArrowRight, ShieldCheck, Zap, FileSpreadsheet } from "lucide-react";

export const metadata: Metadata = {
  title: "CSV Delimiter Converter & Fixer - Change Separators Online",
  description:
    "Free online CSV delimiter converter. Change separators between semicolon, comma, tab, and pipe with auto-detection. 100% private in-browser processing with table preview.",
  alternates: {
    canonical: "https://tooltiva.net/tools/csv-delimiter-converter/",
  },
  keywords: [
    "change csv delimiter",
    "csv delimiter converter",
    "convert csv semicolon to comma",
    "change csv separator online",
    "tsv to csv converter",
    "fix csv delimiter excel",
  ],
  openGraph: {
    title: "CSV Delimiter Converter & Fixer - Free & Private | Tooltiva",
    description:
      "Convert CSV delimiters between semicolon, comma, tab, and pipe with RFC 4180 quote preservation. 100% client-side execution.",
    url: "https://tooltiva.net/tools/csv-delimiter-converter/",
  },
};

export default function CSVDelimiterConverterPage() {
  const tool = getToolBySlug("csv-delimiter-converter")!;
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
            { name: "CSV Delimiter Converter" },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </span>
              CSV Delimiter Converter & Fixer
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Change column separators between comma, semicolon, tab, and pipe. Auto-detects delimiters and preserves quoted strings.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tool Component */}
      <CSVDelimiterConverterClient />

      {/* Educational & SEO Content Section */}
      <section className="prose dark:prose-invert max-w-none pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 not-prose">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              The European Semicolon Dilemma
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              If your CSV opens in a single column in Microsoft Excel or Google Sheets, your operating system is likely configured for European regional formats. Because many European locales use commas (,) as decimal separators (e.g., 10,50 €), Excel defaults to semicolons (;) as column dividers. Converting standard comma-separated files to semicolons fixes column splitting instantly.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              RFC 4180 Quote Preservation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Naive &quot;find and replace&quot; tools ruin data by replacing commas inside addresses, full names, and descriptions (such as &quot;Acme, Inc.&quot;). Tooltiva uses standard RFC 4180 parsing to distinguish literal commas inside quoted strings from actual field separators, keeping your data intact.
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6 sm:p-8 space-y-4 not-prose">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            How to Change a CSV Delimiter Online
          </h2>
          <ol className="list-decimal list-inside space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <li>
              <strong className="text-slate-900 dark:text-white">Input your file:</strong> Paste raw text or upload your CSV, TSV, or TXT file into the editor above.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Verify source separator:</strong> Tooltiva automatically detects whether your file is separated by commas, semicolons, tabs, or pipes.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Select target separator:</strong> Choose your desired output delimiter (e.g., Semicolon for Excel, Tab for TSV, Pipe for database ingestion).
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Inspect preview:</strong> Verify row counts, column alignments, and warning banners in the live Table Preview.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Export result:</strong> Click &quot;Copy Result&quot; or &quot;Download .CSV&quot; to save your clean, reformatted file.
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
                <p className="text-xs text-slate-500">Two-way tabular to structured data conversion.</p>
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
                <p className="text-xs text-slate-500">Validate, beautify, and repair broken syntax.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
