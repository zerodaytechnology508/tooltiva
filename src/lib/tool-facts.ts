/**
 * Short, checkable facts about each tool, shown in an "At a glance" table on its page.
 * Written so a reader (or an AI assistant quoting the page) gets an exact answer in one line.
 * Only state what the tool's code does; update this file when a tool changes.
 */
export interface ToolFact {
  label: string;
  value: string;
}

const CSV_IN = ".csv, .tsv or .txt file, or pasted text; the separator is detected";

export const TOOL_FACTS: Record<string, ToolFact[]> = {
  "csv-viewer": [
    { label: "Opens", value: CSV_IN },
    { label: "You get", value: "A searchable, sortable table; export or copy the rows shown as CSV" },
    { label: "Tested with", value: "A 48 MB file of 500,000 rows" },
  ],
  "split-csv": [
    { label: "Opens", value: CSV_IN },
    { label: "Split by", value: "Rows per file, a number of equal files, or one file per value of a column" },
    { label: "You get", value: "CSV files with the header row repeated, one by one or together in a ZIP" },
  ],
  "merge-csv": [
    { label: "Opens", value: "Two or more .csv, .tsv or .txt files, each with its own separator" },
    { label: "Matches columns", value: "By name (any order, extra or missing columns) or by position" },
    { label: "You get", value: "One CSV file, with an optional column naming each row's source file" },
  ],
  "remove-duplicates-csv": [
    { label: "Opens", value: CSV_IN },
    { label: "Compares", value: "Whole rows, or only the key columns you choose, such as email or ID" },
    { label: "You get", value: "The cleaned CSV and, separately, the rows that were removed" },
  ],
  "compare-csv": [
    { label: "Opens", value: "Two CSV files: the original and the changed version" },
    { label: "Matches rows", value: "By a key column, by whole row in any order, or by position" },
    { label: "You get", value: "Added, removed and changed rows on screen, plus CSV reports of the differences" },
  ],
  "csv-to-sql": [
    { label: "Opens", value: `${CSV_IN}, or cells copied from Excel` },
    { label: "Databases", value: "MySQL / MariaDB, PostgreSQL, SQL Server, SQLite and Oracle" },
    { label: "You get", value: "A .sql file of INSERT statements, with an optional CREATE TABLE" },
  ],
  "csv-to-vcf": [
    { label: "Opens", value: "A contact list saved as CSV from Excel or Google Sheets" },
    { label: "You get", value: "One .vcf file (vCard 3.0) with all contacts" },
    { label: "Import into", value: "Android, iPhone and Google Contacts" },
  ],
  "vcf-to-csv": [
    { label: "Opens", value: ".vcf or .vcard files (vCard 2.1, 3.0 and 4.0), with one or many contacts" },
    { label: "You get", value: "A CSV file for Excel or Google Sheets: comma, semicolon or tab separated" },
    { label: "Works with", value: "Exports from Android, iPhone, Google Contacts and Outlook" },
  ],
  "excel-to-csv": [
    { label: "Opens", value: ".xlsx and .xlsm workbooks from Excel, Google Sheets, Numbers or LibreOffice" },
    { label: "You get", value: "A CSV file per sheet, or every sheet as CSV files in one ZIP" },
    { label: "Options", value: "Comma, semicolon, tab or pipe; numbers as shown or unformatted; ISO or formatted dates" },
  ],
  "excel-to-json": [
    { label: "Opens", value: ".xlsx and .xlsm workbooks from Excel, Google Sheets, Numbers or LibreOffice" },
    { label: "You get", value: "An array of objects keyed by the header row, an array of rows, or all sheets keyed by name" },
    { label: "Values", value: "Numbers and true/false as JSON types, dates as ISO text, leading-zero codes as text" },
  ],
  "csv-delimiter-converter": [
    { label: "Opens", value: CSV_IN },
    { label: "Converts to", value: "Comma, semicolon, tab, pipe or a custom separator" },
    { label: "You get", value: "The same data with the new separator; quoted values stay intact" },
  ],
  "csv-to-json": [
    { label: "Opens", value: CSV_IN },
    { label: "You get", value: "JSON as an array of objects or a 2D array, to copy or download" },
    { label: "Values", value: "Kept exactly as written, so leading zeros and long numbers are not changed" },
  ],
  "json-to-csv": [
    { label: "Opens", value: "A .json or .txt file, or pasted JSON: an array of objects or of arrays" },
    { label: "You get", value: "A CSV file with one column per key; nested values are kept as JSON text" },
    { label: "Values", value: "Numbers are kept exactly as written; null becomes an empty cell" },
  ],
  "json-formatter": [
    { label: "Opens", value: "A .json or .txt file, or pasted JSON" },
    { label: "Does", value: "Validates, formats or minifies, and shows a tree view" },
    { label: "Fixes", value: "Trailing commas, single quotes, unquoted keys and comments, with a log you can undo" },
  ],
  "resize-image-to-kb": [
    { label: "Opens", value: "JPG, PNG, WebP, GIF or BMP photos; HEIC from iPhone where the browser supports it" },
    { label: "Target", value: "A size in KB (such as 20 KB or 10–50 KB), optionally with exact pixel dimensions" },
    { label: "You get", value: "A JPG file within the size range you chose" },
  ],
  "signature-resizer": [
    { label: "Opens", value: "A photo or scan of a signature: JPG, PNG, WebP and other common formats" },
    { label: "Target", value: "A size in KB (such as 10–20 KB), in pixels, or in centimetres with DPI" },
    { label: "You get", value: "A JPG with empty space trimmed and the paper turned pure white" },
  ],
};

/** Facts that are true of every tool on the site. */
export const COMMON_FACTS: ToolFact[] = [
  { label: "Price", value: "Free, with no sign-up or account" },
  { label: "Privacy", value: "Runs in your browser; your files are not uploaded to a server" },
];
