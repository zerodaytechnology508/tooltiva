import React from "react";
import Link from "next/link";
import { getToolBySlug } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { MergeCSVClient } from "@/components/tools/MergeCSVClient";

const tool = getToolBySlug("merge-csv")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: `/tools/${tool.slug}/`,
});

export default function MergeCSVPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to merge CSV files into one">
            <ol>
              <li>
                <strong>Add the files:</strong> drop them on the page or choose them with Open CSV files. You can add
                more at any time.
              </li>
              <li>
                <strong>Put them in order:</strong> rows are added file by file, in the order of the list. Use the
                arrows to move a file up or down.
              </li>
              <li>
                <strong>Check the options:</strong> columns are matched by name; add a column with the file name if
                you need to know where each row came from.
              </li>
              <li>
                <strong>Review and download:</strong> check the column report and the preview, then download the
                merged CSV.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Combine CSV files with different columns">
            <p>
              Monthly exports rarely match exactly: a column is added in March, another is renamed from{" "}
              <code>Order ID</code> to <code>order_id</code>, or the columns come in a different order. Copying the
              files below each other in a spreadsheet then puts values under the wrong headings.
            </p>
            <p>
              Matching by column name avoids that. The merged file contains every column found in any file, and each
              value lands under its own header:
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table>
                <thead>
                  <tr>
                    <th scope="col">File</th>
                    <th scope="col">Header row</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>january.csv</td>
                    <td><code>order_id,customer,city,amount</code></td>
                  </tr>
                  <tr>
                    <td>february.csv</td>
                    <td><code>Customer;Order_ID;Amount;City;Discount</code></td>
                  </tr>
                  <tr>
                    <td><strong>merged.csv</strong></td>
                    <td><code>order_id,customer,city,amount,Discount</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              January rows get an empty Discount cell, and the tool tells you so, instead of silently shifting
              columns.
            </p>
          </ContentSection>

          <ContentSection title="Values are kept exactly as written">
            <ul>
              <li>
                Leading zeros, long ID numbers and dates are copied as text and never reformatted, unlike when files
                are combined in a spreadsheet app.
              </li>
              <li>
                Each file can use its own separator and encoding: a semicolon file from a European Excel and a comma
                file from a database merge without any preparation.
              </li>
              <li>
                Quoted values with commas, quotes or line breaks inside them are read and written correctly.
              </li>
              <li>A file with a problem, such as an unclosed quote, is reported with its line and column and left out.</li>
            </ul>
          </ContentSection>

          <ContentSection title="Related CSV tasks">
            <p>
              To go the other way and break one large file into smaller ones,{" "}
              <Link href="/tools/split-csv/">split the CSV file</Link> by rows or by a column. To look through the
              merged result, open it in the <Link href="/tools/csv-viewer/">CSV Viewer</Link>, where you can search
              and sort it.
            </p>
          </ContentSection>
        </>
      }
    >
      <MergeCSVClient />
    </ToolPageLayout>
  );
}
