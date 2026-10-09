export type ToolCategory = "Data & CSV" | "Developer" | "Formatters";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ToolMeta {
  id: string;
  slug: string;
  title: string;
  badgeTitle: string;
  shortDescription: string;
  metaDescription: string;
  category: ToolCategory;
  primaryKeyword: string;
  secondaryKeywords: string[];
  icon: string;
  faqs: FAQItem[];
  canonicalUrl: string;
  lastUpdated: string;
}

export type CSVSeparator = "auto" | "," | ";" | "\t" | "|" | ":" | "custom";

export interface CSVParseOptions {
  delimiter: CSVSeparator;
  customDelimiter?: string;
  hasHeader: boolean;
  skipEmptyLines: boolean;
  trimWhitespace: boolean;
}

export interface CSVOutputOptions {
  delimiter: "," | ";" | "\t" | "|" | ":" | "custom";
  customDelimiter?: string;
  quoteChar: '"' | "'";
  quoteAllFields: boolean;
  escapeChar: '"' | "\\";
}

export interface JSONRepairLog {
  id: string;
  rule: "trailing-comma" | "single-to-double-quotes" | "unquoted-key" | "comment-stripped" | "unescaped-quote";
  description: string;
  count: number;
}

export interface JSONValidationResult {
  isValid: boolean;
  error?: {
    message: string;
    line?: number;
    column?: number;
    snippet?: string;
  };
  repairedText?: string;
  repairsApplied?: JSONRepairLog[];
}
