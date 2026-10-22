import React from "react";
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
        </>
      }
    >
      <JSONFormatterClient />
    </ToolPageLayout>
  );
}
