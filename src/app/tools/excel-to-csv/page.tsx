import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { ExcelToCSVClient } from "@/components/tools/ExcelToCSVClient";

const tool = getToolBySlug("excel-to-csv")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function ExcelToCSVPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to convert Excel to CSV">
            <ol>
              <li>
                <strong>Open the workbook:</strong> drop an .xlsx file on the page or choose it with Open Excel file.
                On a phone, pick it from Files or your downloads.
              </li>
              <li>
                <strong>Choose the sheet:</strong> a workbook with several sheets shows a sheet list. The preview shows
                the rows exactly as they will be written.
              </li>
              <li>
                <strong>Pick the separator:</strong> comma for most programs, semicolon for Excel in many European
                regions, tab, or pipe for data imports.
              </li>
              <li>
                <strong>Download:</strong> save the sheet as a CSV file, copy it, or download every sheet as CSV files
                in one ZIP.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="What the CSV contains">
            <p>
              A cell in Excel has a stored value and a format that decides how it looks. By default the CSV gets what
              you see in Excel, the same as Excel&apos;s own Save As CSV. Choose unformatted numbers when another
              program needs the plain values.
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Excel shows</th>
                    <th scope="col">Stored value</th>
                    <th scope="col">CSV, as shown</th>
                    <th scope="col">CSV, unformatted</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>02134 (ZIP code, format 00000)</td>
                    <td>2134</td>
                    <td>02134</td>
                    <td>2134</td>
                  </tr>
                  <tr>
                    <td>1,250.50</td>
                    <td>1250.5</td>
                    <td>1,250.50</td>
                    <td>1250.5</td>
                  </tr>
                  <tr>
                    <td>10%</td>
                    <td>0.1</td>
                    <td>10%</td>
                    <td>0.1</td>
                  </tr>
                  <tr>
                    <td>31/01/2024</td>
                    <td>45322 (a date serial)</td>
                    <td>2024-01-31</td>
                    <td>2024-01-31</td>
                  </tr>
                  <tr>
                    <td>TRUE</td>
                    <td>TRUE</td>
                    <td>TRUE</td>
                    <td>TRUE</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Dates are written year first (2024-01-31) by default, which every program reads the same way. Choose
              Dates: As formatted in the workbook to keep the workbook&apos;s own style, such as 31/01/2024.
            </p>
          </ContentSection>

          <ContentSection title="Compared with Save As CSV in Excel">
            <ul>
              <li>
                <strong>All sheets at once:</strong> Excel saves only the active sheet each time. Here every sheet can
                be downloaded in one ZIP.
              </li>
              <li>
                <strong>Non-English text:</strong> Excel&apos;s plain CSV (Comma delimited) uses your computer&apos;s
                code page, which turns Urdu, Arabic or Chinese text into question marks. This converter writes UTF-8 and, unless you turn it off, adds the marker Excel needs to
                read it back.
              </li>
              <li>
                <strong>Other separators:</strong> Excel uses your region&apos;s list separator. Here you choose comma,
                semicolon, tab or pipe for each file.
              </li>
              <li>
                <strong>No Excel needed:</strong> it works on a phone, a Chromebook or any computer with a browser.
              </li>
            </ul>
          </ContentSection>

          <ContentSection title="Formulas, hidden sheets and large files">
            <p>
              Formula cells give the result Excel last calculated, which is what Excel writes to a CSV too. If a
              file was created by a program that does not calculate formulas, the converter tells you how many cells
              have no saved result. Hidden sheets are listed and marked as hidden, merged cells keep their value in the
              first cell, and empty rows and columns around the data are left out.
            </p>
            <p>
              A 13 MB workbook with 200,000 rows and 10 columns converts in a few seconds on a laptop. Very large
              workbooks need enough free memory on your device, because the whole file is processed in the browser.
              Older .xls files, .xlsb files and .ods files must be saved as .xlsx first.
            </p>
          </ContentSection>

          <ContentSection title="Related CSV tasks">
            <p>
              To check the result, open it in the <Link href="/tools/csv-viewer/">CSV viewer</Link>. If Excel shows the
              CSV in one column, read{" "}
              <Link href="/guides/csv-opens-in-one-column-excel/">why a CSV opens in one column</Link>; if leading
              zeros vanish when you reopen it, see{" "}
              <Link href="/guides/excel-leading-zeros-csv/">how to stop Excel removing leading zeros</Link>. For
              structured data, convert the sheet with <Link href="/tools/excel-to-json/">Excel to JSON</Link> instead.
            </p>
          </ContentSection>
        </>
      }
    >
      <ExcelToCSVClient />
    </ToolPageLayout>
  );
}
