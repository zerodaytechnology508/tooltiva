import { ToolMeta } from "./types";

export const TOOLS: ToolMeta[] = [
  {
    id: "csv-delimiter-converter",
    slug: "csv-delimiter-converter",
    title: "CSV Delimiter Converter & Fixer",
    badgeTitle: "Delimiter Converter",
    shortDescription: "Change CSV separators between comma, semicolon, tab, and pipe with auto-detection and quote-safe parsing.",
    metaDescription: "Free online CSV delimiter converter. Change separators between semicolon, comma, tab, and pipe. CSV content stays in your browser with live data preview.",
    category: "Data & CSV",
    primaryKeyword: "change csv delimiter",
    secondaryKeywords: [
      "csv delimiter converter",
      "convert csv semicolon to comma",
      "change csv separator online",
      "tsv to csv converter",
      "fix csv delimiter",
    ],
    icon: "FileSpreadsheet",
    canonicalUrl: "https://tooltiva.net/tools/csv-delimiter-converter/",
    lastUpdated: "2026-10-10",
    faqs: [
      {
        question: "Why does my CSV open in a single column in Excel?",
        answer: "Excel relies on regional operating system settings. In many European countries, the list separator is a semicolon (;) because commas are used as decimal points. If you open a standard comma-separated CSV on such a system, Excel fails to split the columns. Using Tooltiva's Delimiter Converter to change commas to semicolons resolves this instantly.",
      },
      {
        question: "Does changing the delimiter break commas inside quoted text?",
        answer: "No. Tooltiva uses RFC 4180-compliant quote-aware parsing. Commas located inside quotation marks (e.g., 'Acme, Inc.') are preserved as literal text and will never be mistakenly converted into new column separators.",
      },
      {
        question: "Is my spreadsheet data uploaded to any server?",
        answer: "The CSV contents you process are not uploaded to a server or included in analytics. All parsing and conversion runs locally in your browser. Optional general site-usage analytics loads only if you accept it or enable it in Manage Preferences using Privacy settings.",
      },
      {
        question: "What delimiters are supported?",
        answer: "Tooltiva supports commas (,), semicolons (;), tabs (\\t), pipes (|), colons (:), and custom user-defined separators.",
      },
      {
        question: "Can I preview my data before downloading the converted file?",
        answer: "Yes. Tooltiva includes an interactive table preview allowing you to inspect rows, verify column counts, and review warnings before copying or exporting.",
      },
    ],
  },
  {
    id: "csv-to-json",
    slug: "csv-to-json",
    title: "CSV ⇄ JSON Converter",
    badgeTitle: "CSV ↔ JSON",
    shortDescription: "Transform CSV tabular data into structured JSON or flatten JSON into CSV with type inference and custom formatting.",
    metaDescription: "Instant two-way CSV to JSON and JSON to CSV converter. Clean, private browser-based transformation with smart type detection and formatting options.",
    category: "Data & CSV",
    primaryKeyword: "csv to json",
    secondaryKeywords: [
      "json to csv converter",
      "convert csv to json online",
      "csv to json with headers",
      "tabular data to json",
    ],
    icon: "ArrowLeftRight",
    canonicalUrl: "https://tooltiva.net/tools/csv-to-json/",
    lastUpdated: "2026-10-10",
    faqs: [
      {
        question: "How does the CSV to JSON converter handle numbers and booleans?",
        answer: "By default, every value is kept exactly as text, so identifiers like '00123', codes like '1e5' and empty cells are never changed. If you choose 'Convert exact numbers & true/false', a value becomes a JSON number or boolean only when that form is spelled exactly the same, such as '42', '-7', '98.5' or 'true'; everything else stays text.",
      },
      {
        question: "Can I convert JSON back into a CSV file?",
        answer: "Yes. Tooltiva is a complete two-way converter. You can switch modes instantly to flatten JSON arrays of objects or dictionary objects into standard RFC 4180 CSV.",
      },
      {
        question: "What JSON output formats are available?",
        answer: "You can choose between an Array of Objects ([{...}]) or a 2D Array ([[], []]).",
      },
      {
        question: "Does this tool work with large CSV files?",
        answer: "Yes. Because processing runs in your browser's memory without network latency or server timeouts, files with thousands of rows convert in milliseconds.",
      },
    ],
  },
  {
    id: "json-to-csv",
    slug: "json-to-csv",
    title: "JSON to CSV Converter",
    badgeTitle: "JSON to CSV",
    shortDescription: "Convert JSON arrays or keyed objects into CSV with selectable delimiters, preview, and export.",
    metaDescription: "Convert JSON arrays and keyed objects to CSV online. Choose a delimiter, preview the table, then copy or download your CSV. Processing stays in your browser.",
    category: "Data & CSV",
    primaryKeyword: "json to csv converter",
    secondaryKeywords: [
      "convert json to csv online",
      "json array to csv",
      "export json data to csv",
      "json to comma separated values",
    ],
    icon: "ArrowLeftRight",
    canonicalUrl: "https://tooltiva.net/tools/json-to-csv/",
    lastUpdated: "2026-10-16",
    faqs: [
      {
        question: "What JSON can I convert to CSV?",
        answer: "The converter accepts a JSON array or an object dictionary. For tabular output, use an array of objects with properties representing columns. A dictionary of records is also converted to rows with its keys included as an _id column.",
      },
      {
        question: "Can I choose the CSV delimiter?",
        answer: "Yes. Choose comma, semicolon, tab, or pipe. The converter quotes fields when needed for the selected delimiter, or you can choose to quote every field.",
      },
      {
        question: "How do I check the result before exporting?",
        answer: "Use the CSV Result tab to inspect the generated text or Table Preview to review parsed columns and sample rows. You can then copy the result or download it as a CSV file.",
      },
      {
        question: "Is my JSON uploaded to a server?",
        answer: "No. JSON parsing and CSV generation happen in your browser. Tool input is not sent to Tooltiva's processing server.",
      },
      {
        question: "What happens to nested values in an object row?",
        answer: "Nested objects and arrays are not expanded into separate CSV columns. Each one is written as compact JSON text inside a single cell, and the converter tells you how many were written this way. For a flat table, flatten nested data into regular properties before converting.",
      },
    ],
  },
  {
    id: "json-formatter",
    slug: "json-formatter",
    title: "JSON Formatter, Validator & Auto-Fixer",
    badgeTitle: "JSON Formatter",
    shortDescription: "Beautify, validate, inspect, and automatically fix common JSON syntax errors with pinpoint line diagnostics.",
    metaDescription: "Free online JSON formatter, validator, and syntax fixer. Auto-repair trailing commas and single quotes locally in your browser with an explicit repair log.",
    category: "Developer",
    primaryKeyword: "json formatter",
    secondaryKeywords: [
      "json validator",
      "fix invalid json online",
      "beautify json",
      "json syntax repair",
      "json tree viewer",
    ],
    icon: "Code2",
    canonicalUrl: "https://tooltiva.net/tools/json-formatter/",
    lastUpdated: "2026-10-10",
    faqs: [
      {
        question: "What common JSON errors can the Auto-Fixer repair?",
        answer: "The Auto-Fix engine detects and repairs trailing commas before closing braces/brackets, single-quoted strings ('key': 'val'), unquoted dictionary keys ({key: 1}), and accidental JavaScript comments (// or /* */).",
      },
      {
        question: "Does the auto-repair feature modify my data silently?",
        answer: "No. Tooltiva displays a transparent repair log detailing the exact number and type of fixes applied, allowing you to review and verify every modification.",
      },
      {
        question: "How does the validator pinpoint syntax errors?",
        answer: "If validation fails, Tooltiva extracts the exact line number, column position, and a contextual code snippet highlighting the offending character.",
      },
      {
        question: "Can I inspect complex nested JSON structures visually?",
        answer: "Yes. Tooltiva includes a tree view that shows how objects and arrays are nested, with element counts, alongside the formatted code.",
      },
    ],
  },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
