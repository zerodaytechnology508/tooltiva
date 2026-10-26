import Papa from "papaparse";
import { neutralizeFormulaCells } from "./csv-utils";

/**
 * Logic for Compare CSV: find the rows that were added, removed or changed
 * between two CSV files, and which cells changed. Columns are matched by
 * header name (in any order, ignoring case and surrounding spaces) or, for
 * files without a header row, by position. Values are never modified; the
 * result refers to rows by their index in each file.
 */

export interface CompareTable {
  /** Column names: the header row, or "Column 1", "Column 2", ... */
  headers: string[];
  /** Data rows, each padded to the header length. */
  rows: string[][];
}

export interface CompareColumn {
  /** Display name (from file 2 when both files have it). */
  name: string;
  /** Column index in file 1, or -1 when the column is only in file 2. */
  a: number;
  /** Column index in file 2, or -1 when the column is only in file 1. */
  b: number;
}

export type RowMatching = "key" | "position" | "content";

export interface CompareOptions {
  /** Match columns by header name (true) or by position (false, files without a header). */
  matchColumnsByName: boolean;
  /**
   * How rows are paired:
   * - "key": rows with the same value in the key columns (an ID, email or SKU)
   * - "position": row 1 with row 1, row 2 with row 2, ...
   * - "content": whole rows, in any order; a row is either in both files or not
   */
  rowMatching: RowMatching;
  /** Indexes into `columns` used as the key ("key" matching). */
  keyColumns: number[];
  /** Indexes into `columns` left out of the comparison. */
  ignoredColumns: number[];
  ignoreCase: boolean;
  /** Ignore spaces at the start and end of values. */
  trimSpaces: boolean;
  /** Treat 1.50 and 1.5 (or 007 and 7) as the same value. */
  numericEquality: boolean;
}

export type RowStatus = "same" | "changed" | "added" | "removed";

export interface CompareRow {
  status: RowStatus;
  /** Row index in file 1 (data rows, 0-based), absent for added rows. */
  a?: number;
  /** Row index in file 2, absent for removed rows. */
  b?: number;
  /** Indexes into `columns` whose values differ (changed rows only). */
  changed?: number[];
}

export interface CompareResult {
  columns: CompareColumn[];
  /** Columns compared (both files have them, and they are not ignored). */
  compared: number[];
  rows: CompareRow[];
  counts: Record<RowStatus, number>;
  /** Number of changed cells across all changed rows. */
  changedCells: number;
  /** Key values that occur more than once in a file ("key" matching). Paired in file order. */
  duplicateKeys: { a: number; b: number; examples: string[] };
  /** Rows whose key columns are all empty; they cannot be matched and count as removed or added. */
  emptyKeys: { a: number; b: number };
}

const normalizeName = (name: string) => name.trim().toLowerCase();
/** Plain decimal numbers such as 42, -7, 3.14, .5, 1e5 (no thousands separators). */
const PLAIN_NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
/** Joins values; a control character cannot be confused with cell content boundaries. */
const SEPARATOR = "\u0000\u001f";

/** Pair the columns of two files by header name or by position. */
export function matchColumns(a: CompareTable, b: CompareTable, byName: boolean): CompareColumn[] {
  if (!byName) {
    const width = Math.max(a.headers.length, b.headers.length);
    return Array.from({ length: width }, (_, c) => ({
      name: b.headers[c] ?? a.headers[c] ?? `Column ${c + 1}`,
      a: c < a.headers.length ? c : -1,
      b: c < b.headers.length ? c : -1,
    }));
  }
  // Duplicate names inside one file are paired in order: the second "phone" with the second "phone".
  const keysOf = (headers: string[]) => {
    const seen = new Map<string, number>();
    return headers.map((h) => {
      const base = normalizeName(h);
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return n === 1 ? base : `${base}\u0000${n}`;
    });
  };
  const aKeys = keysOf(a.headers);
  const bKeys = keysOf(b.headers);
  const bIndex = new Map(bKeys.map((k, i) => [k, i]));
  const used = new Set<number>();
  const columns: CompareColumn[] = [];
  // File 2's column order first (it is usually the newer file), then columns only in file 1.
  const aIndex = new Map(aKeys.map((k, i) => [k, i]));
  bKeys.forEach((key, i) => {
    const ai = aIndex.get(key);
    if (ai !== undefined) used.add(ai);
    columns.push({ name: b.headers[i], a: ai ?? -1, b: i });
  });
  aKeys.forEach((key, i) => {
    if (!used.has(i) && !bIndex.has(key)) columns.push({ name: a.headers[i], a: i, b: -1 });
  });
  return columns;
}

/** Make a value comparable under the chosen options. */
function normalizerFor(options: Pick<CompareOptions, "ignoreCase" | "trimSpaces" | "numericEquality">) {
  return (value: string): string => {
    let v = value;
    if (options.trimSpaces) v = v.trim();
    if (options.numericEquality && PLAIN_NUMBER.test(v.trim())) {
      const n = Number(v.trim());
      if (Number.isFinite(n)) return `\u0000n${n}`;
    }
    if (options.ignoreCase) v = v.toLocaleLowerCase();
    return v;
  };
}

