import React from "react";
import Link from "next/link";
import { getToolBySlug } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { JSONFormatterClient } from "@/components/tools/JSONFormatterClient";

const tool = getToolBySlug("json-formatter")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: `/tools/${tool.slug}/`,
});

export default function JSONFormatterPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to fix invalid JSON online">
            <ol>
              <li>
                <strong>Paste your JSON</strong> into the editor, or load the invalid sample to see how it works.
              </li>
              <li>
                <strong>Read the error:</strong> the validator names the problem and shows its line and column, with
                the line itself and a marker under the exact character.
              </li>
              <li>
                <strong>Click Auto-Fix Syntax</strong> to repair trailing commas, single quotes, unquoted keys and
                comments. Check the list of repairs; Undo Auto-Repair brings back your original text.
              </li>
              <li>
                <strong>Fix anything left by hand</strong> at the reported position, such as a missing comma between
                two values or a bracket that is never closed. Auto-Fix does not guess at these, because the right
                repair depends on what you meant.
              </li>
              <li>
                <strong>Format and copy:</strong> indent with 2 or 4 spaces, or minify, then copy or download the
                valid JSON.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Auto-Fix with a log you can undo">
            <p>
              Auto-Fix repairs the mistakes that most often make JSON invalid: trailing commas, single-quoted strings,
              unquoted keys and JavaScript comments. Every repair is listed with its count, and one click restores
              your original text. Text inside valid strings is never changed.
            </p>
          </ContentSection>

          <ContentSection title="Exact numbers and duplicate keys">
            <p>
              Many formatters run your JSON through <code>JSON.parse</code>, which silently rounds large integers such
              as <code>9007199254740993</code>, rewrites <code>1.0</code> as <code>1</code> and drops duplicate keys.
              Tooltiva formats from the original text, so numbers keep their exact digits and duplicate keys are kept
              and reported with their line.
            </p>
          </ContentSection>

          <ContentSection title="Common JSON errors">
            <ul>
              <li>
                <strong>Trailing commas:</strong> a comma after the last item, such as <code>{'{ "a": 1, }'}</code>, is
                allowed in JavaScript but not in JSON.
              </li>
              <li>
                <strong>Single quotes:</strong> JSON strings and keys must use double quotes.
              </li>
              <li>
                <strong>Unquoted keys:</strong> object literals such as <code>{'{ name: "Alice" }'}</code> need quoted
                keys.
              </li>
              <li>
                <strong>Comments:</strong> neither <code>{"//"}</code> nor <code>{"/* */"}</code> comments are valid
                JSON.
              </li>
            </ul>
          </ContentSection>

          <ContentSection title="View JSON as a tree">
            <p>
              Switch to Tree View to browse nested objects and arrays with their item counts, which is easier than
              scrolling through long formatted text when you inspect an API response or a config file.
            </p>
          </ContentSection>

          <ContentSection title="Turn JSON into a table">
            <p>
              Once the JSON is valid, you can open an array of records in a spreadsheet: the{" "}
              <Link href="/tools/json-to-csv/">JSON to CSV converter</Link> flattens it into columns. For the other
              direction, <Link href="/tools/csv-to-json/">convert CSV to JSON</Link>.
            </p>
          </ContentSection>
        </>
      }
    >
      <JSONFormatterClient />
    </ToolPageLayout>
  );
}
