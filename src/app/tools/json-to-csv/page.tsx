import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { CSVToJSONClient } from "@/components/tools/CSVToJSONClient";

const tool = getToolBySlug("json-to-csv")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function JSONToCSVPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="JSON that converts to a clean table">
            <p>
              For a clear column layout, use an array of objects that share property names. Each property becomes a
              CSV column and each object becomes a row. Objects with different keys are fine: the columns are the union
              of all keys, and missing values become empty cells.
            </p>
            <pre tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <code className="bg-transparent p-0">{`[
  { "name": "Mina", "role": "Analyst", "active": true },
  { "name": "Owen", "role": "Engineer", "active": false }
]`}</code>
            </pre>
            <p>
              Object dictionaries are accepted too. Nested objects and arrays are not expanded into columns; each is
              written as compact JSON text inside one cell, and the converter tells you how many.
            </p>
          </ContentSection>

          <ContentSection title="How to convert JSON to CSV">
            <ol>
              <li>Paste JSON or upload a .json or .txt file.</li>
              <li>Choose comma, semicolon, tab or pipe as the delimiter, and the quoting style.</li>
              <li>Keep &quot;Spreadsheet-safe output&quot; on if the file will be opened in Excel or Sheets.</li>
              <li>Check the CSV result or the table preview.</li>
              <li>Copy the CSV or download it as a file.</li>
            </ol>
            <p>
              If the converter reports invalid JSON, <Link href="/tools/json-formatter/">fix the JSON</Link> first:
              the formatter shows the line and column of each error and repairs common mistakes. Starting from CSV
              instead? Use the <Link href="/tools/csv-to-json/">CSV to JSON converter</Link>.
            </p>
          </ContentSection>
        </>
      }
    >
      <CSVToJSONClient initialDirection="json-to-csv" />
    </ToolPageLayout>
  );
}
