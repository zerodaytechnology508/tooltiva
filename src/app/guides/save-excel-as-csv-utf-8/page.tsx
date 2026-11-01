import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("save-excel-as-csv-utf-8")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <h2>Why names turn into ??? in a CSV</h2>
      <p>
        A CSV file is plain text, and text needs an encoding: the rule that turns letters into bytes. Excel offers two
        CSV formats in Save As, and they use different encodings:
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table>
          <thead>
            <tr>
              <th scope="col">Save as type</th>
              <th scope="col">Encoding</th>
              <th scope="col">Urdu, Arabic, Chinese, emoji</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CSV (Comma delimited)</td>
              <td>Your computer&apos;s old code page, such as Windows-1252</td>
              <td>Saved as ? because the code page has no such letters</td>
            </tr>
            <tr>
              <td>CSV UTF-8 (Comma delimited)</td>
              <td>UTF-8, with a marker (BOM) at the start</td>
              <td>Kept exactly</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The question marks are written into the file itself, so they cannot be repaired afterwards: go back to the
        workbook and save again in the right format.
      </p>

      <h2>Save as CSV UTF-8 in Excel for Windows</h2>
      <ol>
        <li>Open the workbook and click the sheet you want to save. A CSV holds only one sheet, the active one.</li>
        <li>
          Choose <strong>File</strong>, then <strong>Save As</strong> (or <strong>Save a Copy</strong>), and pick a
          folder.
        </li>
        <li>
          In <strong>Save as type</strong>, choose <strong>CSV UTF-8 (Comma delimited) (*.csv)</strong>, then click{" "}
          <strong>Save</strong>.
        </li>
        <li>
          Excel warns that only the current sheet is saved and that some features may be lost. Click OK or Yes: the
          values are saved, formatting and formulas are not.
        </li>
      </ol>
      <p>Keep the original .xlsx file for further editing; the CSV is the copy you send or upload.</p>

      <h2>Save as CSV UTF-8 in Excel for Mac</h2>
      <p>
        Choose <strong>File</strong>, <strong>Save As</strong>, and in <strong>File Format</strong> pick{" "}
        <strong>CSV UTF-8 (Comma delimited)</strong>. As on Windows, only the active sheet is saved.
      </p>

      <h2>No CSV UTF-8 option in your Excel?</h2>
      <p>The format was added in Excel 2016. In older versions, or to avoid Save As altogether:</p>
      <ul>
        <li>
          <strong>Convert the .xlsx directly:</strong> the <Link href="/tools/excel-to-csv/">Excel to CSV converter</Link>{" "}
          always writes UTF-8, can save every sheet at once, and runs in your browser without uploading the workbook.
        </li>
        <li>
          <strong>Google Sheets:</strong> open the file there and choose File, Download, Comma-separated values. Google
          Sheets always saves CSV as UTF-8.
        </li>
        <li>
          <strong>Unicode Text:</strong> older Excel can save as Unicode Text (*.txt), which keeps every letter but
          uses UTF-16 and tabs instead of commas. Many systems that expect CSV will not accept it.
        </li>
      </ul>

      <h2>CSV UTF-8 without the BOM</h2>
      <p>
        Excel&apos;s CSV UTF-8 starts with three invisible bytes, the byte order mark (BOM), so that Excel recognises
        the encoding when it opens the file again. Most programs ignore it, but some importers show it as{" "}
        <code>ï»¿</code> before the first column name, which then no longer matches.
      </p>
      <ul>
        <li>
          In the <Link href="/tools/excel-to-csv/">Excel to CSV converter</Link>, turn off{" "}
          <strong>UTF-8 for Excel</strong> to download UTF-8 without the BOM.
        </li>
        <li>
          Or open the CSV in Notepad on Windows 10 or 11, choose <strong>File</strong>, <strong>Save As</strong>, and set{" "}
          <strong>Encoding</strong> to <strong>UTF-8</strong> rather than UTF-8 with BOM.
        </li>
      </ul>

      <h2>Commas or semicolons?</h2>
      <p>
        Both CSV formats use the list separator from your Windows region settings, so in many European regions the
        &ldquo;comma delimited&rdquo; file actually uses semicolons. If the system you upload to expects commas,{" "}
        <Link href="/tools/csv-delimiter-converter/">change the delimiter</Link> afterwards, or choose comma in the
        Excel to CSV converter. Why Excel does this is explained in{" "}
        <Link href="/guides/csv-opens-in-one-column-excel/">why a CSV opens in one column</Link>.
      </p>

      <h2>Opening a UTF-8 CSV in Excel again</h2>
      <p>
        A UTF-8 file with the BOM opens correctly when you double-click it. A UTF-8 file without the BOM may show
        letters such as Ã© instead of é; that is a reading problem, not damage, and{" "}
        <Link href="/guides/csv-strange-characters-encoding/">fixing strange characters in a CSV</Link> shows how to
        import it with the right encoding. To check a file without Excel changing anything, open it in the{" "}
        <Link href="/tools/csv-viewer/">CSV viewer</Link>.
      </p>

      <h2>Summary</h2>
      <p>
        Use <strong>CSV UTF-8 (Comma delimited)</strong> whenever the sheet has names or text beyond basic English
        letters. It saves the active sheet with every character intact. For older Excel, several sheets at once, or a
        file without the BOM, convert the workbook with Excel to CSV instead.
      </p>
    </GuideLayout>
  );
}