/**
 * Suggest a key column: a shared column whose values are filled in and unique in both
 * files, and where most values of the smaller file also occur in the other file (so a
 * column such as price, unique by chance, is not mistaken for an identifier).
 */
export function suggestKeyColumn(a: CompareTable, b: CompareTable, columns: CompareColumn[]): number | null {
  const uniqueValues = (rows: string[][], c: number): Set<string> | null => {
    if (rows.length === 0) return null;
    const seen = new Set<string>();
    for (const row of rows) {
      const v = (row[c] ?? "").trim();
      if (v === "" || seen.has(v)) return null;
      seen.add(v);
    }
    return seen;
  };
  // Prefer columns that look like identifiers by name.
  const order = columns
    .map((col, i) => ({ col, i }))
    .filter(({ col }) => col.a >= 0 && col.b >= 0)
    .sort((x, y) => idScore(y.col.name) - idScore(x.col.name));
  for (const { col, i } of order) {
    const va = uniqueValues(a.rows, col.a);
    const vb = va && uniqueValues(b.rows, col.b);
    if (!va || !vb) continue;
    const [small, large] = va.size <= vb.size ? [va, vb] : [vb, va];
    let shared = 0;
    small.forEach((v) => {
      if (large.has(v)) shared++;
    });
    if (shared / small.size > 0.5) return i;
  }
  return null;
}

function idScore(name: string): number {
  const n = normalizeName(name).replace(/[\s_-]+/g, "");
  if (/^(id|key|uuid|guid)$/.test(n)) return 3;
  if (/(id|code|sku|number|no|email|key)$/.test(n)) return 2;
  return 0;
}

export function compareCSV(a: CompareTable, b: CompareTable, options: CompareOptions): CompareResult {
  const columns = matchColumns(a, b, options.matchColumnsByName);
  const ignored = new Set(options.ignoredColumns);
  const keySet = new Set(options.rowMatching === "key" ? options.keyColumns : []);
  const compared = columns
    .map((col, i) => ({ col, i }))
    .filter(({ col, i }) => col.a >= 0 && col.b >= 0 && !ignored.has(i) && !keySet.has(i))
    .map(({ i }) => i);
  const norm = normalizerFor(options);

  const rows: CompareRow[] = [];
  const counts: Record<RowStatus, number> = { same: 0, changed: 0, added: 0, removed: 0 };
  let changedCells = 0;
  const duplicateKeys = { a: 0, b: 0, examples: [] as string[] };
  const emptyKeys = { a: 0, b: 0 };

  const diffCells = (ai: number, bi: number): number[] => {
    const ra = a.rows[ai];
    const rb = b.rows[bi];
    const out: number[] = [];
    for (const c of compared) {
      const col = columns[c];
      if (norm(ra[col.a] ?? "") !== norm(rb[col.b] ?? "")) out.push(c);
    }
    return out;
  };
  const pair = (ai: number, bi: number) => {
    const changed = diffCells(ai, bi);
    if (changed.length === 0) {
      rows.push({ status: "same", a: ai, b: bi });
      counts.same++;
    } else {
      rows.push({ status: "changed", a: ai, b: bi, changed });
      counts.changed++;
      changedCells += changed.length;
    }
  };

  if (options.rowMatching === "position") {
    const n = Math.max(a.rows.length, b.rows.length);
    for (let i = 0; i < n; i++) {
      if (i < a.rows.length && i < b.rows.length) pair(i, i);
      else if (i < a.rows.length) {
        rows.push({ status: "removed", a: i });
        counts.removed++;
      } else {
        rows.push({ status: "added", b: i });
        counts.added++;
      }
    }
  } else {
    // Key matching uses the key columns; content matching uses every compared column.
    const keyCols =
      options.rowMatching === "key"
        ? options.keyColumns.filter((c) => columns[c] && columns[c].a >= 0 && columns[c].b >= 0)
        : compared;
    const keyOf = (row: string[], side: "a" | "b"): string | null => {
      const parts: string[] = [];
      let empty = true;
      for (const c of keyCols) {
        const v = norm(row[columns[c][side]] ?? "");
        if (v !== "") empty = false;
        parts.push(v);
      }
      return empty && options.rowMatching === "key" ? null : parts.join(SEPARATOR);
    };

    // Index file 2: key -> row indexes in file order.
    const bByKey = new Map<string, number[]>();
    const bEmpty: number[] = [];
    for (let i = 0; i < b.rows.length; i++) {
      const key = keyOf(b.rows[i], "b");
      if (key === null) {
        bEmpty.push(i);
        continue;
      }
      const list = bByKey.get(key);
      if (list) list.push(i);
      else bByKey.set(key, [i]);
    }
    const matchedB = new Uint8Array(b.rows.length);
    const aSeen = new Map<string, number>();

    // Walk file 1 in order; the nth row with a key pairs with the nth row with that key in file 2.
    for (let i = 0; i < a.rows.length; i++) {
      const key = keyOf(a.rows[i], "a");
      if (key === null) emptyKeys.a++;
      const nth = key === null ? 0 : aSeen.get(key) ?? 0;
      if (key !== null) aSeen.set(key, nth + 1);
      const bi = key === null ? undefined : bByKey.get(key)?.[nth];
      if (bi === undefined) {
        rows.push({ status: "removed", a: i });
        counts.removed++;
        continue;
      }
      matchedB[bi] = 1;
      if (options.rowMatching === "key") pair(i, bi);
      else {
        rows.push({ status: "same", a: i, b: bi });
        counts.same++;
      }
    }

    // Rows of file 2 that nothing in file 1 matched, in file order.
    for (let i = 0; i < b.rows.length; i++) {
      if (!matchedB[i]) {
        rows.push({ status: "added", b: i });
        counts.added++;
      }
    }
    emptyKeys.b = bEmpty.length;

    if (options.rowMatching === "key") {
      for (const [key, n] of Array.from(aSeen)) {
        if (n > 1) {
          duplicateKeys.a++;
          if (duplicateKeys.examples.length < 3) duplicateKeys.examples.push(key.split(SEPARATOR).join(" + "));
        }
      }
      for (const [key, list] of Array.from(bByKey)) {
        if (list.length > 1) {
          duplicateKeys.b++;
          const label = key.split(SEPARATOR).join(" + ");
          if (duplicateKeys.examples.length < 3 && !duplicateKeys.examples.includes(label)) duplicateKeys.examples.push(label);
        }
      }
      duplicateKeys.examples = duplicateKeys.examples.map((e) => e.replace(/\u0000n/g, ""));
    }
  }

  return { columns, compared, rows, counts, changedCells, duplicateKeys, emptyKeys };
}

