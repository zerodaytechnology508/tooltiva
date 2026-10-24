import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { RemoveDuplicatesClient } from "@/components/tools/RemoveDuplicatesClient";

const tool = getToolBySlug("remove-duplicates-csv")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function RemoveDuplicatesPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to remove duplicate rows from a CSV file">
            <ol>
              <li>
                <strong>Open the file:</strong> drop it on the page, choose it with Open CSV file, or paste CSV text.
              </li>
              <li>
                <strong>Choose what counts as a duplicate:</strong> rows where every column matches, or rows where
                only the columns you select match, such as an email address or customer ID.
              </li>
              <li>
                <strong>Check the options:</strong> keep the first or the last row of each duplicate, and decide
                whether upper and lower case and surrounding spaces should be ignored.
              </li>
              <li>
                <strong>Review and download:</strong> preview the kept and the removed rows, then download the cleaned
                CSV. The removed rows can be downloaded as a separate file.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Remove duplicates based on one column">
            <p>
              Exact duplicate rows are easy to spot. The harder case is the same customer exported twice with a
              different city or a differently written email. Comparing only the email column catches those:
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table>
                <thead>
                  <tr>
                    <th scope="col">name</th>
                    <th scope="col">email</th>
                    <th scope="col">city</th>
                    <th scope="col">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Liam O&apos;Brien</td>
                    <td><code>liam@example.com</code></td>
                    <td>Cork</td>
                    <td>Kept (first)</td>
                  </tr>
                  <tr>
                    <td>Liam O&apos;Brien</td>
                    <td><code>Liam@Example.com </code></td>
                    <td>Dublin</td>
                    <td>Removed: same email, ignoring case and the trailing space</td>
                  </tr>
                  <tr>
                    <td>Chen Wei</td>
                    <td>(empty)</td>
                    <td>Shanghai</td>
                    <td>Kept</td>
                  </tr>
                  <tr>
                    <td>Lucas Martin</td>
                    <td>(empty)</td>
                    <td>Lyon</td>
                    <td>Kept: an empty email is not treated as a match</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Choose <strong>keep the last occurrence</strong> when later rows hold the newer data, for example
              Dublin as the customer&apos;s current city.
            </p>
          </ContentSection>

          <ContentSection title="Compared with Remove Duplicates in Excel">
            <ul>
              <li>
                Opening a CSV in Excel can change values before you start: leading zeros are dropped and long ID
                numbers are rounded. Here every value is kept exactly as it is in the file.
              </li>
              <li>
                Excel reports how many duplicates it deleted, but not which rows. This tool lists the removed rows and lets you download
                them, so you can check what was taken out.
              </li>
              <li>
                Spaces before or after a value make two rows different in Excel. Here you can choose to ignore them,
                and to compare upper and lower case exactly or not.
              </li>
            </ul>
          </ContentSection>

          <ContentSection title="Related CSV tasks">
            <p>
              Duplicates often appear after combining exports:{" "}
              <Link href="/tools/merge-csv/">merge the CSV files</Link> first, then remove the duplicate rows here. To
              search and sort the cleaned file, open it in the <Link href="/tools/csv-viewer/">CSV Viewer</Link>.
            </p>
          </ContentSection>
        </>
      }
    >
      <RemoveDuplicatesClient />
    </ToolPageLayout>
  );
}
