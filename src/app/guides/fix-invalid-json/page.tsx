import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("fix-invalid-json")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

function Example({ bad, good }: { bad: string; good: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Invalid</p>
        <pre tabIndex={0} className="mt-1">
          <code>{bad}</code>
        </pre>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">Valid</p>
        <pre tabIndex={0} className="mt-1">
          <code>{good}</code>
        </pre>
      </div>
    </div>
  );
}

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <h2>Start with the exact position of the error</h2>
      <p>
        JSON parsers stop at the first character they cannot accept and report its position, in messages such as{" "}
        <code>Unexpected token</code>, <code>Expected double-quoted property name</code> or, in Python,{" "}
        <code>Expecting &apos;,&apos; delimiter: line 4 column 3</code>. The real mistake is at that position or just
        before it.
      </p>
      <p>
        Paste the JSON into the <Link href="/tools/json-formatter/">JSON Formatter &amp; Fixer</Link> to see the error
        with its line and column, the line itself and a marker under the character. Then compare it with the list below.
      </p>

      <h2>1. Trailing comma</h2>
      <p>A comma after the last item of an object or array is allowed in JavaScript, but not in JSON.</p>
      <Example bad={`{\n  "id": 1,\n  "name": "Ayesha",\n}`} good={`{\n  "id": 1,\n  "name": "Ayesha"\n}`} />

      <h2>2. Single quotes</h2>
      <p>Strings and property names must use double quotes. Single quotes are not JSON.</p>
      <Example bad={`{ 'name': 'Ayesha' }`} good={`{ "name": "Ayesha" }`} />

      <h2>3. Unquoted property names</h2>
      <p>
        JavaScript object literals allow <code>{"{ name: 1 }"}</code>; JSON requires every property name in double
        quotes.
      </p>
      <Example bad={`{ name: "Ayesha", age: 31 }`} good={`{ "name": "Ayesha", "age": 31 }`} />

      <h2>4. Comments</h2>
      <p>
        JSON has no comments, neither <code>{"//"}</code> nor <code>{"/* */"}</code>. Configuration formats such as
        JSONC and JSON5 allow them, but a standard JSON parser does not.
      </p>
      <Example bad={`{\n  // retry count\n  "retries": 3\n}`} good={`{\n  "retries": 3\n}`} />
      <p>
        The JSON Formatter&apos;s <strong>Auto-Fix Syntax</strong> repairs these first four mistakes in one click and
        lists every change, with an undo.
      </p>

      <h2>5. Missing comma between items</h2>
      <p>
        Often the result of adding a line by hand. The error is reported at the start of the second item, because that
        is where the parser expected a comma.
      </p>
      <Example bad={`{\n  "id": 1\n  "name": "Ayesha"\n}`} good={`{\n  "id": 1,\n  "name": "Ayesha"\n}`} />

      <h2>6. Unclosed or mismatched brackets</h2>
      <p>
        Every <code>{"{"}</code> needs a <code>{"}"}</code> and every <code>[</code> a <code>]</code>, closed in the
        reverse order they were opened. A missing one is usually reported at the very end of the text, so check where
        the structure stops making sense. Formatting the JSON with indentation makes the nesting visible.
      </p>
      <Example bad={`{ "tags": ["csv", "json" }`} good={`{ "tags": ["csv", "json"] }`} />

      <h2>7. Unescaped characters inside strings</h2>
      <p>
        A double quote inside a string must be written <code>\&quot;</code>, a backslash <code>\\</code>, and a line
        break <code>\n</code>. A real line break or tab inside a string is invalid. Windows paths are a common source:
        each backslash has to be doubled.
      </p>
      <Example
        bad={`{ "title": "The "best" tool",\n  "path": "C:\\Users\\data" }`}
        good={`{ "title": "The \\"best\\" tool",\n  "path": "C:\\\\Users\\\\data" }`}
      />

      <h2>8. Values that are not JSON</h2>
      <p>
        JSON allows only strings, numbers, <code>true</code>, <code>false</code>, <code>null</code>, objects and
        arrays. These come from other languages and are invalid:
      </p>
      <ul>
        <li>
          <code>undefined</code>, <code>NaN</code> and <code>Infinity</code> from JavaScript;
        </li>
        <li>
          <code>True</code>, <code>False</code> and <code>None</code> from Python (JSON uses lowercase{" "}
          <code>true</code>, <code>false</code> and <code>null</code>);
        </li>
        <li>
          numbers with leading zeros such as <code>007</code>, or hexadecimal such as <code>0xFF</code>. Write codes
          with leading zeros as strings: <code>&quot;007&quot;</code>.
        </li>
      </ul>

      <h2>9. It is not one JSON document</h2>
      <p>Some errors mean the text is something else entirely:</p>
      <ul>
        <li>
          <strong>An error at the very first character, often &lt;:</strong> the response is an HTML page, typically
          an error or login page from the server, not JSON. Check the URL and the status code.
        </li>
        <li>
          <strong>An error at the start of the second line:</strong> the text may be JSON Lines, with one JSON object
          per line, as used by many logs and data exports. Each line is valid on its own; read it line by line, or wrap
          the objects in an array with commas between them.
        </li>
      </ul>

      <h2>Once it is valid</h2>
      <p>
        Format it with 2 or 4 spaces for reading, or minify it for sending. If the JSON is an array of records and you
        need it in a spreadsheet, the <Link href="/tools/json-to-csv/">JSON to CSV converter</Link> turns it into
        columns.
      </p>
    </GuideLayout>
  );
}
