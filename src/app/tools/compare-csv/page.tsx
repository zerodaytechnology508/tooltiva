import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { CompareCSVClient } from "@/components/tools/CompareCSVClient";

const tool = getToolBySlug("compare-csv")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function CompareCSVPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to compare two CSV files">
            <ol>
              <li>
                <strong>Open both files:</strong> the original as file 1 and the newer version as file 2. Drop them on
                the page, choose them with Open CSV file, or paste the CSV text. Each file&apos;s separator is detected on
                its own, so a comma file can be compared with a semicolon file.
              </li>
              <li>
                <strong>Check how rows are matched:</strong> the tool picks a key column that is filled in and unique
                in both files, such as <code>id</code>, <code>email</code> or <code>sku</code>. Choose other key
                columns, or match whole rows, if the suggestion is not right.
              </li>
              <li>
                <strong>Decide what counts as the same:</strong> extra spaces around values are ignored by default.
                You can also ignore upper and lower case, treat 14.50 and 14.5 as equal, and leave columns such as a
                timestamp out of the comparison.
              </li>
              <li>
                <strong>Review and download:</strong> switch between changed, added and removed rows, then download
                the differences as a CSV file, or a list of every changed cell with its old and new value.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Example: two versions of a product list">
            <p>
              The September and October exports below differ in several ways: prices, stock and a product name were
              edited, one product was dropped, one was added, and October has a new <code>supplier</code> column. Matched by <code>sku</code>, the result is:
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table>
                <thead>
                  <tr>
                    <th scope="col">sku</th>
                    <th scope="col">September</th>
                    <th scope="col">October</th>
                    <th scope="col">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>A100</code></td>
                    <td>stock 120</td>
                    <td>stock 95</td>
                    <td>Changed: stock</td>
                  </tr>
                  <tr>
                    <td><code>A101</code></td>
                    <td>price 9.99</td>
                    <td>price 8.99</td>
                    <td>Changed: price</td>
                  </tr>
                  <tr>
                    <td><code>A102</code></td>
                    <td>Laptop Stand</td>
                    <td>(not in the file)</td>
                    <td>Removed</td>
                  </tr>
                  <tr>
                    <td><code>A103</code></td>
                    <td>price 14.50</td>
                    <td>price 14.5</td>
                    <td>Changed, or unchanged with Equal numbers on</td>
                  </tr>
                  <tr>
                    <td><code>A104</code></td>
                    <td>Webcam 1080p</td>
                    <td>Webcam 1080p HD</td>
                    <td>Changed: product</td>
                  </tr>
                  <tr>
                    <td><code>A105</code></td>
                    <td>(not in the file)</td>
                    <td>Mechanical Keyboard</td>
                    <td>Added</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              The <code>supplier</code> column is reported as only in file 2 and is not compared, so it does not turn
              every row into a change. Press <strong>Load sample</strong> above to try this example.
            </p>
          </ContentSection>

          <ContentSection title="Three ways to match rows">
            <ul>
              <li>
                <strong>Key column:</strong> the best choice when each row has an identifier. Rows are paired by
                their key wherever they are in the file, and you see exactly which cells changed. Select several
                columns, such as first name and last name, when no single column is unique.
              </li>
              <li>
                <strong>Whole rows, in any order:</strong> for files without an identifier. A row is unchanged when
                the identical row exists anywhere in the other file; otherwise it is listed as only in file 1 or
                only in file 2. A row with one edited cell therefore appears as one removed and one added row.
              </li>
              <li>
                <strong>Row position:</strong> row 1 is compared with row 1, row 2 with row 2, and so on. Use it only
                when both files are in the same order, for example the same report run twice. One inserted row shifts
                every row after it.
              </li>
            </ul>
          </ContentSection>

          <ContentSection title="What the downloads contain">
            <ul>
              <li>
                <strong>Download differences:</strong> one row for each added, removed or changed row, with the
                change, the row number in each file, the names of the changed columns, and every column&apos;s value
                from file 2 (from file 1 for removed rows).
              </li>
              <li>
                <strong>Changed cells:</strong> one row for each changed cell, with the key, the column name, the
                value in file 1 and the value in file 2. This is the easiest file to review or filter in a
                spreadsheet.
              </li>
              <li>
                <strong>Download these rows:</strong> on the Added or Removed view, the rows that are only in one
                file, with that file&apos;s own columns, ready to import somewhere else.
              </li>
            </ul>
            <p>
              Values are written exactly as they are in your files. With spreadsheet-safe downloads on, a value that
              starts with =, +, - or @ gets an apostrophe in front so Excel shows it as text instead of running it as
              a formula.
            </p>
          </ContentSection>

          <ContentSection title="Edge cases the comparison handles">
            <ul>
              <li>
                <strong>Duplicate keys:</strong> when a key appears more than once, the rows are paired in file order
                and a notice names an example, so you can add a second key column.
              </li>
              <li>
                <strong>Empty keys:</strong> a row with no key cannot be matched, so it is listed as only in one file
                instead of being paired with an unrelated row.
              </li>
              <li>
                <strong>Values with commas, quotes or line breaks</strong> inside quotes are read as one cell, so they
                never shift the columns.
              </li>
              <li>
                <strong>Leading zeros and long numbers</strong> such as <code>00123</code> or a 16-digit ID are
                compared as written. Nothing is converted the way Excel converts values when it opens a CSV.
              </li>
            </ul>
          </ContentSection>

          <ContentSection title="Compared with Excel and Notepad++">
            <p>
              Comparing in Excel usually means a lookup formula such as <code>XLOOKUP</code> or{" "}
              <code>COUNTIF</code> for every column you want to check, and Excel may already have changed codes and
              IDs while opening the files. Text comparison tools, including the Compare plugin for Notepad++, compare
              lines: they do not know which column changed, and a different row order makes almost every line look
              different. Matching by a key column avoids both problems.
            </p>
          </ContentSection>

          <ContentSection title="Related CSV tasks">
            <p>
              To combine the two versions into one file, use <Link href="/tools/merge-csv/">Merge CSV Files</Link>,
              then <Link href="/tools/remove-duplicates-csv/">remove the duplicate rows</Link>. To search
              and sort a single file, open it in the <Link href="/tools/csv-viewer/">CSV Viewer</Link>. If one file
              uses semicolons and you need both with commas, the{" "}
              <Link href="/tools/csv-delimiter-converter/">CSV Delimiter Converter</Link> changes the separator.
            </p>
          </ContentSection>
        </>
      }
    >
      <CompareCSVClient />
    </ToolPageLayout>
  );
}
