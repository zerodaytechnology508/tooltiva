import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("combine-csv-files")!;

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
        Monthly exports, one file per branch, reports from several systems: sooner or later the data you need is spread
        over several CSV files. Combining them sounds like copying one file under the other, and sometimes it is. Three
        things decide which method works:
      </p>
      <ul>
        <li>
          <strong>Headers:</strong> each file starts with its own header row, and the combined file should have only
          one.
        </li>
        <li>
          <strong>Column order:</strong> if one file has <code>name,email</code> and another{" "}
          <code>email,name</code>, copying puts emails under the name heading.
        </li>
        <li>
          <strong>Different columns:</strong> a column added in March, or one renamed from <code>Order ID</code> to{" "}
          <code>order_id</code>, has to end up in the right place.
        </li>
      </ul>

      <h2>Method 1: a tool that matches columns by name</h2>
      <p>
        <Link href="/tools/merge-csv/">Merge CSV Files</Link> handles all three problems and runs in your browser, so
        the files are not uploaded anywhere.
      </p>
      <ol>
        <li>Drop all the files on the page, or choose them with Open CSV files.</li>
        <li>Put them in the order you want the rows to appear.</li>
        <li>
          Keep <strong>Match columns: By column name</strong>. Columns are matched ignoring upper and lower case and
          surrounding spaces, so <code>Order_ID</code> and <code>order_id</code> become one column.
        </li>
        <li>
          Optionally, add a column with the file name, so you can still tell which file each row came from.
        </li>
        <li>Download the merged CSV.</li>
      </ol>
      <p>
        If the files do not all have the same columns, the tool lists which file adds or lacks which column; rows from a
        file without a column get an empty cell there. Each file&apos;s separator is detected separately, so a
        semicolon file from a European Excel and a comma file from a database combine without preparation.
      </p>

      <h2>Method 2: Power Query in Excel</h2>
      <p>
        Excel can combine every CSV in a folder: on the <strong>Data</strong> tab choose <strong>Get Data</strong>,{" "}
        <strong>From File</strong>, <strong>From Folder</strong>, select the folder, then choose{" "}
        <strong>Combine &amp; Load</strong>. Excel uses the first file as a sample to decide the columns and their
        types.
      </p>
      <p>
        This is a good choice when you combine the same folder every month, because you can refresh the query. Watch
        for two things: Excel converts values the way it always does, so codes can lose leading zeros, and columns that
        do not appear in the sample file can be left out of the result unless you edit the query.
      </p>

      <h2>Method 3: the command line</h2>
      <p>
        When every file has exactly the same columns in the same order, the command line is the fastest way. Run it
        from the folder that holds the files, and write the result to a different folder so the output file is not
        combined into itself.
      </p>
      <h3>Windows (Command Prompt)</h3>
      <pre>
        <code>{`copy /b *.csv ..\\combined.csv`}</code>
      </pre>
      <p>
        The <code>/b</code> switch copies the files byte for byte. The result contains the header row of every file,
        so delete the repeated headers afterwards, or use one of the other methods.
      </p>
      <h3>macOS and Linux</h3>
      <pre>
        <code>{`awk 'FNR==1 && NR!=1 {next} {print}' *.csv > ../combined.csv`}</code>
      </pre>
      <p>
        This keeps the header of the first file and skips the first line of every other file. Make sure each file ends
        with a line break; otherwise the last row of one file and the first row of the next end up on one line.
      </p>

      <h2>After combining: remove duplicate rows</h2>
      <p>
        Exports often overlap, for example when one report runs to the end of the month and the next starts a day
        early. Open the combined file in <Link href="/tools/remove-duplicates-csv/">Remove Duplicate Rows</Link> and
        compare whole rows, or just a key column such as an order ID or email address. You can download the removed rows
        separately to check them.
      </p>

      <h2>Which method to choose</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table>
          <thead>
            <tr>
              <th scope="col">Situation</th>
              <th scope="col">Method</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Columns differ in order or names, or files use different separators</td>
              <td>Merge CSV Files</td>
            </tr>
            <tr>
              <td>The same folder is combined again every month inside Excel</td>
              <td>Power Query</td>
            </tr>
            <tr>
              <td>Identical files, very large, and you are comfortable with a terminal</td>
              <td>Command line</td>
            </tr>
          </tbody>
        </table>
      </div>
    </GuideLayout>
  );
}
