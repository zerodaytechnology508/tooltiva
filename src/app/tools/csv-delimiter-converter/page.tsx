import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { CSVDelimiterConverterClient } from "@/components/tools/CSVDelimiterConverterClient";

const tool = getToolBySlug("csv-delimiter-converter")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function CSVDelimiterConverterPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="What is a CSV delimiter?">
            <p>
              A delimiter, also called a separator, is the character that marks where one value ends and the next
              begins on each line of a CSV file. The comma gives CSV its name (comma-separated values), but many files
              use another character, and a program reading the file needs to use the same one.
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Delimiter</th>
                    <th scope="col">Example line</th>
                    <th scope="col">Where it is common</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Comma <code>,</code></td>
                    <td><code>1001,Lahore,25.50</code></td>
                    <td>The default for most apps, databases and APIs, and Excel in English-language regions.</td>
                  </tr>
                  <tr>
                    <td>Semicolon <code>;</code></td>
                    <td><code>1001;Berlin;25,50</code></td>
                    <td>Excel in regions that use a comma as the decimal mark, such as Germany, France and Italy.</td>
                  </tr>
                  <tr>
                    <td>Tab (shown here as →)</td>
                    <td><code>1001→Paris→25.50</code></td>
                    <td>TSV files, and data copied from a spreadsheet.</td>
                  </tr>
                  <tr>
                    <td>Pipe <code>|</code></td>
                    <td><code>1001|London|25.50</code></td>
                    <td>Database exports and system integrations, because a pipe rarely appears inside values.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ContentSection>

          <ContentSection title="Why a CSV opens in one column in Excel">
            <p>
              Excel splits a CSV using your system&apos;s list separator. In many European locales the comma is the
              decimal separator (for example <code>10,50 €</code>), so Excel expects semicolons between columns and
              puts a comma-separated file into a single column. Converting the file to semicolons, or converting a
              semicolon file to commas for other systems, fixes the column split.
            </p>
          </ContentSection>

          <ContentSection title="Quoted values stay intact">
            <p>
              A plain find-and-replace breaks values that contain the separator, such as <code>&quot;Acme, Inc.&quot;</code>{" "}
              or an address. Tooltiva parses the file using RFC 4180 quoting rules, so separators, quotes and line
              breaks inside quoted values are kept, and values are re-quoted where the new separator needs it.
            </p>
          </ContentSection>

          <ContentSection title="Open a file with another delimiter without converting it">
            <p>
              If you only need to read a file once, you can tell the program which separator to use instead of
              converting the file:
            </p>
            <ul>
              <li>
                <strong>Excel:</strong> on the Data tab, choose From Text/CSV, pick the file, and select the right
                delimiter in the preview before you load it. Opening the file by double-clicking does not ask.
              </li>
              <li>
                <strong>Google Sheets:</strong> choose File, then Import, upload the file and set the separator type.
              </li>
              <li>
                <strong>Windows:</strong> Excel takes its default from the list separator in the Windows region
                settings. Changing it affects every program on the computer, so converting the file is usually the
                safer fix when you share it with others.
              </li>
            </ul>
            <p>
              To check which delimiter a file uses, open it in the{" "}
              <Link href="/tools/csv-viewer/">CSV Viewer</Link>, which detects the separator and shows the columns as
              a table.
            </p>
          </ContentSection>

          <ContentSection title="How to change a CSV delimiter">
            <ol>
              <li>
                <strong>Add your data:</strong> paste text or upload a CSV, TSV or TXT file.
              </li>
              <li>
                <strong>Check the source separator:</strong> it is detected automatically; choose it yourself if the
                file is unusual.
              </li>
              <li>
                <strong>Pick the target separator:</strong> for example semicolon for European Excel, tab for TSV, or
                pipe for database imports.
              </li>
              <li>
                <strong>Review the preview:</strong> check the row count, columns and any warnings.
              </li>
              <li>
                <strong>Export:</strong> copy the result or download it as a CSV file.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Related CSV tasks">
            <ul>
              <li>
                File too large for the program you import it into?{" "}
                <Link href="/tools/split-csv/">Split the CSV file</Link> into smaller files, each with the header row.
              </li>
              <li>
                Need the data for an API or a script?{" "}
                <Link href="/tools/csv-to-json/">Convert the CSV to JSON</Link>.
              </li>
            </ul>
          </ContentSection>
        </>
      }
    >
      <CSVDelimiterConverterClient />
    </ToolPageLayout>
  );
}
