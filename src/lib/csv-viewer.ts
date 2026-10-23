import Papa from "papaparse";
import { neutralizeFormulaCells } from "./csv-utils";

/**
 * Logic for the CSV Viewer: building the table from parsed rows, searching,
 * sorting and exporting the current view. Rows are never modified; views are
 * arrays of row indices into the original data.
 */

export type SortDirection = "asc" | "desc";
export interface SortState {
  column: number;
  direction: SortDirection;
}

export interface ViewerTable {
  /** Column names: the first row, or "Column 1", "Column 2", ... */
  headers: string[];
  /** Data rows, each padded to the column count (missing cells are ""). */
  rows: string[][];
  /** Rows whose field count differs from the header (1-based data row numbers, at most 5 listed). */
  raggedRows: number[];
  raggedCount: number;
}

/** Turn parsed CSV rows into a rectangular table for display. */
export function buildViewerTable(parsed: string[][], hasHeader: boolean): ViewerTable {
  const dataRows = hasHeader ? parsed.slice(1) : parsed;
  let columnCount = hasHeader && parsed.length > 0 ? parsed[0].length : 0;
  for (const row of dataRows) if (row.length > columnCount) columnCount = row.length;

  const headers: string[] = [];
  for (let c = 0; c < columnCount; c++) {
    const name = hasHeader ? parsed[0]?.[c] ?? "" : "";
    headers.push(name !== "" ? name : `Column ${c + 1}`);
  }

  const expected = hasHeader && parsed.length > 0 ? parsed[0].length : columnCount;
  const raggedRows: number[] = [];
  let raggedCount = 0;
  const rows = dataRows.map((row, i) => {
    if (row.length !== expected) {
      raggedCount++;
      if (raggedRows.length < 5) raggedRows.push(i + 1);
    }
    if (row.length === columnCount) return row;
    const padded = row.slice();
    while (padded.length < columnCount) padded.push("");
    return padded;
  });

  return { headers, rows, raggedRows, raggedCount };
}

/** Plain decimal numbers such as 42, -7, 3.14, .5, 1e5 (no thousands separators). */
const PLAIN_NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/** True when every non-empty cell in the column is a plain number (and at least one is). */
export function isNumericColumn(rows: string[][], column: number): boolean {
  let seen = false;
  for (const row of rows) {
    const cell = (row[column] ?? "").trim();
    if (cell === "") continue;
    if (!PLAIN_NUMBER.test(cell)) return false;
    seen = true;
  }
  return seen;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/**
 * Sort row indices by one column. Numeric columns sort by value; text columns
 * use a natural, case-insensitive order ("item 2" before "item 10"). Empty
 * cells always go last, and equal values keep their original order.
 */
export function sortIndices(rows: string[][], indices: number[], sort: SortState | null): number[] {
  if (!sort) return indices;
  const { column, direction } = sort;
  const sign = direction === "asc" ? 1 : -1;
  const numeric = isNumericColumn(rows, column);
  const result = indices.slice();

  if (numeric) {
    const keys = new Float64Array(rows.length);
    const empty = new Uint8Array(rows.length);
    for (const i of indices) {
      const cell = (rows[i][column] ?? "").trim();
      if (cell === "") empty[i] = 1;
      else keys[i] = Number(cell);
    }
    result.sort((a, b) => {
      if (empty[a] !== empty[b]) return empty[a] - empty[b];
      if (empty[a]) return a - b;
      return (keys[a] - keys[b]) * sign || a - b;
    });
    return result;
  }

  result.sort((a, b) => {
    const x = rows[a][column] ?? "";
    const y = rows[b][column] ?? "";
    const xe = x.trim() === "";
    const ye = y.trim() === "";
    if (xe !== ye) return xe ? 1 : -1;
    if (xe) return a - b;
    return collator.compare(x, y) * sign || a - b;
  });
  return result;
}

/**
 * Indices of rows containing `query` (case-insensitive), in one column or in
 * any column when `column` is "all". An empty query keeps every row.
 */
export function filterIndices(rows: string[][], query: string, column: number | "all"): number[] {
  const needle = query.trim().toLocaleLowerCase();
  const all: number[] = [];
  if (needle === "") {
    for (let i = 0; i < rows.length; i++) all.push(i);
    return all;
  }
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (column === "all") {
      for (const cell of row) {
        if (cell.toLocaleLowerCase().includes(needle)) {
          all.push(i);
          break;
        }
      }
    } else if ((row[column] ?? "").toLocaleLowerCase().includes(needle)) {
      all.push(i);
    }
  }
  return all;
}

/** The rows shown for a search and sort, as indices into `rows`. */
export function viewIndices(
  rows: string[][],
  query: string,
  column: number | "all",
  sort: SortState | null
): number[] {
  return sortIndices(rows, filterIndices(rows, query, column), sort);
}

/**
 * CSV text for the current view (header first, then the shown rows in order).
 * With `formulaSafe`, formula-like cells get a leading apostrophe.
 */
export function exportView(
  table: ViewerTable,
  indices: number[],
  options: { delimiter: string; formulaSafe: boolean; includeHeader: boolean }
): { csvText: string; rowCount: number; formulaCells: number } {
  const body = indices.map((i) => table.rows[i]);
  const all = options.includeHeader ? [table.headers, ...body] : body;
  const safety = neutralizeFormulaCells(all, options.formulaSafe);
  const csvText = Papa.unparse(safety.rows, { delimiter: options.delimiter });
  return { csvText, rowCount: body.length, formulaCells: safety.count };
}

/** Approximate column widths in pixels from the header and the first rows. */
export function columnWidths(table: ViewerTable, sampleRows = 200): number[] {
  return table.headers.map((header, c) => {
    let longest = header.length + 3;
    const limit = Math.min(sampleRows, table.rows.length);
    for (let r = 0; r < limit; r++) {
      const length = (table.rows[r][c] ?? "").length;
      if (length > longest) longest = length;
    }
    return Math.max(96, Math.min(360, Math.round(longest * 8.5 + 32)));
  });
}
