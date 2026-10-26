import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { CSVToSQLClient } from "@/components/tools/CSVToSQLClient";

const tool = getToolBySlug("csv-to-sql")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

const EXAMPLE_CSV = `Customer ID,Full Name,Postcode,Balance,Active,Signed Up
1001,Ayesha Khan,54000,1250.50,true,2024-01-31
1002,Liam O'Brien,02134,0,false,2024-02-29
1003,"Chen, Wei",20121,,true,2024-04-02`;

const EXAMPLE_SQL = `CREATE TABLE \`customers\` (
  \`customer_id\` INTEGER,
  \`full_name\` VARCHAR(50),
  \`postcode\` VARCHAR(50),
  \`balance\` DECIMAL(6, 2),
  \`active\` TINYINT(1),
  \`signed_up\` DATE
);

INSERT INTO \`customers\` (\`customer_id\`, \`full_name\`, \`postcode\`, \`balance\`, \`active\`, \`signed_up\`) VALUES
  (1001, 'Ayesha Khan', '54000', 1250.50, 1, '2024-01-31'),
  (1002, 'Liam O''Brien', '02134', 0, 0, '2024-02-29'),
  (1003, 'Chen, Wei', '20121', NULL, 1, '2024-04-02');`;

export default function CSVToSQLPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to convert CSV to SQL INSERT statements">
            <ol>
              <li>
                <strong>Open the data:</strong> drop a CSV file on the page, or paste CSV text. To convert from
                Excel or Google Sheets, copy the cells including the header row and paste them; the tab-separated
                text is detected automatically.
              </li>
              <li>
                <strong>Choose the database and table:</strong> MySQL, PostgreSQL, SQL Server, SQLite or Oracle, and
                the table name. The name starts as the file name, and you can add a schema, such as{" "}
                <code>sales.orders</code>.
              </li>
              <li>
                <strong>Check the columns and options:</strong> open Columns and types to see each column&apos;s SQL
                name and type, and leave out columns you do not need. Choose how many rows go in each INSERT, and
                whether to add CREATE TABLE.
              </li>
              <li>
                <strong>Copy or download:</strong> copy the SQL into your database tool, or download it as a .sql
                file and run it there.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Example: CSV to MySQL">
            <p>This CSV file:</p>
            <pre tabIndex={0} aria-label="Example CSV file">{EXAMPLE_CSV}</pre>
            <p>becomes, with the default options:</p>
            <pre tabIndex={0} aria-label="Generated MySQL statements">{EXAMPLE_SQL}</pre>
            <p>
              Column names are cleaned to <code>snake_case</code>. <code>Postcode</code> is text, because{" "}
              <code>02134</code> would lose its leading zero as a number. The apostrophe in O&apos;Brien is doubled,
              the comma inside the quoted name stays in the value, and the empty balance becomes <code>NULL</code>.
            </p>
          </ContentSection>

          <ContentSection title="What changes between databases">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Database</th>
                    <th scope="col">Names quoted as</th>
                    <th scope="col">true / false</th>
                    <th scope="col">Rows per INSERT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>MySQL / MariaDB</td>
                    <td><code>`name`</code></td>
                    <td><code>1</code> / <code>0</code></td>
                    <td>up to 1,000 here</td>
                  </tr>
                  <tr>
                    <td>PostgreSQL</td>
                    <td><code>&quot;name&quot;</code></td>
                    <td><code>TRUE</code> / <code>FALSE</code></td>
                    <td>up to 1,000 here</td>
                  </tr>
                  <tr>
                    <td>SQL Server</td>
                    <td><code>[name]</code></td>
                    <td><code>1</code> / <code>0</code> (BIT)</td>
                    <td>1,000, the database&apos;s limit</td>
                  </tr>
                  <tr>
                    <td>SQLite</td>
                    <td><code>&quot;name&quot;</code></td>
                    <td><code>1</code> / <code>0</code></td>
                    <td>500, the default limit</td>
                  </tr>
                  <tr>
                    <td>Oracle</td>
                    <td><code>&quot;NAME&quot;</code></td>
                    <td><code>1</code> / <code>0</code></td>
                    <td>up to 1,000, as INSERT ALL</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              MySQL treats a backslash inside a string as an escape character, so backslashes are doubled for MySQL
              only. SQL Server values that contain non-English characters get the <code>N</code> prefix, so they are
              not turned into question marks. Oracle dates are written as <code>DATE &apos;2024-01-31&apos;</code>.
            </p>
          </ContentSection>

          <ContentSection title="How column types are chosen">
            <ul>
              <li>
                <strong>Whole numbers</strong> without leading zeros become <code>INTEGER</code>, or{" "}
                <code>BIGINT</code> above 2,147,483,647. Numbers with more than 18 digits, such as card-style IDs,
                stay text so no digit is lost.
              </li>
              <li>
                <strong>Decimals</strong> such as <code>1250.50</code> become <code>DECIMAL</code> with enough digits
                for the largest value; the value is written exactly as in the file.
              </li>
              <li>
                <strong>true / false</strong> becomes the database&apos;s boolean type, and dates written as{" "}
                <code>2024-01-31</code> or <code>2024-01-31 14:30:00</code> become <code>DATE</code> or a date-time
                type. Dates in other formats, such as 31/01/2024, stay text, because the day and month order cannot
                be known for sure.
              </li>
              <li>
                <strong>Everything else</strong> is text: <code>VARCHAR</code> rounded up to 50, 100 or 255
                characters, or a larger text type for long values. One text value in a column makes the whole column
                text, so every row is written the same way.
              </li>
            </ul>
          </ContentSection>

          <ContentSection title="Very large files">
            <p>
              Files with hundreds of thousands of rows convert in a few seconds, and the download contains the
              whole script; the box on the page shows only the beginning. For millions of rows, a database&apos;s own
              import is faster than running INSERT statements: <code>LOAD DATA INFILE</code> in MySQL,{" "}
              <code>COPY</code> or <code>\copy</code> in PostgreSQL, <code>BULK INSERT</code> in SQL Server and{" "}
              <code>.import</code> in SQLite. The CREATE TABLE statement from this tool is still useful to create
              the table first.
            </p>
          </ContentSection>

          <ContentSection title="Related CSV tasks">
            <p>
              Clean the data before you import it:{" "}
              <Link href="/tools/remove-duplicates-csv/">remove duplicate rows</Link> by ID or email, and check the
              file in the <Link href="/tools/csv-viewer/">CSV Viewer</Link>. For an API or a NoSQL database,{" "}
              <Link href="/tools/csv-to-json/">convert the CSV to JSON</Link> instead. To find which rows changed
              since the last import, <Link href="/tools/compare-csv/">compare the two CSV files</Link>.
            </p>
          </ContentSection>
        </>
      }
    >
      <CSVToSQLClient />
    </ToolPageLayout>
  );
}
