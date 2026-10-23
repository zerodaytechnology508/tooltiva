import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("excel-leading-zeros-csv")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <h2>What Excel changes, and why</h2>
      <p>
        A CSV file stores every value as plain text. When you open it by double-clicking, Excel guesses a type for each
        value, and anything that looks like a number is converted to one. Numbers have no leading zeros, so they are
        dropped. The same guessing causes a family of related problems:
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table>
          <thead>
            <tr>
              <th scope="col">In the CSV file</th>
              <th scope="col">Shown in Excel</th>
              <th scope="col">What happened</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>00123</code></td>
              <td><code>123</code></td>
              <td>ZIP code, product code or employee ID read as a number</td>
            </tr>
            <tr>
              <td><code>923001234567</code></td>
              <td><code>9.23001E+11</code></td>
              <td>Long phone number shown in scientific notation</td>
            </tr>
            <tr>
              <td><code>100000000000000001</code></td>
              <td><code>100000000000000000</code></td>
              <td>Excel keeps only 15 significant digits, so the last digits are lost</td>
            </tr>
            <tr>
              <td><code>1-2</code></td>
              <td><code>2-Jan</code></td>
              <td>A size or a range read as a date</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The important point: <strong>the file itself is still correct</strong>. Only Excel&apos;s view of it is wrong.
        The data is lost only when you save the file from Excel, because it then writes the converted values back.
      </p>

      <h2>First, check the original values</h2>
      <p>
        To see the file as it really is, open it in the <Link href="/tools/csv-viewer/">CSV Viewer</Link>. It never
        converts anything, so <code>00123</code> stays <code>00123</code> and long IDs keep every digit. This tells you
        whether the zeros are really in the file or were already lost before it reached you.
      </p>

      <h2>Fix 1: import the file with text columns (Power Query)</h2>
      <ol>
        <li>Open a blank workbook.</li>
        <li>
          On the <strong>Data</strong> tab, choose <strong>From Text/CSV</strong> and select the file.
        </li>
        <li>
          Choose <strong>Transform Data</strong> instead of Load. The Power Query editor opens.
        </li>
        <li>
          Select the columns that must keep their zeros, such as codes, IDs and phone numbers. Set{" "}
          <strong>Data Type</strong> to <strong>Text</strong> and choose <strong>Replace current</strong> when asked.
        </li>
        <li>
          Choose <strong>Close &amp; Load</strong>.
        </li>
      </ol>
      <p>
        Power Query adds a step called &quot;Changed Type&quot; that converts columns automatically. You can also
        delete that step in the Applied Steps list to keep every column as text.
      </p>

      <h2>Fix 2: turn off automatic conversion (Excel for Microsoft 365)</h2>
      <p>
        Recent versions of Excel for Microsoft 365 let you switch the guessing off. Go to <strong>File</strong>,{" "}
        <strong>Options</strong>, <strong>Data</strong>, and under <strong>Automatic Data Conversion</strong> clear{" "}
        <strong>Remove leading zeros and convert to a number</strong>, and the options for long numbers and dates if
        they cause trouble too. After that, opening a CSV by double-click keeps the zeros. Older versions of Excel do
        not have these options.
      </p>

      <h2>Fix 3: Google Sheets</h2>
      <p>
        In Google Sheets, choose <strong>File</strong>, <strong>Import</strong>, upload the file, and set{" "}
        <strong>Convert text to numbers, dates, and formulas</strong> to <strong>No</strong>. Every value then stays
        as it is in the file.
      </p>

      <h2>If the zeros are already gone</h2>
      <p>
        If someone saved the file from Excel, the zeros are no longer in it. For codes with a fixed length, you can
        rebuild them: for 5-digit ZIP codes in column A, the formula <code>=TEXT(A2,&quot;00000&quot;)</code> pads
        each value back to five digits. Long IDs that lost their last digits cannot be repaired this way; get a fresh
        export from the source.
      </p>

      <h2>When you create CSV files for Excel users</h2>
      <p>
        You cannot make a plain CSV that every Excel opens with zeros intact, because the guessing happens on the
        reader&apos;s side. Two practical habits help:
      </p>
      <ul>
        <li>Tell recipients to import the file (Fix 1) rather than double-click it.</li>
        <li>
          For data that will be opened in Excel only, sending an Excel file (.xlsx) with the columns formatted as
          text avoids the problem entirely.
        </li>
      </ul>
      <p>
        Avoid tricks such as writing values as <code>=&quot;00123&quot;</code>. Excel shows them correctly, but every
        other program reads the formula characters as part of the value.
      </p>

      <h2>Summary</h2>
      <ul>
        <li>Excel removes leading zeros because it converts number-like text to numbers when it opens a CSV.</li>
        <li>The file stays correct until you save it from Excel.</li>
        <li>Import with text columns, or turn off automatic conversion in Excel for Microsoft 365.</li>
      </ul>
    </GuideLayout>
  );
}
