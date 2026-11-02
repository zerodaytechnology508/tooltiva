/** Problem-solving guides under /guides/. Each one links to the tools that solve the problem. */
export interface GuideMeta {
  slug: string;
  /** Short name for cards, breadcrumbs and links. */
  title: string;
  /** SEO <title> without the "| Tooltiva" suffix. */
  pageTitle: string;
  h1: string;
  metaDescription: string;
  /** One or two sentences under the heading: the answer in brief. */
  summary: string;
  /** Tool slugs used in the guide, most important first. */
  tools: string[];
  datePublished: string;
  dateModified: string;
}

export const GUIDES: GuideMeta[] = [
  {
    slug: "csv-opens-in-one-column-excel",
    title: "CSV opens in one column in Excel",
    pageTitle: "CSV Opens in One Column in Excel? How to Fix It",
    h1: "Why your CSV opens in one column in Excel, and how to fix it",
    metaDescription: "Excel puts a whole CSV into column A when the file's separator doesn't match your regional settings. Why it happens and four ways to fix it.",
    summary: "Excel splits a CSV with the list separator of your Windows region. When the file uses a different separator, such as commas on a computer set up for semicolons, every line lands in column A. Import the file with the right delimiter, or convert the delimiter once.",
    tools: ["csv-delimiter-converter", "csv-viewer", "csv-to-excel"],
    datePublished: "2026-10-23",
    dateModified: "2026-11-01",
  },
  {
    slug: "csv-too-large-for-excel",
    title: "Open a CSV too large for Excel",
    pageTitle: "CSV Too Large for Excel? Open Files Over 1,048,576 Rows",
    h1: "How to open a CSV file that is too large for Excel",
    metaDescription: "Excel says \"This data set is too large for the Excel grid\" and drops rows after 1,048,576. How to open the whole CSV, split it, or load it with Power Query.",
    summary: "An Excel worksheet holds at most 1,048,576 rows, and Excel drops everything after that when it opens a bigger CSV. To work with the whole file, view it in a tool without that limit, split it into smaller files, or load it into Excel's Data Model.",
    tools: ["csv-viewer", "split-csv"],
    datePublished: "2026-10-23",
    dateModified: "2026-11-01",
  },
  {
    slug: "excel-leading-zeros-csv",
    title: "Stop Excel removing leading zeros",
    pageTitle: "Excel Removing Leading Zeros From CSV? How to Keep Them",
    h1: "How to stop Excel removing leading zeros from a CSV file",
    metaDescription: "Excel turns 00123 into 123 and long IDs into 1.23E+17 when it opens a CSV. Why it happens and how to import the file without losing data.",
    summary: "Excel converts anything that looks like a number when it opens a CSV, so 00123 becomes 123 and long IDs are rounded. The values are still correct in the file; import it with those columns set to Text, and never save it back from Excel until you have.",
    tools: ["csv-viewer", "csv-delimiter-converter", "excel-to-csv", "csv-to-excel"],
    datePublished: "2026-10-23",
    dateModified: "2026-11-01",
  },
  {
    slug: "csv-strange-characters-encoding",
    title: "Fix strange characters in a CSV",
    pageTitle: "Strange Characters in CSV (Ã©, �)? Fix CSV Encoding",
    h1: "How to fix strange characters like Ã© and � in a CSV file",
    metaDescription: "Seeing Ã© or � instead of accented letters? The CSV was read with the wrong encoding. How to tell which problem you have and fix it safely.",
    summary: "Characters such as Ã© and â€™ appear when a UTF-8 file is read as Windows-1252, and � appears when the opposite happens. The text is usually not damaged yet: open the file with the right encoding, and save it as UTF-8 with a byte order mark so Excel reads it correctly.",
    tools: ["csv-viewer", "csv-delimiter-converter", "excel-to-csv"],
    datePublished: "2026-10-23",
    dateModified: "2026-11-01",
  },
  {
    slug: "combine-csv-files",
    title: "Combine multiple CSV files",
    pageTitle: "How to Combine Multiple CSV Files Into One",
    h1: "How to combine multiple CSV files into one",
    metaDescription: "Three ways to merge CSV files into one: a tool that matches columns by name, Excel Power Query, and the command line, with the pitfalls of each.",
    summary: "To combine CSV files, append the rows of each file under one header. Copying files together works only when every file has the same columns in the same order; when they differ, use a tool that matches columns by name.",
    tools: ["merge-csv", "remove-duplicates-csv"],
    datePublished: "2026-10-23",
    dateModified: "2026-10-23",
  },
  {
    slug: "fix-invalid-json",
    title: "Fix common JSON errors",
    pageTitle: "Invalid JSON? Common JSON Errors and How to Fix Them",
    h1: "Common JSON errors and how to fix them",
    metaDescription: "The JSON syntax errors that break parsers most often, from trailing commas and single quotes to unescaped characters, with examples and fixes.",
    summary: "Most invalid JSON comes from a handful of mistakes: trailing commas, single quotes, unquoted keys, comments, missing commas and unescaped characters in strings. Find the exact line and column of the error, then fix that spot.",
    tools: ["json-formatter", "json-to-csv"],
    datePublished: "2026-10-23",
    dateModified: "2026-10-23",
  },
  {
    slug: "compare-two-csv-files",
    title: "Compare two CSV files",
    pageTitle: "How to Compare Two CSV Files for Differences (5 Ways)",
    h1: "How to compare two CSV files and find the differences",
    metaDescription: "Compare two CSV files online, in Excel, Notepad++, VS Code or PowerShell. Which method finds changed cells, and which breaks when rows are in another order.",
    summary: "To compare two CSV files reliably, match rows by a key column such as an ID or email, then compare the other columns. Line-by-line tools like Notepad++ and VS Code work only when both files are in the same order.",
    tools: ["compare-csv", "remove-duplicates-csv", "merge-csv"],
    datePublished: "2026-10-26",
    dateModified: "2026-10-26",
  },
  {
    slug: "import-csv-into-mysql",
    title: "Import a CSV file into MySQL",
    pageTitle: "How to Import a CSV File into MySQL (Workbench, phpMyAdmin)",
    h1: "How to import a CSV file into MySQL",
    metaDescription: "Import a CSV into MySQL with Workbench, phpMyAdmin, LOAD DATA INFILE or an INSERT script, and fix the common errors: local infile, secure-file-priv, encoding.",
    summary: "Small files import easily with MySQL Workbench's Table Data Import Wizard or phpMyAdmin's Import tab. Large files load fastest with LOAD DATA INFILE. When the wizards fail or are blocked, an INSERT script generated from the CSV runs anywhere.",
    tools: ["csv-to-sql", "csv-viewer", "remove-duplicates-csv"],
    datePublished: "2026-10-26",
    dateModified: "2026-10-26",
  },
  {
    slug: "import-contacts-from-excel-to-phone",
    title: "Import contacts from Excel to phone",
    pageTitle: "Import Contacts from Excel to Phone: Android & iPhone",
    h1: "How to import contacts from Excel to your phone",
    metaDescription: "Turn an Excel contact list into a VCF file and import it into Android, iPhone or Google Contacts, with country codes so WhatsApp finds every number.",
    summary: "Phones import contacts from a VCF (vCard) file, not from an Excel sheet. Convert the sheet to one VCF file, with phone numbers in international format such as +92 300 1234567, then open it on the phone or import it into Google Contacts. The contacts then show up in WhatsApp too.",
    tools: ["csv-to-vcf", "vcf-to-csv", "remove-duplicates-csv"],
    datePublished: "2026-11-01",
    dateModified: "2026-11-01",
  },
  {
    slug: "open-vcf-file",
    title: "Open a VCF file",
    pageTitle: "How to Open a VCF File (Excel, Windows, Android, iPhone)",
    h1: "How to open a VCF file",
    metaDescription: "A VCF file holds contacts. How to open it on Android, iPhone, Mac and Windows, see every contact in Excel, and why some programs show only the first one.",
    summary: "A VCF (vCard) file stores one or many contacts. Phones and the Mac Contacts app open it to import the contacts. To read it on a Windows computer or in Excel, convert it to CSV first: Excel cannot split a VCF into columns, and some Windows programs show only the first contact.",
    tools: ["vcf-to-csv", "csv-to-vcf", "csv-viewer"],
    datePublished: "2026-11-01",
    dateModified: "2026-11-01",
  },
  {
    slug: "save-excel-as-csv-utf-8",
    title: "Save Excel as CSV UTF-8",
    pageTitle: "How to Save Excel as CSV UTF-8 (Fix ??? Characters)",
    h1: "How to save Excel as CSV UTF-8",
    metaDescription: "Save an Excel sheet as CSV UTF-8 so Urdu, Arabic, Chinese and accented letters do not turn into ???, with steps for Windows and Mac and how to remove the BOM.",
    summary: "Excel's plain CSV (Comma delimited) format uses your computer's old code page, so letters outside it, such as Urdu, Arabic or Chinese, are saved as question marks. Choose CSV UTF-8 (Comma delimited) in Save As instead, available in Excel 2016 and later on Windows and Mac.",
    tools: ["excel-to-csv", "csv-viewer", "csv-delimiter-converter"],
    datePublished: "2026-11-01",
    dateModified: "2026-11-01",
  },
  {
    slug: "reduce-photo-size-in-kb",
    title: "Reduce photo size in KB",
    pageTitle: "How to Reduce Photo Size in KB (Phone, Laptop, Online)",
    h1: "How to reduce a photo's size in KB",
    metaDescription: "Reduce a photo to 20 KB, 50 KB or any size in KB for an online form: in the browser on any phone or laptop, with Paint on Windows, or on iPhone and Samsung.",
    summary: "A photo's size in KB depends on its pixel dimensions and its JPEG quality. The quickest way to hit a limit such as 20 KB or 50 KB is a tool that adjusts both until the file fits, which works in the browser on any phone or laptop. Paint on Windows and the Samsung Gallery app can shrink a photo too, but without aiming at a size.",
    tools: ["resize-image-to-kb", "signature-resizer"],
    datePublished: "2026-11-01",
    dateModified: "2026-11-01",
  },
  {
    slug: "photo-signature-size-online-form",
    title: "Photo and signature size for online forms",
    pageTitle: "Photo & Signature Size for Online Forms: KB, px, cm",
    h1: "Photo and signature size for online application forms",
    metaDescription: "What an online form means by 20–50 KB, 200 × 230 pixels or 3.5 × 4.5 cm, how to convert cm to pixels, and how to fix rejected photo and signature uploads.",
    summary: "Forms describe a photo or signature in up to three ways: file size in KB, dimensions in pixels, and print size in centimetres with a DPI. They measure different things, so a file can pass one and fail another. Meet each number the form gives, save as JPG, and keep a little inside the limits.",
    tools: ["resize-image-to-kb", "signature-resizer"],
    datePublished: "2026-11-02",
    dateModified: "2026-11-02",
  },
];

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

/** Guides that use a given tool, for the "Guides" links on tool pages. */
export function guidesForTool(toolSlug: string): GuideMeta[] {
  return GUIDES.filter((guide) => guide.tools.includes(toolSlug));
}
