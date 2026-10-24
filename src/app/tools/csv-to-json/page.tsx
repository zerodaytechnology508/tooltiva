import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { CSVToJSONClient } from "@/components/tools/CSVToJSONClient";

const tool = getToolBySlug("csv-to-json")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function CSVToJSONPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="CSV and JSON: when to use which">
            <p>
              CSV is the common format for tables in Excel, Google Sheets and database exports. JSON is the format most
              APIs and web apps read and write. Converting CSV to JSON lets you load spreadsheet data into code, test
              fixtures or an API request without writing a parser.
            </p>
          </ContentSection>

          <ContentSection title="Values are kept exactly as written">
            <p>
              CSV stores every value as text, and by default the converter keeps it that way, so identifiers such as{" "}
              <code>00123</code>, codes such as <code>1e5</code> and empty cells reach your JSON unchanged.
            </p>
            <p>
              If you choose &quot;Convert exact numbers &amp; true/false&quot;, a value becomes a JSON number or boolean
              only when that form is spelled exactly like the original, for example <code>42</code>, <code>-7</code>,{" "}
              <code>98.5</code> or <code>true</code>. Anything that would change, such as leading zeros or numbers too
              large to store exactly, stays text.
            </p>
          </ContentSection>

          <ContentSection title="How to convert CSV to JSON">
            <ol>
              <li>
                <strong>Add your CSV:</strong> paste it or upload a .csv or .txt file. The first row is used as the
                property names.
              </li>
              <li>
                <strong>Choose the JSON shape:</strong> an array of objects, or a 2D array of rows.
              </li>
              <li>
                <strong>Choose value types and indentation:</strong> keep text, or convert exact numbers and
                true/false; pretty-print with 2 or 4 spaces, or minify.
              </li>
              <li>
                <strong>Check the table preview</strong> for the row count, columns and any warnings.
              </li>
              <li>
                <strong>Export:</strong> copy the JSON or download it as a file.
              </li>
            </ol>
            <p>
              Starting from JSON instead? Use the <Link href="/tools/json-to-csv/">JSON to CSV converter</Link>. To
              check or pretty-print JSON you already have, use the{" "}
              <Link href="/tools/json-formatter/">JSON formatter and validator</Link>.
            </p>
          </ContentSection>
        </>
      }
    >
      <CSVToJSONClient />
    </ToolPageLayout>
  );
}
