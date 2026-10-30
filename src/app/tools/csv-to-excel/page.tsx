import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { CSVToExcelClient } from "@/components/tools/CSVToExcelClient";

const tool = getToolBySlug("csv-to-excel")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function CSVToExcelPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to convert CSV to Excel">
            <ol>
              <li>
                <strong>Open the CSV:</strong> drop one or more CSV files on the page, choose them, or paste CSV text.
                The separator (comma, semicolon, tab or pipe) is detected for each file.
              </li>
              <li>
                <strong>Check the columns:</strong> the table under Columns in Excel shows how each column will be
                stored: as text exactly as written, as numbers, or as dates.
              </li>
              <li>
                <strong>Download the Excel file:</strong> you get one .xlsx workbook with a sheet per CSV file, a bold
                header row that stays visible while you scroll, and filter buttons on every column.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="CSV to Excel without changing the format">
            <p>
              Double-clicking a CSV makes Excel guess what each value is, and some guesses change the data for good.
              Converting it here stores each column with its type in an .xlsx file, so Excel has nothing to guess:
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Value in the CSV</th>
                    <th scope="col">CSV opened in Excel</th>
                    <th scope="col">Excel file from this converter</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>02134 (ZIP code)</td>
                    <td>2134</td>
                    <td>02134</td>
                  </tr>
                  <tr>
                    <td>00123 (customer ID)</td>
                    <td>123</td>
                    <td>00123</td>
                  </tr>
                  <tr>
                    <td>923001234567 (phone)</td>
                    <td>9.23E+11</td>
                    <td>923001234567</td>
                  </tr>
                  <tr>
                    <td>1234567890123456789 (order ID)</td>
                    <td>1.23457E+18, last digits lost</td>
                    <td>1234567890123456789</td>
                  </tr>
                  <tr>
                    <td>1250.50</td>
                    <td>1250.5</td>
                    <td>1250.50, still a number</td>
                  </tr>
                  <tr>
                    <td>2024-01-31</td>
                    <td>Reformatted to your region, such as 1/31/2024</td>
                    <td>An Excel date, shown as 2024-01-31</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Values that start with = are stored as plain text, so a cell such as =SUM(A1) is shown as written and is
              never run as a formula.
            </p>
          </ContentSection>

          <ContentSection title="Several CSV files in one workbook">
            <p>
              Add as many CSV files as you need: each becomes its own sheet, named after the file, in a single Excel
              workbook. This is the quick way to send a set of exports, such as customers, orders and products, as one
              file. To stack the rows of several files on one sheet instead, <Link href="/tools/merge-csv/">merge the
              CSV files</Link> first and convert the result.
            </p>
          </ContentSection>

          <ContentSection title="When a CSV opens wrongly in Excel">
            <p>
              If Excel shows every line in a single column, the file uses a different separator than your region
              expects; <Link href="/guides/csv-opens-in-one-column-excel/">this guide explains why</Link>, and the Excel
              file from this converter avoids it entirely. For the full story on disappearing zeros, read{" "}
              <Link href="/guides/excel-leading-zeros-csv/">how to stop Excel removing leading zeros</Link>. To go the
              other way, from an Excel workbook to CSV, use <Link href="/tools/excel-to-csv/">Excel to CSV</Link>.
            </p>
          </ContentSection>
        </>
      }
    >
      <CSVToExcelClient />
    </ToolPageLayout>
  );
}
