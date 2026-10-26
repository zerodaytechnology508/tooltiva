import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("csv-opens-in-one-column-excel")!;

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
        You double-click a CSV file and Excel shows everything squeezed into column A, with the values still separated
        by commas or semicolons:
      </p>
      <pre tabIndex={0}>
        <code>{`A
order_id;customer;amount
1001;Ayesha Khan;25,50
1002;Liam O'Brien;40,00`}</code>
      </pre>
      <p>
        Nothing is wrong with the data. Excel simply split the lines with a different character from the one the file
        uses.
      </p>

      <h2>Why it happens</h2>
      <p>
        A CSV file has no setting that says which character separates the values. When you open one by
        double-clicking, Excel assumes it is the <strong>list separator</strong> from your computer&apos;s regional
        settings. That separator depends on the region:
      </p>
      <ul>
        <li>
          In regions that write decimals with a point (<code>25.50</code>), such as the US, the UK and Pakistan, the
          list separator is usually a <strong>comma</strong>.
        </li>
        <li>
          In regions that write decimals with a comma (<code>25,50</code>), such as Germany, France, Italy and Spain,
          the list separator is usually a <strong>semicolon</strong>, because a comma inside a number would otherwise
          split it in two.
        </li>
      </ul>
      <p>
        So a comma-separated file from a US system opens in one column on a computer set up for Germany, and a
        semicolon-separated file from a European Excel opens in one column on a computer set up for the US.
      </p>
      <p>
        There is a second, less common cause: every line of the file is wrapped in double quotes, like{" "}
        <code>&quot;1001,Ayesha Khan,25.50&quot;</code>. Then the whole line is a single quoted value and no program
        will split it, whatever the separator. That file was exported incorrectly and needs to be fixed at the source,
        or the outer quotes removed.
      </p>

      <h2>Fix 1: import the file and choose the delimiter</h2>
      <p>This works in any version of Excel and does not change the file.</p>
      <ol>
        <li>Open a blank workbook.</li>
        <li>
          On the <strong>Data</strong> tab, choose <strong>From Text/CSV</strong> and select the file.
        </li>
        <li>
          In the preview, set <strong>Delimiter</strong> to the character the file uses: comma, semicolon, tab or
          another. The preview splits into columns as soon as it matches.
        </li>
        <li>
          Choose <strong>Load</strong>.
        </li>
      </ol>
      <p>
        The import has to be repeated each time you open the file, which is fine for a one-off but tedious for files
        you receive every week.
      </p>

      <h2>Fix 2: convert the file to the separator your Excel expects</h2>
      <p>
        If you or your colleagues open the file regularly, change the separator in the file itself. Our{" "}
        <Link href="/tools/csv-delimiter-converter/">CSV Delimiter Converter</Link> detects the current separator,
        and you pick the one Excel expects: a semicolon for European settings, a comma for US settings. Values that
        contain the separator, such as <code>&quot;Acme, Inc.&quot;</code>, are quoted correctly so no column shifts,
        and the file never leaves your browser.
      </p>
      <p>
        Do not use find-and-replace in a text editor for this. Replacing every comma with a semicolon also changes the
        commas inside values and inside decimal numbers, which breaks the columns in a different way.
      </p>

      <h2>Fix 3: add a separator hint for Excel</h2>
      <p>
        Excel understands a special first line that names the separator. Open the file in a text editor and add this
        line at the very top, using the character the file actually uses:
      </p>
      <pre tabIndex={0}>
        <code>{`sep=;
order_id;customer;amount`}</code>
      </pre>
      <p>
        Excel then splits the file correctly on any computer. The catch is that other programs, such as databases,
        Google Sheets or scripts, do not know this line and will read <code>sep=;</code> as data. Use it only for
        files that are opened in Excel and nowhere else.
      </p>

      <h2>Fix 4: change the Windows list separator</h2>
      <p>
        On Windows, the list separator is set in the classic Control Panel: <strong>Region</strong>, then{" "}
        <strong>Additional settings</strong>, then <strong>List separator</strong>. Changing it makes Excel open
        those files correctly by double-click.
      </p>
      <p>
        It also changes how every other program on the computer formats lists, and Excel will save CSV files with the
        new separator from then on, which can surprise whoever receives them. For most people, converting the file
        (Fix 2) or importing it (Fix 1) is the safer choice.
      </p>

      <h2>How to check which separator a file uses</h2>
      <p>
        Open the file in a plain text editor such as Notepad and look at the first line: the character between the
        column names is the separator. A tab shows as a wide gap. Or open it in the{" "}
        <Link href="/tools/csv-viewer/">CSV Viewer</Link>, which detects the separator, names it and shows the
        columns as a table.
      </p>

      <h2>Summary</h2>
      <ul>
        <li>One column in Excel means the file&apos;s separator does not match your regional list separator.</li>
        <li>For a one-time look, import with Data &gt; From Text/CSV and pick the delimiter.</li>
        <li>For files you use often, convert the separator once.</li>
        <li>
          Avoid find-and-replace and system-wide setting changes unless you understand what else they affect.
        </li>
      </ul>
    </GuideLayout>
  );
}
