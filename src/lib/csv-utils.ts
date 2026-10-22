import Papa from "papaparse";
import type { CSVSeparator, CSVOutputOptions } from "./types";

/** Separators considered by auto-detection, in tie-break order. */
export const DELIMITER_CANDIDATES = [",", ";", "\t", "|", ":"] as const;

export interface CSVAnalysisResult {
  detectedDelimiter: string;
  /** Number of data rows (the header row is not counted). */
  rowCount: number;
  columnCount: number;
  headers: string[];
  /** Up to the first 100 data rows (the header row is not included). */
  sampleRows: string[][];
  warnings: string[];
  hasRaggedRows: boolean;
  /** Set when the CSV is malformed and no preview rows can be trusted. */
  error?: string;
}

export interface ParsedCSVRows {
  /** Records with completely blank lines removed. */
  rows: string[][];
  /** Readable, de-duplicated parser notices other than quote errors (at most five). */
  errors: string[];
  /**
   * Set when the quoting is malformed (a quoted field that is never closed, or
   * text after a closing quote). The parser cannot tell where the affected
   * record ends, so `rows` may contain merged or split records and must not be
   * used as conversion output. The message names the line and column.
   */
  fatalError?: string;
  /** Blank lines removed before or between records (a trailing newline is not counted). */
  skippedBlankLines: number;
}

/**
 * The single CSV parsing routine used by the preview, the delimiter converter
 * and CSV to JSON, so they always agree on rows and fields. Values are kept as
 * text exactly as written (quotes removed, no trimming, no type conversion).
 * Completely blank lines carry no data and are skipped.
 */
export function parseCSVRows(text: string, delimiter: string, preview = 0): ParsedCSVRows {
  const parsed = Papa.parse<string[]>(text, {
    delimiter,
    header: false,
    dynamicTyping: false,
    skipEmptyLines: false,
    preview,
  });
  const rows: string[][] = [];
  let blankLines = 0;
  let trailingBlankLines = 0;
  for (const row of parsed.data) {
    if (row.length === 1 && row[0] === "") {
      blankLines++;
      trailingBlankLines++;
      continue;
    }
    trailingBlankLines = 0;
    rows.push(row);
  }
  const errors: string[] = [];
  let fatalError: string | undefined;
  for (const err of parsed.errors) {
    if (err.code === "UndetectableDelimiter") continue;
    if (err.code === "MissingQuotes" || err.code === "InvalidQuotes") {
      // Only the first quote error is meaningful: after it the parser is out of
      // step with the record boundaries, and later quote errors (PapaParse
      // repeats them for every following quote) are side effects.
      if (!fatalError) fatalError = describeQuoteError(text, err.code, err.index);
      continue;
    }
    const message = `Row ${err.row !== undefined ? err.row + 1 : "?"}: ${err.message}`;
    if (!errors.includes(message) && errors.length < 5) errors.push(message);
  }
  return { rows, errors, skippedBlankLines: blankLines - trailingBlankLines, ...(fatalError ? { fatalError } : {}) };
}

/** 1-based line and column of a character offset (CRLF, LF and CR all end a line). */
function lineAndColumn(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    const char = text[i];
    if (char === "\n" || (char === "\r" && text[i + 1] !== "\n")) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: offset - lineStart + 1 };
}

/**
 * Explain a PapaParse quote error. PapaParse reports the offset just after the
 * opening quote of the affected field, so the location points at that quote.
 */
function describeQuoteError(text: string, code: "MissingQuotes" | "InvalidQuotes", index: number | undefined): string {
  const quoteOffset = typeof index === "number" && index > 0 ? index - 1 : -1;
  const where =
    quoteOffset >= 0 && text[quoteOffset] === '"'
      ? (() => {
          const { line, column } = lineAndColumn(text, quoteOffset);
          return `Line ${line}, column ${column}: the quoted field that starts here`;
        })()
      : "A quoted field";
  const problem =
    code === "MissingQuotes"
      ? "is never closed, so the rest of the file would be read as part of this one value."
      : "has extra text after its closing quote, so the record boundaries cannot be determined.";
  return `Malformed CSV. ${where} ${problem} Close the field with a double quote ("), and write any double quote inside a quoted value twice (""). Nothing was converted.`;
}

const DETECTION_SAMPLE_CHARS = 65536;
const DETECTION_SAMPLE_ROWS = 20;

