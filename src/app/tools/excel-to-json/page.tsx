import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { ExcelToJSONClient } from "@/components/tools/ExcelToJSONClient";

const tool = getToolBySlug("excel-to-json")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

const EXAMPLE_JSON = `[
  {
    "Customer ID": "00123",
    "Name": "Ayesha Khan",
    "Postcode": "54000",
    "Joined": "2024-01-31",
    "Balance": 1250.5,
    "Discount": 0.1,
    "Active": true
  },
  {
    "Customer ID": "00124",
    "Name": "Chen, Wei",
    "Postcode": "02134",
    "Joined": "2024-02-29",
    "Balance": -30,
    "Discount": 0,
    "Active": false
  }
]`;

export default function ExcelToJSONPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to convert Excel to JSON">
            <ol>
              <li>
                <strong>Open the workbook:</strong> drop an .xlsx file on the page or choose it with Open Excel file.
              </li>
              <li>
                <strong>Choose the sheet:</strong> pick a sheet, or tick All sheets to get one JSON object with a key
                for each sheet name.
              </li>
              <li>
                <strong>Choose the shape:</strong> an array of objects uses the first row as keys; an array of arrays
                keeps every row as a list of values.
              </li>
              <li>
                <strong>Copy or download:</strong> copy the JSON or save it as a .json file.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Example: a customer sheet as JSON">
            <p>
              This sheet has a header row and columns with text IDs, ZIP codes formatted with leading zeros, dates,
              amounts, percentages and TRUE/FALSE values. Load the sample above to try it.
            </p>
            <pre
              tabIndex={0}
              className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <code className="bg-transparent p-0">{EXAMPLE_JSON}</code>
            </pre>
          </ContentSection>

          <ContentSection title="How each Excel value becomes JSON">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table>
                <thead>
                  <tr>
                    <th scope="col">In Excel</th>
                    <th scope="col">In the JSON</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Number, such as 1,250.50 or 10%</td>
                    <td>A JSON number with the full stored value: 1250.5, 0.1</td>
                  </tr>
                  <tr>
                    <td>Number formatted as a code with fixed digits (format 00000), such as 02134</td>
                    <td>Text, so the zeros are kept: &quot;02134&quot;</td>
                  </tr>
                  <tr>
                    <td>Date or date and time</td>
                    <td>ISO text: &quot;2024-01-31&quot; or &quot;2024-01-31 14:05:00&quot;</td>
                  </tr>
                  <tr>
                    <td>TRUE / FALSE</td>
                    <td>true / false</td>
                  </tr>
                  <tr>
                    <td>Text</td>
                    <td>A JSON string, with quotes and line breaks escaped</td>
                  </tr>
                  <tr>
                    <td>Empty cell</td>
                    <td>null, or the key is left out</td>
                  </tr>
                  <tr>
                    <td>Formula</td>
                    <td>The result Excel last calculated</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Choose Values: Text exactly as shown in Excel when the JSON should match the sheet character for
              character, for example 1,250.50 and 10% instead of numbers.
            </p>
          </ContentSection>

          <ContentSection title="Using the JSON in code">
            <p>
              The output is standard JSON that <code>JSON.parse</code> in JavaScript, <code>json.load</code> in Python
              and every other JSON library read directly. An array of objects maps to rows of a database table or the
              documents of a collection; keep key names simple by using short, unique column headings in the sheet.
            </p>
            <p>
              To check or reformat the result, paste it into the <Link href="/tools/json-formatter/">JSON formatter</Link>.
              For a spreadsheet you already have as CSV, use <Link href="/tools/csv-to-json/">CSV to JSON</Link>, and to
              get a CSV from the workbook, use <Link href="/tools/excel-to-csv/">Excel to CSV</Link>.
            </p>
          </ContentSection>
        </>
      }
    >
      <ExcelToJSONClient />
    </ToolPageLayout>
  );
}
