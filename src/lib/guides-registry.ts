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
    tools: ["csv-delimiter-converter", "csv-viewer"],
    datePublished: "2026-10-23",
    dateModified: "2026-10-23",
  },
  {
    slug: "csv-too-large-for-excel",
    title: "Open a CSV too large for Excel",
    pageTitle: "CSV Too Large for Excel? Open Files Over 1,048,576 Rows",
    h1: "How to open a CSV file that is too large for Excel",
    metaDescription: "Excel stops at 1,048,576 rows and leaves the rest of a large CSV out. How to view the whole file, split it for Excel, or load it with Power Query.",
    summary: "An Excel worksheet holds at most 1,048,576 rows, and Excel drops everything after that when it opens a bigger CSV. To work with the whole file, view it in a tool without that limit, split it into smaller files, or load it into Excel's Data Model.",
    tools: ["csv-viewer", "split-csv"],
    datePublished: "2026-10-23",
    dateModified: "2026-10-23",
  },
  {
    slug: "excel-leading-zeros-csv",
    title: "Stop Excel removing leading zeros",
    pageTitle: "Excel Removing Leading Zeros From CSV? How to Keep Them",
    h1: "How to stop Excel removing leading zeros from a CSV file",
    metaDescription: "Excel turns 00123 into 123 and long IDs into 1.23E+17 when it opens a CSV. Why it happens and how to import the file without losing data.",
    summary: "Excel converts anything that looks like a number when it opens a CSV, so 00123 becomes 123 and long IDs are rounded. The values are still correct in the file; import it with those columns set to Text, and never save it back from Excel until you have.",
    tools: ["csv-viewer", "csv-delimiter-converter"],
    datePublished: "2026-10-23",
    dateModified: "2026-10-23",
  },
  {
    slug: "csv-strange-characters-encoding",
    title: "Fix strange characters in a CSV",
    pageTitle: "Strange Characters in CSV (Ã©, �)? Fix CSV Encoding",
    h1: "How to fix strange characters like Ã© and � in a CSV file",
    metaDescription: "Seeing Ã© or � instead of accented letters? The CSV was read with the wrong encoding. How to tell which problem you have and fix it safely.",
    summary: "Characters such as Ã© and â€™ appear when a UTF-8 file is read as Windows-1252, and � appears when the opposite happens. The text is usually not damaged yet: open the file with the right encoding, and save it as UTF-8 with a byte order mark so Excel reads it correctly.",
    tools: ["csv-viewer", "csv-delimiter-converter"],
    datePublished: "2026-10-23",
    dateModified: "2026-10-23",
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
];

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

/** Guides that use a given tool, for the "Guides" links on tool pages. */
export function guidesForTool(toolSlug: string): GuideMeta[] {
  return GUIDES.filter((guide) => guide.tools.includes(toolSlug));
}