/** The value of a column in a row of a result, from file 2, or file 1 for removed rows. */
export function rowValues(a: CompareTable, b: CompareTable, columns: CompareColumn[], row: CompareRow): string[] {
  return columns.map((col) => {
    if (row.b !== undefined && col.b >= 0) return b.rows[row.b][col.b] ?? "";
    if (row.a !== undefined && col.a >= 0) return a.rows[row.a][col.a] ?? "";
    return "";
  });
}

export const STATUS_LABELS: Record<RowStatus, string> = {
  same: "unchanged",
  changed: "changed",
  added: "added",
  removed: "removed",
};

/**
 * The differences report: one row per added, removed or changed row (unchanged rows
 * only when `includeSame`), with the status, row numbers in each file (1-based, counting
 * data rows), the names of the changed columns, then every column's value from file 2
 * (file 1 for removed rows).
 */
export function buildReportCSV(
  a: CompareTable,
  b: CompareTable,
  result: CompareResult,
  options: { delimiter: string; formulaSafe: boolean; includeSame: boolean; rows?: CompareRow[] }
): string {
  const header = ["change", "row_in_file_1", "row_in_file_2", "changed_columns", ...result.columns.map((c) => c.name)];
  const body: string[][] = [];
  for (const row of options.rows ?? result.rows) {
    if (row.status === "same" && !options.includeSame) continue;
    body.push([
      STATUS_LABELS[row.status],
      row.a !== undefined ? String(row.a + 1) : "",
      row.b !== undefined ? String(row.b + 1) : "",
      (row.changed ?? []).map((c) => result.columns[c].name).join("; "),
      ...rowValues(a, b, result.columns, row),
    ]);
  }
  return Papa.unparse(neutralizeFormulaCells([header, ...body], options.formulaSafe).rows, { delimiter: options.delimiter });
}

/** One row per changed cell: the key (or row numbers), the column, the old and the new value. */
export function buildCellChangesCSV(
  a: CompareTable,
  b: CompareTable,
  result: CompareResult,
  options: { delimiter: string; formulaSafe: boolean; keyColumns: number[] }
): string {
  const keyNames = options.keyColumns.map((c) => result.columns[c].name);
  const header = [...keyNames, "row_in_file_1", "row_in_file_2", "column", "value_in_file_1", "value_in_file_2"];
  const body: string[][] = [];
  for (const row of result.rows) {
    if (row.status !== "changed" || row.a === undefined || row.b === undefined) continue;
    const keys = options.keyColumns.map((c) => b.rows[row.b!][result.columns[c].b] ?? "");
    for (const c of row.changed ?? []) {
      const col = result.columns[c];
      body.push([...keys, String(row.a + 1), String(row.b + 1), col.name, a.rows[row.a][col.a] ?? "", b.rows[row.b][col.b] ?? ""]);
    }
  }
  return Papa.unparse(neutralizeFormulaCells([header, ...body], options.formulaSafe).rows, { delimiter: options.delimiter });
}
