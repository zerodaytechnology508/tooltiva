import React from "react";
import Link from "next/link";
import { getToolBySlug } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { SplitCSVClient } from "@/components/tools/SplitCSVClient";

const tool = getToolBySlug("split-csv")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: `/tools/${tool.slug}/`,
});

export default function SplitCSVPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="Three ways to split a CSV file">
            <ul>
              <li>
                <strong>By number of rows:</strong> for example every 10,000 rows, when an import tool, an email
                platform or a CRM only accepts files up to a certain size.
              </li>
              <li>
                <strong>Into equal parts:</strong> for example 4 files, to share the work between people or to run
                batches in parallel. Rows are divided as evenly as possible.
              </li>
              <li>
                <strong>By column value:</strong> one file per country, region, status or customer, so each team
                receives only its own rows.
              </li>
            </ul>
          </ContentSection>

          <ContentSection title="How to split a CSV file online">
            <ol>
              <li>
                <strong>Open the file:</strong> drop it on the page, choose it with Open CSV file, or paste CSV text.
              </li>
              <li>
                <strong>Check the settings:</strong> the separator is detected for you, and the first row is treated
                as the header, which is repeated in every file.
              </li>
              <li>
                <strong>Choose how to split:</strong> rows per file, a number of files, or a column. The list of files
                and their row counts updates as you type.
              </li>
              <li>
                <strong>Download:</strong> save a single part, or all parts at once as a ZIP file.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Every part is a valid CSV file">
            <p>
              Splitting a CSV by cutting the text every few thousand lines breaks any row that has a line break inside
              a quoted value, and leaves every part except the first without column names. This tool parses the file
              as CSV first, so rows are never cut in half, and it writes the header at the top of each part.
            </p>
            <p>
              Parts are saved as UTF-8. When a file contains accented letters or other scripts, a byte order mark
              is added so Excel displays them correctly. Values are written exactly as they are in the original file;
              leading zeros and long numbers are not changed.
            </p>
          </ContentSection>

          <ContentSection title="Large files stay private">
            <p>
              Splitting runs in your browser, so a file with hundreds of thousands of rows is never uploaded and
              there is no file size limit set by a server. The practical limit is your device&apos;s memory: files of
              tens of megabytes split in seconds in a current desktop browser.
            </p>
            <p>
              To look through the file before you split it, open it in the{" "}
              <Link href="/tools/csv-viewer/">CSV Viewer</Link>. If the parts need a different separator, use the{" "}
              <Link href="/tools/csv-delimiter-converter/">CSV Delimiter Converter</Link>. To combine files into one,{" "}
              <Link href="/tools/merge-csv/">merge the CSV files</Link>.
            </p>
          </ContentSection>
        </>
      }
    >
      <SplitCSVClient />
    </ToolPageLayout>
  );
}
