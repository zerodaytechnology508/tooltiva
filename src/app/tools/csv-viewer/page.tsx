import React from "react";
import Link from "next/link";
import { getToolBySlug } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { CSVViewerClient } from "@/components/tools/CSVViewerClient";

const tool = getToolBySlug("csv-viewer")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: `/tools/${tool.slug}/`,
});

export default function CSVViewerPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="Open a CSV file without Excel">
            <p>
              A CSV file is plain text, but reading it as text is hard once it has more than a few columns. The CSV
              Viewer shows it as a table with a fixed header row and row numbers, so you can check an export, find a
              record or compare values without installing anything or signing in.
            </p>
          </ContentSection>

          <ContentSection title="See the values exactly as they are in the file">
            <p>
              Spreadsheet apps change values while they open a CSV. A ZIP or product code such as <code>00184</code>{" "}
              loses its leading zeros, an ID such as <code>100000000000000001</code> turns into{" "}
              <code>1E+17</code>, and text that looks like a date is reformatted. The viewer never converts anything:
              what you see is what the file contains.
            </p>
            <p>
              If you need the data in another format afterwards, export the rows you want, or use the{" "}
              <Link href="/tools/csv-to-json/">CSV to JSON converter</Link>. If the file opens in a single column in
              Excel, <Link href="/tools/csv-delimiter-converter/">change the CSV delimiter</Link> to the one Excel
              expects.
            </p>
          </ContentSection>

          <ContentSection title="How to view a CSV file online">
            <ol>
              <li>
                <strong>Open the file:</strong> drop it on the page, choose it with Open CSV file, or paste CSV text.
              </li>
              <li>
                <strong>Check the separator:</strong> comma, semicolon, tab or pipe is detected for you; change it if
                the columns look wrong.
              </li>
              <li>
                <strong>Search and sort:</strong> type in the search box to filter rows, in every column or one, and
                click a column name to sort.
              </li>
              <li>
                <strong>Export what you need:</strong> download or copy the rows currently shown as a new CSV file.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Large files and messy data">
            <ul>
              <li>
                Only the rows on screen are drawn, so scrolling stays smooth with very large files. To break a file
                into smaller ones, <Link href="/tools/split-csv/">split the CSV</Link> by rows or by a column.
              </li>
              <li>
                Rows with missing or extra fields are shown with empty cells and reported, instead of breaking the
                table.
              </li>
              <li>
                Files saved by older versions of Excel in Windows-1252 encoding are detected and read correctly, with
                a notice.
              </li>
              <li>
                A malformed file, such as one with an unclosed quote, shows the exact line and column of the problem.
              </li>
            </ul>
          </ContentSection>
        </>
      }
    >
      <CSVViewerClient />
    </ToolPageLayout>
  );
}
