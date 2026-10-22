import React from "react";
import { getToolBySlug } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { CSVDelimiterConverterClient } from "@/components/tools/CSVDelimiterConverterClient";

const tool = getToolBySlug("csv-delimiter-converter")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: `/tools/${tool.slug}/`,
});

export default function CSVDelimiterConverterPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
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
        </>
      }
    >
      <CSVDelimiterConverterClient />
    </ToolPageLayout>
  );
}
