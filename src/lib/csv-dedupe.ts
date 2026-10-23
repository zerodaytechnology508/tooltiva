/**
 * Logic for Remove Duplicate Rows: find rows that repeat, comparing either
 * whole rows or only the chosen key columns. Rows are never modified; the
 * result lists which rows to keep and which were removed, in file order.
 */

export interface DedupeOptions {
  /** Column indexes to compare, or "all" for the whole row. */
  columns: number[] | "all";
  /** Which row of a duplicate group survives. */
  keep: "first" | "last";
  /** Treat "Ann@Example.com" and "ann@example.com" as the same. */
  ignoreCase: boolean;
  /** Ignore spaces at the start and end of each value. */
  trimSpaces: boolean;
  /** Never remove rows whose compared values are all empty (e.g. no email given). */
  keepEmpty: boolean;
}

export interface DedupeResult {
  /** Indexes of rows kept, in their original order. */
  kept: number[];
  /** Indexes of rows removed as duplicates, in their original order. */
  removed: number[];
  /** Number of distinct values that occurred more than once. */
  duplicateGroups: number;
}

/** Joins compared values; a control character cannot be confused with cell content boundaries. */
const SEPARATOR = "\u0000\u001f";

export function findDuplicateRows(rows: string[][], options: DedupeOptions): DedupeResult {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const columns = options.columns === "all" ? Array.from({ length: width }, (_, c) => c) : options.columns;

  /** The comparison key, or null when every compared value is empty and empty rows are kept. */
  const keyOf = (row: string[]): string | null => {
    const parts: string[] = [];
    let empty = true;
    for (const c of columns) {
      let value = row[c] ?? "";
      if (options.trimSpaces) value = value.trim();
      if (options.ignoreCase) value = value.toLocaleLowerCase();
      if (value !== "") empty = false;
      parts.push(value);
    }
    return empty && options.keepEmpty ? null : parts.join(SEPARATOR);
  };

  const seen = new Map<string, number>(); // key -> times seen
  const keep = new Uint8Array(rows.length);
  const order =
    options.keep === "first"
      ? Array.from({ length: rows.length }, (_, i) => i)
      : Array.from({ length: rows.length }, (_, i) => rows.length - 1 - i);

  let duplicateGroups = 0;
  for (const i of order) {
    const key = keyOf(rows[i]);
    if (key === null) {
      keep[i] = 1;
      continue;
    }
    const count = seen.get(key) ?? 0;
    if (count === 0) keep[i] = 1;
    else if (count === 1) duplicateGroups++;
    seen.set(key, count + 1);
  }

  const kept: number[] = [];
  const removed: number[] = [];
  for (let i = 0; i < rows.length; i++) (keep[i] ? kept : removed).push(i);
  return { kept, removed, duplicateGroups };
}
