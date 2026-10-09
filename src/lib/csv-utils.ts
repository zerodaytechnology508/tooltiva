import Papa from "papaparse";
import type { CSVSeparator, CSVOutputOptions } from "./types";

export interface CSVAnalysisResult {
  detectedDelimiter: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  sampleRows: string[][];
  warnings: string[];
  hasRaggedRows: boolean;
}

/**
 * Auto-detect the most likely delimiter by scanning sample lines for standard separators
 */
export function detectDelimiter(text: string): string {
  if (!text || text.trim() === "") return ",";

  const candidates = [",", ";", "\t", "|", ":"];
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0).slice(0, 10);
  if (lines.length === 0) return ",";

  let bestDelimiter = ",";
  let maxConsistentCount = -1;

  for (const delim of candidates) {
    const counts: number[] = [];
    for (const line of lines) {
      // Basic count excluding quoted segments
      let inQuotes = false;
      let count = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        else if (line[i] === delim && !inQuotes) count++;
      }
      counts.push(count);
    }

    const first = counts[0];
    const isConsistent = counts.length > 1 && counts.every((c) => c === first && c > 0);

    if (isConsistent && first > maxConsistentCount) {
      maxConsistentCount = first;
      bestDelimiter = delim;
    } else if (counts.reduce((a, b) => a + b, 0) > maxConsistentCount * lines.length) {
      // Fallback: total frequency
      maxConsistentCount = Math.floor(counts.reduce((a, b) => a + b, 0) / lines.length);
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
}

/**
 * Analyze CSV content for statistics and structural warnings
 */
export function analyzeCSV(text: string, manualDelimiter?: string): CSVAnalysisResult {
  const warnings: string[] = [];
  if (!text || text.trim() === "") {
    return {
      detectedDelimiter: ",",
      rowCount: 0,
      columnCount: 0,
      headers: [],
      sampleRows: [],
      warnings: ["Input is empty."],
      hasRaggedRows: false,
    };
  }

  const delimiter = manualDelimiter && manualDelimiter !== "auto"
    ? manualDelimiter
    : detectDelimiter(text);

  const parsed = Papa.parse<string[]>(text, {
    delimiter,
    skipEmptyLines: false,
    header: false,
  });

  if (parsed.errors && parsed.errors.length > 0) {
    for (const err of parsed.errors.slice(0, 5)) {
      warnings.push(`Row ${err.row !== undefined ? err.row + 1 : "?"}: ${err.message}`);
    }
  }

  const rows = (parsed.data as string[][]).filter((r) => r.some((cell) => cell !== undefined && cell !== ""));
  if (rows.length === 0) {
    return {
      detectedDelimiter: delimiter,
      rowCount: 0,
      columnCount: 0,
      headers: [],
      sampleRows: [],
      warnings: ["No valid data rows found."],
      hasRaggedRows: false,
    };
  }

  const headers = rows[0] || [];
  const expectedColCount = headers.length;
  let raggedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== expectedColCount) {
      raggedCount++;
    }
  }

  if (raggedCount > 0) {
    warnings.push(`Warning: ${raggedCount} row(s) have an inconsistent number of columns compared to row 1.`);
  }

  return {
    detectedDelimiter: delimiter,
    rowCount: rows.length,
    columnCount: expectedColCount,
    headers,
    sampleRows: rows.slice(0, 100), // Preview up to 100 rows
    warnings,
    hasRaggedRows: raggedCount > 0,
  };
}

/**
 * Convert delimiter of a CSV text with RFC 4180 compliance
 */
export function convertCSVDelimiter(
  text: string,
  inputDelimiter: CSVSeparator,
  customInputDelim: string,
  outputOptions: CSVOutputOptions
): { output: string; rowCount: number; warnings: string[] } {
  if (!text || text.trim() === "") {
    return { output: "", rowCount: 0, warnings: ["Input is empty"] };
  }

  const sourceDelim = inputDelimiter === "custom"
    ? customInputDelim
    : inputDelimiter === "auto"
    ? detectDelimiter(text)
    : inputDelimiter;

  const targetDelim = outputOptions.delimiter === "custom"
    ? outputOptions.customDelimiter || ","
    : outputOptions.delimiter;

  const parsed = Papa.parse<string[]>(text, {
    delimiter: sourceDelim,
    skipEmptyLines: false,
    header: false,
  });

  const warnings: string[] = [];
  if (parsed.errors && parsed.errors.length > 0) {
    parsed.errors.slice(0, 3).forEach((err) => {
      warnings.push(`Notice: line ${err.row !== undefined ? err.row + 1 : "?"}: ${err.message}`);
    });
  }

  const unparsed = Papa.unparse(parsed.data, {
    delimiter: targetDelim,
    quotes: outputOptions.quoteAllFields,
    quoteChar: outputOptions.quoteChar,
    escapeChar: outputOptions.escapeChar,
  });

  return {
    output: unparsed,
    rowCount: (parsed.data as string[][]).length,
    warnings,
  };
}
