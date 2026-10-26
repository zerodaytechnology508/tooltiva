import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("import-csv-into-mysql")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

const LOAD_DATA = `LOAD DATA LOCAL INFILE 'C:/data/customers.csv'
INTO TABLE customers
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\\r\\n'
IGNORE 1 LINES
(customer_id, full_name, email, @balance, @signed_up)
SET balance   = NULLIF(@balance, ''),
    signed_up = STR_TO_DATE(NULLIF(@signed_up, ''), '%d/%m/%Y');`;

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <p>
        There are four common ways to get a CSV file into a MySQL or MariaDB table. Which one fits depends on the size
        of the file and on what you are allowed to do on the server:
      </p>
      <ul>
        <li>
          <strong>MySQL Workbench</strong> or <strong>phpMyAdmin</strong>: point and click, fine for files up to a few
          tens of thousands of rows.
        </li>
        <li>
          <strong>LOAD DATA INFILE</strong>: by far the fastest for large files, but often switched off for security
          reasons.
        </li>
        <li>
          <strong>An INSERT script</strong> generated from the CSV: works with any client and any hosting, because it
          is plain SQL.
        </li>
      </ul>
      <p>
        Whichever you use, open the file in a <Link href="/tools/csv-viewer/">CSV viewer</Link> first and check the
        separator, the header row and columns such as postcodes or phone numbers that must keep their leading zeros.
      </p>

      <h2>Method 1: MySQL Workbench Table Data Import Wizard</h2>
      <ol>
        <li>Connect to the server and find your database (schema) in the Navigator on the left.</li>
        <li>
          Right-click the schema, or an existing table, and choose <strong>Table Data Import Wizard</strong>.
        </li>
        <li>Browse to the CSV file and click Next.</li>
        <li>
          Choose <strong>Create new table</strong> (named after the file by default) or{" "}
          <strong>Use existing table</strong>.
        </li>
        <li>
          On the settings page, check the encoding (utf-8), untick columns you do not want, and check the data type
          the wizard guessed for each column. The wrench icon holds the field separator and quote settings.
        </li>
        <li>Click Next until the import runs, then check the number of imported rows in the summary.</li>
      </ol>
      <p>
        The wizard inserts rows one by one, so it is slow: files with a few hundred thousand rows can take many
        minutes. Its type guesses can also turn a code like <code>00123</code> into the number 123; change such
        columns to text before you continue.
      </p>

      <h2>Method 2: phpMyAdmin Import tab</h2>
      <ol>
        <li>Select the database, or the table you want to add rows to, and open the <strong>Import</strong> tab.</li>
        <li>Choose the file and set Format to <strong>CSV</strong>.</li>
        <li>
          Set <strong>Columns separated with</strong> to the file&apos;s separator, and tick{" "}
          <strong>The first line of the file contains the table column names</strong> if it has a header.
        </li>
        <li>Click Import.</li>
      </ol>
      <p>
        Imported at database level, phpMyAdmin creates a new table and guesses the column types. The page also shows
        the maximum upload size, often 2 MB on shared hosting; larger files are refused unless the hosting raises the
        PHP upload limit.
      </p>

      <h2>Method 3: LOAD DATA INFILE</h2>
      <p>Create the table first, then load the file in one statement. A typical example:</p>
      <pre tabIndex={0} aria-label="LOAD DATA INFILE example">{LOAD_DATA}</pre>
      <ul>
        <li>
          <code>IGNORE 1 LINES</code> skips the header. Use <code>LINES TERMINATED BY &apos;\n&apos;</code> for files
          made on a Mac or Linux.
        </li>
        <li>
          Reading empty cells into a variable and using <code>NULLIF</code> stores <code>NULL</code> instead of 0 or
          an error in strict mode.
        </li>
        <li>
          MySQL expects dates as <code>2024-01-31</code>; <code>STR_TO_DATE</code> converts other formats such as{" "}
          <code>31/01/2024</code>.
        </li>
      </ul>
      <p>The two errors almost everyone meets:</p>
      <ul>
        <li>
          <strong>Loading local data is disabled</strong> (MySQL 8, error 3948), or{" "}
          <strong>The used command is not allowed</strong> (MariaDB and older MySQL): the{" "}
          <code>LOCAL</code> keyword needs <code>local_infile</code> enabled on the server (
          <code>SET GLOBAL local_infile = 1;</code>, which needs admin rights) and on the client, for example{" "}
          <code>mysql --local-infile=1</code>, or <code>OPT_LOCAL_INFILE=1</code> in a Workbench connection&apos;s
          Advanced settings.
        </li>
        <li>
          <strong>The MySQL server is running with the --secure-file-priv option</strong> (error 1290): without{" "}
          <code>LOCAL</code>, the file must be in the folder that{" "}
          <code>SHOW VARIABLES LIKE &apos;secure_file_priv&apos;;</code> names, on the server itself.
        </li>
      </ul>
      <p>On managed or shared hosting you often cannot change either setting, which is where the last method helps.</p>

      <h2>Method 4: convert the CSV to an INSERT script</h2>
      <p>
        An INSERT script is ordinary SQL, so it runs in Workbench, phpMyAdmin&apos;s SQL tab, the command line or any
        database tool, with no server settings to change.
      </p>
      <ol>
        <li>
          Open the file in the <Link href="/tools/csv-to-sql/">CSV to SQL converter</Link> and choose MySQL.
        </li>
        <li>
          Set the table name. Keep <strong>Add a CREATE TABLE statement</strong> for a new table, or turn it off to
          add rows to an existing one.
        </li>
        <li>
          Check the column types: columns with leading zeros stay text, and empty cells become <code>NULL</code>.
        </li>
        <li>Download the .sql file and run it, for example with <code>mysql -u user -p shop &lt; customers.sql</code>.</li>
      </ol>
      <p>
        The script groups rows into multi-row INSERTs (100 per statement by default), which loads far faster than the
        wizard&apos;s one-by-one inserts. The file is converted in your browser and is not uploaded. For millions of
        rows, LOAD DATA INFILE is still the fastest when it is available.
      </p>

      <h2>Common problems after importing</h2>
      <ul>
        <li>
          <strong>Incorrect string value</strong> or question marks instead of accented letters: the table or
          connection uses an old character set. Use <code>utf8mb4</code> for the table and the import.
        </li>
        <li>
          <strong>The first row is a column name</strong> inside the table: the header was imported as data. Delete
          that row, or re-import with the header option or <code>IGNORE 1 LINES</code>.
        </li>
        <li>
          <strong>Duplicate entry for key PRIMARY:</strong> the file contains the same ID twice, or rows already in
          the table. <Link href="/tools/remove-duplicates-csv/">Remove the duplicate rows</Link> by the ID column
          first.
        </li>
        <li>
          <strong>Zip codes or phone numbers lost their leading zero:</strong> the column was created as a number.
          Change it to <code>VARCHAR</code> and import again; if the CSV itself already lost the zeros in Excel, see{" "}
          <Link href="/guides/excel-leading-zeros-csv/">how to keep leading zeros</Link>.
        </li>
      </ul>
    </GuideLayout>
  );
}
