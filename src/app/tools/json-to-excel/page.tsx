import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { JSONToExcelClient } from "@/components/tools/JSONToExcelClient";

const tool = getToolBySlug("json-to-excel")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

const EXAMPLE_JSON = `[
  {
    "orderId": "A-1001",
    "customer": { "name": "Ayesha Khan", "city": "Lahore" },
    "total": 29.97,
    "paid": true,
    "placed": "2024-01-31"
  }
]`;

export default function JSONToExcelPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to convert JSON to Excel">
            <ol>
              <li>
                <strong>Open the JSON:</strong> drop a .json file on the page, choose it, or paste JSON text, such as an
                API response.
              </li>
              <li>
                <strong>Check the table:</strong> the preview shows the rows and columns the workbook will have, and
                notes anything written as text, such as lists inside a record.
              </li>
              <li>
                <strong>Download the Excel file:</strong> you get an .xlsx workbook with a bold header row, filter
                buttons and column widths that fit the data.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Example: nested JSON to an Excel table">
            <p>This order has a nested customer object, an amount, a true/false value and a date:</p>
            <pre
              tabIndex={0}
              className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <code className="bg-transparent p-0">{EXAMPLE_JSON}</code>
            </pre>
            <p>In Excel it becomes one row:</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table>
                <thead>
                  <tr>
                    <th scope="col">orderId</th>
                    <th scope="col">customer.name</th>
                    <th scope="col">customer.city</th>
                    <th scope="col">total</th>
                    <th scope="col">paid</th>
                    <th scope="col">placed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>A-1001</td>
                    <td>Ayesha Khan</td>
                    <td>Lahore</td>
                    <td>29.97</td>
                    <td>TRUE</td>
                    <td>2024-01-31</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              The total is a number you can add up, TRUE is an Excel true/false value, and the date is a real Excel
              date you can sort and filter by.
            </p>
          </ContentSection>

          <ContentSection title="One sheet per array">
            <p>
              When the JSON is an object whose values are arrays, such as{" "}
              <code>{'{"customers": [...], "orders": [...]}'}</code>, each array becomes its own sheet, named after its
              key. That is also the shape the <Link href="/tools/excel-to-json/">Excel to JSON converter</Link> writes for
              a whole workbook, so a workbook can be turned into JSON, edited and turned back into Excel.
            </p>
          </ContentSection>

          <ContentSection title="Exact numbers and long IDs">
            <p>
              The JSON is read with a parser that keeps numbers exactly as written. Excel stores at most 15 significant
              digits, so numbers longer than that, such as 64-bit IDs and tracking numbers, are written as text with every
              digit kept rather than rounded. Whole numbers of 12 digits or more get a number format that shows all
              digits instead of 1.23E+11.
            </p>
            <p>
              If the JSON will not load, the message gives the line and column of the problem; the{" "}
              <Link href="/tools/json-formatter/">JSON formatter</Link> can fix common mistakes such as trailing commas.
              For a CSV file instead of a workbook, use <Link href="/tools/json-to-csv/">JSON to CSV</Link>.
            </p>
          </ContentSection>
        </>
      }
    >
      <JSONToExcelClient />
    </ToolPageLayout>
  );
}
