import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("compare-two-csv-files")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <p>
        You have last month&apos;s export and this month&apos;s, or the file you sent and the file that came back, and
        you need to know what changed. Before choosing a method, answer one question:{" "}
        <strong>are the rows in the same order in both files?</strong>
      </p>
      <ul>
        <li>
          <strong>Yes, same order:</strong> any line-by-line comparison works, including Notepad++ and VS Code.
        </li>
        <li>
          <strong>No, or not sure:</strong> database exports, CRM downloads and anything sorted differently need a
          comparison that pairs rows by a <em>key column</em>, such as an ID, email address or SKU. Otherwise one
          inserted row makes every row after it look different.
        </li>
      </ul>

      <h2>Method 1: compare by key column online</h2>
      <p>
        <Link href="/tools/compare-csv/">Compare CSV Files</Link> pairs rows by a key column and runs in your browser,
        so neither file is uploaded.
      </p>
      <ol>
        <li>Open the older file as file 1 and the newer file as file 2.</li>
        <li>
          Check the key column. The tool suggests one that is unique in both files, such as <code>id</code>; you can
          choose a different one, or several, such as first and last name.
        </li>
        <li>
          Read the result: rows only in file 1 (removed), rows only in file 2 (added), and changed rows, where each
          changed cell shows the new value with the old one crossed out.
        </li>
        <li>Download the differences, or a list of every changed cell with its old and new value.</li>
      </ol>
      <p>
        Columns are matched by name, so a different column order is not reported as a change. Extra spaces around
        values are ignored by default, and you can also ignore upper and lower case or treat <code>14.50</code> and{" "}
        <code>14.5</code> as equal.
      </p>

      <h2>Method 2: compare two CSV files in Excel</h2>
      <p>
        Excel has no compare button for CSV files, but a lookup formula does the job for a key column. Import both
        files with <strong>Data → From Text/CSV</strong> rather than double-clicking them, so codes such as{" "}
        <code>00123</code> keep their leading zeros. Put them on two sheets, <code>Old</code> and <code>New</code>,
        with the key in column A.
      </p>
      <ol>
        <li>
          <strong>Rows removed:</strong> in the Old sheet, add a column with{" "}
          <code>=IF(COUNTIF(New!A:A, A2)=0, &quot;removed&quot;, &quot;&quot;)</code> and fill it down. Do the same in
          the New sheet against <code>Old!A:A</code> to find added rows.
        </li>
        <li>
          <strong>Changed values:</strong> to check column C, use{" "}
          <code>=IF(XLOOKUP($A2, New!$A:$A, New!C:C, &quot;&quot;)&lt;&gt;C2, &quot;changed&quot;, &quot;&quot;)</code>.
          In versions without XLOOKUP, use <code>VLOOKUP($A2, New!$A:$Z, 3, FALSE)</code> instead.
        </li>
        <li>
          <strong>Highlight the differences:</strong> select the data in the Old sheet, choose{" "}
          <strong>Home → Conditional Formatting → New Rule → Use a formula</strong>, and enter{" "}
          <code>=C2&lt;&gt;XLOOKUP($A2, New!$A:$A, New!C:C, &quot;&quot;)</code> with a fill colour.
        </li>
      </ol>
      <p>
        This works, but you need a formula for each column you care about, and it gets slow with tens of thousands of
        rows. Microsoft&apos;s Spreadsheet Compare app is included only in some Office editions, and it compares
        workbooks cell by cell by position, so it has the same problem with reordered rows as a text comparison.
      </p>

      <h2>Method 3: Notepad++ with the Compare plugin</h2>
      <ol>
        <li>
          Open <strong>Plugins → Plugins Admin</strong>, search for <strong>Compare</strong>, tick it and click
          Install.
        </li>
        <li>Open both CSV files, then choose <strong>Plugins → Compare → Compare</strong>.</li>
      </ol>
      <p>
        Changed, added and removed lines are highlighted side by side. Notepad++ compares lines of text, not
        columns: it shows that a line changed, and marks the characters that differ, but it does not know which
        column a value belongs to. If the rows are in a different order, sort both files first with{" "}
        <strong>Edit → Line Operations → Sort Lines Lexicographically Ascending</strong>, which only lines them up
        when each line starts with the key and the header is moved out of the way.
      </p>

      <h2>Method 4: VS Code</h2>
      <p>
        In the Explorer, select both files with Ctrl-click, right-click and choose <strong>Compare Selected</strong>.
        From a terminal, <code>code --diff old.csv new.csv</code> opens the same view. Like Notepad++, it compares
        lines, so it is best for files that keep their order, such as a configuration list or a report generated
        twice.
      </p>

      <h2>Method 5: PowerShell or Python</h2>
      <p>For a repeatable job, a short script compares by key. In PowerShell:</p>
      <pre tabIndex={0} aria-label="PowerShell example">{`$old = Import-Csv old.csv
$new = Import-Csv new.csv
Compare-Object $old $new -Property id, name, price |
  Sort-Object id | Format-Table`}</pre>
      <p>
        Rows marked <code>&lt;=</code> exist only in the old file, rows marked <code>=&gt;</code> only in the new
        one; a changed row appears once on each side. In Python, pandas does the same with{" "}
        <code>old.merge(new, on=&quot;id&quot;, how=&quot;outer&quot;, indicator=True)</code>, where the{" "}
        <code>_merge</code> column says <code>left_only</code>, <code>right_only</code> or <code>both</code>.
      </p>

      <h2>Which method to choose</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens">
        <table>
          <thead>
            <tr>
              <th scope="col">Method</th>
              <th scope="col">Rows in a different order</th>
              <th scope="col">Shows which column changed</th>
              <th scope="col">Setup</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Compare CSV Files (online)</td>
              <td>Yes, by key column</td>
              <td>Yes, with old and new value</td>
              <td>None</td>
            </tr>
            <tr>
              <td>Excel formulas</td>
              <td>Yes, by key column</td>
              <td>Only for columns you write a formula for</td>
              <td>A formula per column</td>
            </tr>
            <tr>
              <td>Notepad++ Compare</td>
              <td>No</td>
              <td>Marks characters within the line</td>
              <td>Install the plugin</td>
            </tr>
            <tr>
              <td>VS Code</td>
              <td>No</td>
              <td>Marks characters within the line</td>
              <td>VS Code installed</td>
            </tr>
            <tr>
              <td>PowerShell or pandas</td>
              <td>Yes</td>
              <td>With more code</td>
              <td>Writing a script</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Before you compare: three checks</h2>
      <ul>
        <li>
          <strong>Duplicate keys:</strong> if an ID appears twice in a file, any key-based comparison has to guess
          which rows belong together. Find them first with{" "}
          <Link href="/tools/remove-duplicates-csv/">Remove Duplicate Rows</Link> on the ID column.
        </li>
        <li>
          <strong>Separators and encoding:</strong> a semicolon file from a European Excel and a comma file from a
          database look completely different to a text comparison. Compare CSV Files reads each file with its own
          separator.
        </li>
        <li>
          <strong>Formatting changes:</strong> <code>1.50</code> versus <code>1.5</code>, or a trailing space, are
          real differences in the file but rarely real changes. Decide whether to ignore them before you count
          differences.
        </li>
      </ul>
      <p>
        If you need both versions in one file afterwards rather than a list of differences,{" "}
        <Link href="/tools/merge-csv/">merge the CSV files</Link> instead.
      </p>
    </GuideLayout>
  );
}
