import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { VCFToCSVClient } from "@/components/tools/VCFToCSVClient";

const tool = getToolBySlug("vcf-to-csv")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function VCFToCSVPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to convert VCF to CSV">
            <ol>
              <li>
                <strong>Open the VCF file:</strong> drop it on the page, choose it with Open VCF file, or paste its text.
                Every contact appears in the table straight away.
              </li>
              <li>
                <strong>Pick the separator:</strong> comma for most programs, or semicolon for Excel in regions that use
                a decimal comma.
              </li>
              <li>
                <strong>Download the CSV</strong> and open it in Excel or Google Sheets, or import it into another
                contacts app.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="What the CSV contains">
            <p>Each contact becomes one row. Columns are added only for the information your file actually has:</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Columns</th>
                    <th scope="col">From the VCF</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Full name, First name, Last name</td>
                    <td>The display name and its parts, plus prefix, suffix and nickname when present</td>
                  </tr>
                  <tr>
                    <td>Phone 1, Phone 1 type, Phone 2 …</td>
                    <td>Every number, with labels such as Mobile, Work or a custom iPhone label</td>
                  </tr>
                  <tr>
                    <td>Email 1, Email 1 type …</td>
                    <td>Every email address with its label</td>
                  </tr>
                  <tr>
                    <td>Organization, Job title</td>
                    <td>Company, department and title</td>
                  </tr>
                  <tr>
                    <td>Address 1 …, Website, Birthday, Note</td>
                    <td>Addresses on one line each, websites, birthdays and notes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ContentSection>

          <ContentSection title="Open a VCF file in Excel">
            <p>
              Excel cannot open a VCF file with several contacts as a table, so convert it here first. When you open the
              CSV, Excel may show a long number such as +923001234567 as 9.23E+11. To keep phone numbers exactly as
              written, import the file with Data, From Text/CSV and set the phone columns to Text; the guide on{" "}
              <Link href="/guides/excel-leading-zeros-csv/">stopping Excel from changing numbers</Link> shows each step.
            </p>
          </ContentSection>

          <ContentSection title="Works with VCF files from any phone or app">
            <ul>
              <li>Android exports, including older ones that store non-English names in encoded form.</li>
              <li>iPhone and iCloud exports, with custom phone labels such as &quot;Office line&quot;.</li>
              <li>Google Contacts and Outlook exports, in vCard 2.1, 3.0 or 4.0.</li>
              <li>Thousands of contacts in one file. Cards with no name, number, email or company are skipped and counted.</li>
            </ul>
            <p>
              To turn a sheet back into contacts for a phone, use the{" "}
              <Link href="/tools/csv-to-vcf/">CSV to VCF converter</Link>. To find repeated people in the exported list,
              open the CSV in <Link href="/tools/remove-duplicates-csv/">Remove Duplicate Rows</Link> and compare the phone
              column.
            </p>
          </ContentSection>
        </>
      }
    >
      <VCFToCSVClient />
    </ToolPageLayout>
  );
}
