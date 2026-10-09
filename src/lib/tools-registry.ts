import { ToolMeta } from "./types";

export const TOOLS: ToolMeta[] = [
  {
    id: "csv-delimiter-converter",
    slug: "csv-delimiter-converter",
    title: "CSV Delimiter Converter & Fixer",
    badgeTitle: "Delimiter Converter",
    shortDescription: "Change CSV separators between comma, semicolon, tab, and pipe with auto-detection and quote-safe parsing.",
    metaDescription: "Free online CSV delimiter converter. Change separators between semicolon, comma, tab, and pipe. 100% private in-browser processing with live data preview.",
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
        answer: "Never. All parsing and conversion runs 100% client-side directly inside your web browser. Zero bytes of your data leave your computer or touch our servers.",
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
        answer: "By default, Tooltiva features automatic type inference. Numeric strings like '42' are parsed as real numbers and 'true'/'false' as booleans. If you prefer to keep all values as raw string primitives, you can disable type inference with one click.",
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
    id: "json-formatter",
    slug: "json-formatter",
    title: "JSON Formatter, Validator & Auto-Fixer",
    badgeTitle: "JSON Formatter",
    shortDescription: "Beautify, validate, inspect, and automatically fix common JSON syntax errors with pinpoint line diagnostics.",
    metaDescription: "Free online JSON formatter, validator, and syntax fixer. Auto-repair trailing commas and single quotes with an explicit repair log. 100% private.",
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
        answer: "Yes. Tooltiva includes an interactive collapsible tree viewer displaying element counts and object hierarchies alongside the formatted code.",
      },
    ],
  },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
