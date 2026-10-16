import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolJsonLd } from "@/lib/seo-utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQAccordion } from "@/components/FAQAccordion";
import { CSVToJSONClient } from "@/components/tools/CSVToJSONClient";
import { ArrowLeftRight, ArrowRight, Braces, FileSpreadsheet } from "lucide-react";

const tool = getToolBySlug("json-to-csv")!;

export const metadata: Metadata = {
  title: "JSON to CSV Converter - Convert JSON to CSV Online",
  description:
    "Convert JSON arrays and keyed objects to CSV online. Choose a delimiter, preview the table, then copy or download your CSV. Processing stays in your browser.",
  alternates: {
    canonical: "https://tooltiva.net/tools/json-to-csv/",
  },
  keywords: [
    "json to csv converter",
    "convert json to csv online",
    "json array to csv",
    "export json data to csv",
  ],
  openGraph: {
    title: "JSON to CSV Converter - Free Online Tool | Tooltiva",
    description:
      "Turn JSON arrays or keyed objects into CSV in your browser. Choose a delimiter, inspect a table preview, then copy or download the result.",
    url: "https://tooltiva.net/tools/json-to-csv/",
  },
  twitter: {
    card: "summary_large_image",
    title: "JSON to CSV Converter - Convert JSON to CSV Online | Tooltiva",
    description:
      "Convert JSON arrays and keyed objects to CSV online. Choose a delimiter, preview the table, then copy or download your CSV. Processing stays in your browser.",
  },
};

export default function JSONToCSVPage() {
  const { softwareAppSchema, faqSchema, breadcrumbsSchema } =
    generateToolJsonLd(tool);

  return (
    <div className="max-w-7xl mx-auto space-y-12 px-4 py-8 sm:px-6 lg:px-8">
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

      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { name: "Data & CSV", href: "/#tools" },
            { name: "JSON to CSV Converter" },
          ]}
        />
        <div className="space-y-2">
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            <span className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <ArrowLeftRight aria-hidden="true" className="h-6 w-6" />
            </span>
            JSON to CSV Converter
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            Convert JSON arrays or keyed objects into a table you can preview
            and export as CSV. Choose a delimiter and quoting option; your data
            is processed locally in this browser.
          </p>
        </div>
      </div>

      <CSVToJSONClient initialDirection="json-to-csv" />

      <section className="space-y-8 border-t border-slate-200 pt-8 dark:border-slate-800">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Braces aria-hidden="true" className="h-5 w-5 text-blue-500" />
              JSON input for tabular data
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              For a clear column layout, provide an array of objects that share
              property names. Each property becomes a CSV column, and each
              object becomes a row.
            </p>
            <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              <code>{`[
  { "name": "Mina", "role": "Analyst", "active": true },
  { "name": "Owen", "role": "Engineer", "active": false }
]`}</code>
            </pre>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <FileSpreadsheet
                aria-hidden="true"
                className="h-5 w-5 text-emerald-500"
              />
              Convert and export
            </h2>
            <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <li>Paste JSON or upload a local JSON or text file.</li>
              <li>Choose comma, semicolon, tab, or pipe as the delimiter.</li>
              <li>Review the CSV result or switch to Table Preview.</li>
              <li>Copy the result or download it as a CSV file.</li>
            </ol>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Object dictionaries are also accepted. Nested objects are not
              expanded into columns, so flatten nested data into regular
              properties before converting for a clean table.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/30">
          <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
            Need to convert CSV in the other direction?
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Use the two-way converter to transform CSV rows into JSON, with
            options for JSON structure, type inference, and indentation.
          </p>
          <Link
            href="/tools/csv-to-json/"
            className="mt-4 inline-flex items-center gap-2 rounded-lg font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-300 dark:hover:text-brand-200"
          >
            Open the CSV to JSON converter
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <FAQAccordion items={tool.faqs} />
    </div>
  );
}