/**
 * Pick the separator that splits the first rows into the most consistent
 * number of fields (at least two). Parsing is quote-aware, so separators
 * inside quoted values are ignored. Ties prefer more fields, then the order of
 * DELIMITER_CANDIDATES. Single-column input defaults to a comma.
 */
export function detectDelimiter(text: string): string {
  if (!text || text.trim() === "") return ",";
  const sample = text.length > DETECTION_SAMPLE_CHARS ? text.slice(0, DETECTION_SAMPLE_CHARS) : text;
  let best = ",";
  let bestScore = 0;
  let bestFields = 0;
  for (const delimiter of DELIMITER_CANDIDATES) {
    const { rows } = parseCSVRows(sample, delimiter, DETECTION_SAMPLE_ROWS);
    if (rows.length === 0) continue;
    const frequency = new Map<number, number>();
    for (const row of rows) frequency.set(row.length, (frequency.get(row.length) ?? 0) + 1);
    let modalFields = 1;
    let modalCount = 0;
    frequency.forEach((count, fields) => {
      if (count > modalCount || (count === modalCount && fields > modalFields)) {
        modalFields = fields;
        modalCount = count;
      }
    });
    if (modalFields < 2) continue;
    const score = modalCount / rows.length;
    if (score > bestScore || (score === bestScore && modalFields > bestFields)) {
      best = delimiter;
      bestScore = score;
      bestFields = modalFields;
    }
  }
  return best;
}

/** Characters that cannot be used as a field separator. */
function separatorProblem(separator: string): string | null {
  if (separator === "") return "Enter a custom separator character.";
  if (separator === '"') return "The double quote is used for quoting and cannot be the separator.";
  if (separator === "\n" || separator === "\r") return "A line break cannot be the separator.";
  return null;
}

/**
 * Resolve the separator chosen in the UI ("auto", a fixed character, or a
 * custom one) to the actual character. The preview and the conversion must use
 * the value returned here so they cannot disagree.
 */
export function resolveDelimiter(
  text: string,
  choice: CSVSeparator | string,
  customDelimiter = ""
): { delimiter: string; error?: string } {
  if (choice === "auto") return { delimiter: detectDelimiter(text) };
  const delimiter = choice === "custom" ? customDelimiter : choice;
  const problem = separatorProblem(delimiter);
  return problem ? { delimiter, error: problem } : { delimiter };
}

/**
 * Analyse CSV text for the table preview. `delimiter` may be omitted or "auto"
 * to detect it. When `hasHeader` is false the columns are named "Column 1", ...
 */
export function analyzeCSV(
  text: string,
  delimiter?: string,
  options: { hasHeader?: boolean } = {}
): CSVAnalysisResult {
  const hasHeader = options.hasHeader !== false;
  const resolved = !delimiter || delimiter === "auto" ? detectDelimiter(text) : delimiter;
  const empty = (warning: string): CSVAnalysisResult => ({
    detectedDelimiter: resolved,
    rowCount: 0,
    columnCount: 0,
    headers: [],
    sampleRows: [],
    warnings: [warning],
    hasRaggedRows: false,
  });
  if (!text || text.trim() === "") return empty("Input is empty.");

  const { rows, errors, skippedBlankLines, fatalError } = parseCSVRows(text, resolved);
  if (fatalError) return { ...empty(fatalError), error: fatalError };
  if (rows.length === 0) return empty("No data rows found.");

  const warnings = [...errors];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const columnCount = hasHeader ? rows[0].length : Math.max(...rows.slice(0, 1000).map((r) => r.length));
  const headers = hasHeader ? rows[0] : Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);

  let raggedCount = 0;
  for (const row of dataRows) if (row.length !== columnCount) raggedCount++;
  if (raggedCount > 0) {
    warnings.push(
      hasHeader
        ? `Warning: ${raggedCount} data row(s) have a different number of columns than the header row.`
        : `Warning: ${raggedCount} row(s) have a different number of columns than the widest row.`
    );
  }
  if (hasHeader && dataRows.length === 0) warnings.push("The CSV has a header row but no data rows.");
  if (skippedBlankLines > 0) warnings.push(`${skippedBlankLines} blank line(s) were ignored.`);

  return {
    detectedDelimiter: resolved,
    rowCount: dataRows.length,
    columnCount,
    headers,
    sampleRows: dataRows.slice(0, 100),
    warnings,
    hasRaggedRows: raggedCount > 0,
  };
}

// ---------------------------------------------------------------------------
// Spreadsheet formula injection
// ---------------------------------------------------------------------------

