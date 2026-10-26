import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("csv-too-large-for-excel")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <h2>Excel&apos;s limit: 1,048,576 rows</h2>
      <p>
        An Excel worksheet has 1,048,576 rows and 16,384 columns, and that has not changed since Excel 2007. A CSV
        file has no such limit: database exports, server logs and transaction histories often run to millions of
        lines.
      </p>
      <p>
        When you open a larger CSV, Excel loads the first 1,048,576 lines, warns that the file was not loaded
        completely, and leaves the rest out. The warning is easy to click away. If you then save the file from Excel,
        the missing rows are gone from that copy for good.
      </p>
      <p>
        Large files cause trouble before the limit, too. Excel keeps every cell in memory, so a CSV of a few hundred
        megabytes can make it slow to open, scroll and filter.
      </p>

      <h2>Check how many rows the file has</h2>
      <p>
        Before choosing a fix, find out the real row count. Open the file in the{" "}
        <Link href="/tools/csv-viewer/">CSV Viewer</Link>: it reads the whole file in your browser and shows the
        number of rows and columns at the top. It only draws the rows on screen, so scrolling and searching stay quick
        even with hundreds of thousands of rows. The practical limit is your computer&apos;s memory; files of tens of
        megabytes work well in a desktop browser.
      </p>

      <h2>Option 1: view and search the file without Excel</h2>
      <p>
        If you only need to look something up, such as one order, an error message or a customer, you may not need
        Excel at all. In the CSV Viewer you can search all columns or one, sort by any column, and export just the
        matching rows as a smaller CSV that opens in Excel without trouble.
      </p>

      <h2>Option 2: split the file into parts Excel can open</h2>
      <p>
        When you need every row in Excel, split the file. With{" "}
        <Link href="/tools/split-csv/">Split CSV</Link> you can:
      </p>
      <ul>
        <li>
          split every <strong>1,000,000 rows</strong>, which keeps each part safely under Excel&apos;s limit;
        </li>
        <li>split into a set number of files of equal size;</li>
        <li>
          or create <strong>one file per value</strong> of a column, such as one file per year, country or status,
          which is often more useful than arbitrary chunks.
        </li>
      </ul>
      <p>
        The header row is repeated in every part, so each file opens with its column names, and a row is never cut in
        half, even when a value contains a line break. All parts download together as a ZIP file.
      </p>

      <h2>Option 3: load the file into Excel&apos;s Data Model</h2>
      <p>
        Excel can hold more than 1,048,576 rows when the data does not go into a worksheet. On the{" "}
        <strong>Data</strong> tab, choose <strong>From Text/CSV</strong>, select the file, then open the menu next to{" "}
        <strong>Load</strong> and choose <strong>Load To</strong>. Pick <strong>Only Create Connection</strong> and
        tick <strong>Add this data to the Data Model</strong>.
      </p>
      <p>
        The rows are then available to PivotTables and Power Pivot, which is the right approach for totals and
        summaries. You cannot scroll through or edit the rows like a normal sheet, though, and this needs the desktop
        version of Excel for Windows.
      </p>

      <h2>Option 4: use a database or a script</h2>
      <p>
        For files of many gigabytes, or work you repeat every day, a spreadsheet is the wrong tool. A database such as
        SQLite or PostgreSQL, or a short script in Python, reads files of any size and can filter and summarise them
        before anything reaches Excel. It takes more setup, but it is the long-term answer for very large data.
      </p>

      <h2>Which option to choose</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens">
        <table>
          <thead>
            <tr>
              <th scope="col">You want to</th>
              <th scope="col">Best option</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Look up or check a few records</td>
              <td>View and search it in the CSV Viewer</td>
            </tr>
            <tr>
              <td>Work with every row in Excel</td>
              <td>Split it into files under 1,048,576 rows</td>
            </tr>
            <tr>
              <td>Build totals and PivotTables</td>
              <td>Load it into the Data Model</td>
            </tr>
            <tr>
              <td>Process gigabytes regularly</td>
              <td>Use a database or a script</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Summary</h2>
      <ul>
        <li>Excel shows at most 1,048,576 rows and drops the rest of a larger CSV, with a warning that is easy to miss.</li>
        <li>Never save a truncated file from Excel over the original.</li>
        <li>View the whole file in the browser, split it, or load it into the Data Model, depending on the job.</li>
      </ul>
    </GuideLayout>
  );
}
