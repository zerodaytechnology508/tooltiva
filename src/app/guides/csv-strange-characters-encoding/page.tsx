import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("csv-strange-characters-encoding")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <h2>What the strange characters mean</h2>
      <p>
        A file stores text as bytes, and an <strong>encoding</strong> is the rule that turns bytes back into letters.
        Today most systems use UTF-8, but older Excel versions and many Windows programs still use Windows-1252 (also
        called ANSI or Western European). When a file is written with one encoding and read with the other, letters
        outside plain English come out wrong, and the pattern tells you which mix-up happened:
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table>
          <thead>
            <tr>
              <th scope="col">Should be</th>
              <th scope="col">You see</th>
              <th scope="col">Cause</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>é</code>, <code>ü</code>, <code>ñ</code></td>
              <td><code>Ã©</code>, <code>Ã¼</code>, <code>Ã±</code></td>
              <td>A UTF-8 file read as Windows-1252</td>
            </tr>
            <tr>
              <td><code>’</code> or <code>€</code></td>
              <td><code>â€™</code> or <code>â‚¬</code></td>
              <td>A UTF-8 file read as Windows-1252</td>
            </tr>
            <tr>
              <td><code>é</code>, <code>ü</code>, <code>ñ</code></td>
              <td><code>�</code></td>
              <td>A Windows-1252 file read as UTF-8</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Two-character pairs starting with <code>Ã</code> or <code>â</code> mean the file is UTF-8 and the program
        guessed wrong. The replacement character <code>�</code> means the file is not UTF-8 and the program expected
        it to be.
      </p>

      <h2>First, find out whether the file itself is damaged</h2>
      <p>
        Usually only the program reading the file is wrong, and the file is fine. To check, open it in the{" "}
        <Link href="/tools/csv-viewer/">CSV Viewer</Link>. It reads UTF-8 files as UTF-8, recognises files saved in
        Windows-1252 by older Excel versions, reads those correctly too, and tells you when it did.
      </p>
      <ul>
        <li>
          <strong>Correct letters in the viewer:</strong> the file is fine. Follow the fixes below to open it
          correctly in Excel.
        </li>
        <li>
          <strong>Ã© or � in the viewer too:</strong> the wrong characters were saved into the file by an earlier
          program. See the last section.
        </li>
      </ul>

      <h2>Fix 1: open the file in Excel with the right encoding</h2>
      <p>
        When you double-click a CSV, Excel on Windows assumes your system&apos;s legacy encoding unless the file
        starts with a UTF-8 byte order mark. To choose the encoding yourself:
      </p>
      <ol>
        <li>Open a blank workbook.</li>
        <li>
          On the <strong>Data</strong> tab, choose <strong>From Text/CSV</strong> and select the file.
        </li>
        <li>
          Set <strong>File Origin</strong> to <strong>65001: Unicode (UTF-8)</strong> for a UTF-8 file, or{" "}
          <strong>1252: Western European (Windows)</strong> for an older file. The preview updates immediately.
        </li>
        <li>
          Choose <strong>Load</strong>.
        </li>
      </ol>

      <h2>Fix 2: save the file as UTF-8 with a byte order mark</h2>
      <p>
        A byte order mark (BOM) is an invisible marker at the start of a file that says &quot;this is UTF-8&quot;.
        Excel reads it and then opens the file correctly by double-click. To add one:
      </p>
      <ul>
        <li>
          <strong>In Tooltiva:</strong> open the file in the <Link href="/tools/csv-viewer/">CSV Viewer</Link> and
          download it again, or convert it with the{" "}
          <Link href="/tools/csv-delimiter-converter/">CSV Delimiter Converter</Link>. Files with accented letters or
          other non-English characters are saved as UTF-8 with a byte order mark, whatever encoding the original used.
        </li>
        <li>
          <strong>In Excel:</strong> after importing the file correctly (Fix 1), use <strong>Save As</strong> and choose{" "}
          <strong>CSV UTF-8 (Comma delimited)</strong>. The plain <strong>CSV (Comma delimited)</strong> option saves in
          the old encoding again.
        </li>
      </ul>
      <p>
        Some older systems and scripts do not expect a byte order mark and show it as a few odd characters at the very
        start of the first column name. If a file is going to such a system rather than to Excel, save it as UTF-8
        without one.
      </p>

      <h2>If the file itself contains the wrong characters</h2>
      <p>
        When <code>Ã©</code> is stored in the file, an earlier program read it with the wrong encoding and saved what
        it saw. It can sometimes be reversed with a text editor that can reinterpret encodings, but the reliable fix is
        a fresh export from the original system, saved as UTF-8.
      </p>
      <p>
        When <code>�</code> is stored in the file, the original letters were replaced and cannot be recovered from that
        copy. Go back to the source.
      </p>

      <h2>Summary</h2>
      <ul>
        <li>
          <code>Ã©</code> means a UTF-8 file was read as Windows-1252; <code>�</code> means the opposite.
        </li>
        <li>The file is usually fine; only the program reading it guessed wrong.</li>
        <li>Import with the right File Origin, or save the file as UTF-8 with a byte order mark for Excel.</li>
      </ul>
    </GuideLayout>
  );
}