/**
 * Spreadsheet apps (Excel, LibreOffice Calc, Google Sheets) may evaluate a CSV
 * cell as a formula when it starts with one of these characters (OWASP CSV
 * injection guidance). Tab and carriage return are included because some
 * apps strip them and then evaluate what follows.
 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
/** Plain numbers such as -5, +3.2, -1,234.50, -12%, 1e-3 are data, not formulas. */
const PLAIN_NUMBER = /^[+-]?(?:\d[\d,.]*|[.,]\d[\d,.]*)(?:[eE][+-]?\d+)?%?$/;
/** Placeholders made only of dashes or plus signs ("-", "---") are not formulas either. */
const SIGNS_ONLY = /^[+-]+$/;

/** True when a cell would be treated as a formula by common spreadsheet apps. */
export function isFormulaRisk(cell: string): boolean {
  return FORMULA_TRIGGER.test(cell) && !PLAIN_NUMBER.test(cell) && !SIGNS_ONLY.test(cell);
}

/**
 * Count formula-like cells and, when `enabled`, prefix each with an apostrophe
 * so spreadsheet apps show it as text. Returns new rows; the input is not
 * modified.
 */
export function neutralizeFormulaCells(
  rows: string[][],
  enabled: boolean
): { rows: string[][]; count: number } {
  let count = 0;
  const out = rows.map((row) =>
    row.map((cell) => {
      if (!isFormulaRisk(cell)) return cell;
      count++;
      return enabled ? `'${cell}` : cell;
    })
  );
  return { rows: out, count };
}

/** The notice shown when formula-like cells were found. */
export function formulaNotice(count: number, neutralized: boolean): string | null {
  if (count === 0) return null;
  return neutralized
    ? `${count} cell(s) starting with =, +, -, @, a tab or a carriage return were prefixed with an apostrophe (') so spreadsheet apps treat them as text, not formulas. Turn off "Spreadsheet-safe output" to keep these values unchanged.`
    : `${count} cell(s) start with =, +, -, @, a tab or a carriage return and may run as formulas if this CSV is opened in a spreadsheet app. Turn on "Spreadsheet-safe output" to neutralize them.`;
}

// ---------------------------------------------------------------------------
// Excel encoding compatibility
// ---------------------------------------------------------------------------

const NON_ASCII = /[^\x00-\x7f]/;

/**
 * Excel on Windows opens a CSV without a byte-order mark using the legacy
 * system code page, which garbles accented, non-Latin and emoji characters.
 * A UTF-8 BOM makes Excel read the file as UTF-8. ASCII-only files are
 * returned unchanged because they look the same in every encoding.
 */
export function withExcelBOM(csvText: string): string {
  return NON_ASCII.test(csvText) ? `﻿${csvText}` : csvText;
}

// ---------------------------------------------------------------------------
// Delimiter conversion
// ---------------------------------------------------------------------------

/**
 * Convert the separator of CSV text while keeping every value intact
 * (RFC 4180 quoting is applied as needed for the new separator).
 */
export function convertCSVDelimiter(
  text: string,
  inputDelimiter: CSVSeparator,
  customInputDelim: string,
  outputOptions: CSVOutputOptions
): { output: string; rowCount: number; warnings: string[]; ok: boolean; formulaCells: number } {
  const failed = (message: string) => ({ output: "", rowCount: 0, warnings: [message], ok: false, formulaCells: 0 });
  if (!text || text.trim() === "") return failed("Input is empty");

  const source = resolveDelimiter(text, inputDelimiter, customInputDelim);
  if (source.error) return failed(`Source separator: ${source.error}`);
  const target = resolveDelimiter(text, outputOptions.delimiter, outputOptions.customDelimiter ?? "");
  if (target.error) return failed(`Target separator: ${target.error}`);

  const { rows, errors, fatalError } = parseCSVRows(text, source.delimiter);
  if (fatalError) return failed(fatalError);
  if (rows.length === 0) return failed("No data rows found.");

  const warnings = errors.map((e) => `Notice: ${e}`);
  const safety = neutralizeFormulaCells(rows, outputOptions.formulaSafe === true);
  const notice = formulaNotice(safety.count, outputOptions.formulaSafe === true);
  if (notice) warnings.push(notice);

  const output = Papa.unparse(safety.rows, {
    delimiter: target.delimiter,
    quotes: outputOptions.quoteAllFields,
    quoteChar: outputOptions.quoteChar,
    escapeChar: outputOptions.escapeChar,
  });

  return { output, rowCount: rows.length, warnings, ok: true, formulaCells: safety.count };
}
