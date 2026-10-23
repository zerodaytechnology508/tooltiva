import Papa from "papaparse";
import { neutralizeFormulaCells } from "./csv-utils";

/**
 * Logic for Merge CSV: stack the rows of several CSV files into one table.
 * Columns are matched by header name (in any order, ignoring case and
 * surrounding spaces) or by position. Values are never changed.
 */

export interface MergeInput {
  name: string;
  /** Parsed rows, including the header row when `hasHeader` is set. */
  rows: string[][];
}

export interface MergeOptions {
  hasHeader: boolean;
  matchBy: "name" | "position";
  /** Add a first column with the name of the file each row came from. */
  sourceColumn: boolean;
}

export interface MergeFileReport {
  name: string;
  dataRows: number;
  /** Columns this file adds that earlier files did not have (name matching). */
  newColumns: string[];
  /** Columns of the merged table this file does not have (left empty). */
  missingColumns: string[];
  /** Position matching: the file has a different number of columns than the first file. */
  columnCountDiffers?: { expected: number; actual: number };
}

export interface MergeResult {
  headers: string[];
  rows: string[][];
  files: MergeFileReport[];
}

export const SOURCE_COLUMN = "source_file";

const normalize = (name: string) => name.trim().toLowerCase();

/** Keys for a header row: duplicate names inside one file get "#2", "#3", ... so each stays a separate column. */
function headerKeys(header: string[]): string[] {
  const seen = new Map<string, number>();
  return header.map((name, i) => {
    const base = normalize(name) === "" ? `\u0000column ${i + 1}` : normalize(name);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}#${count}`;
  });
}

function uniqueSourceName(headers: string[]): string {
  const taken = new Set(headers.map(normalize));
  let name = SOURCE_COLUMN;
  for (let n = 2; taken.has(name); n++) name = `${SOURCE_COLUMN}_${n}`;
  return name;
}

export function mergeCSVTables(inputs: MergeInput[], options: MergeOptions): MergeResult {
  const files: MergeFileReport[] = [];
  let headers: string[] = [];
  const rows: string[][] = [];
  const sources: string[] = [];

  if (options.matchBy === "name" && options.hasHeader) {
    const keyIndex = new Map<string, number>();
    const fileKeys: string[][] = [];
    // First pass: the union of all columns, in the order they first appear.
    inputs.forEach((input) => {
      const header = input.rows[0] ?? [];
      const keys = headerKeys(header);
      fileKeys.push(keys);
      const added: string[] = [];
      keys.forEach((key, i) => {
        if (!keyIndex.has(key)) {
          keyIndex.set(key, headers.length);
          headers.push(header[i].trim() === "" ? `Column ${headers.length + 1}` : header[i]);
          if (files.length > 0) added.push(headers[headers.length - 1]);
        }
      });
      files.push({ name: input.name, dataRows: Math.max(0, input.rows.length - 1), newColumns: added, missingColumns: [] });
    });
    // Second pass: place each value in its column.
    inputs.forEach((input, f) => {
      const keys = fileKeys[f];
      const targets = keys.map((key) => keyIndex.get(key)!);
      const present = new Set(targets);
      files[f].missingColumns = headers.filter((_, c) => !present.has(c));
      for (let r = 1; r < input.rows.length; r++) {
        const source = input.rows[r];
        const row = new Array<string>(headers.length).fill("");
        // Cells beyond the header (a row with extra fields) are kept in extra columns of their own.
        for (let c = 0; c < source.length; c++) {
          if (c < targets.length) {
            row[targets[c]] = source[c];
          } else {
            const key = `\u0000extra ${f} ${c}`;
            if (!keyIndex.has(key)) {
              keyIndex.set(key, headers.length);
              headers.push(`Column ${headers.length + 1}`);
            }
            row[keyIndex.get(key)!] = source[c];
          }
        }
        rows.push(row);
        sources.push(input.name);
      }
    });
    // Rows merged before an extra column appeared are shorter; pad them.
    for (const row of rows) while (row.length < headers.length) row.push("");
  } else {
    const first = inputs[0]?.rows ?? [];
    let width = 0;
    for (const input of inputs) for (const row of input.rows) if (row.length > width) width = row.length;
    const base = options.hasHeader ? first[0] ?? [] : [];
    headers = Array.from({ length: width }, (_, c) => (base[c] !== undefined && base[c].trim() !== "" ? base[c] : `Column ${c + 1}`));
    const expected = options.hasHeader ? base.length : first[0]?.length ?? 0;
    inputs.forEach((input) => {
      const start = options.hasHeader ? 1 : 0;
      const actual = input.rows[0]?.length ?? 0;
      files.push({
        name: input.name,
        dataRows: Math.max(0, input.rows.length - start),
        newColumns: [],
        missingColumns: [],
        columnCountDiffers: actual !== expected ? { expected, actual } : undefined,
      });
      for (let r = start; r < input.rows.length; r++) {
        const row = input.rows[r].slice();
        while (row.length < width) row.push("");
        rows.push(row);
        sources.push(input.name);
      }
    });
  }

  if (options.sourceColumn) {
    const name = uniqueSourceName(headers);
    headers = [name, ...headers];
    rows.forEach((row, i) => row.unshift(sources[i]));
  }
  return { headers, rows, files };
}

/** The merged table as CSV text (header first). */
export function mergedToCSV(
  result: MergeResult,
  options: { delimiter: string; formulaSafe: boolean; includeHeader: boolean }
): { csvText: string; formulaCells: number } {
  const table = options.includeHeader ? [result.headers, ...result.rows] : result.rows;
  const safety = neutralizeFormulaCells(table, options.formulaSafe);
  return { csvText: Papa.unparse(safety.rows, { delimiter: options.delimiter }), formulaCells: safety.count };
}
