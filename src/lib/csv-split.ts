import Papa from "papaparse";
import { neutralizeFormulaCells } from "./csv-utils";

/**
 * Logic for Split CSV: divide the data rows of a CSV into several files by a
 * row count, into a number of equal files, or by the value of one column.
 * The header row is optionally repeated at the top of every file.
 */

export type SplitMode =
  | { kind: "rows"; rowsPerFile: number }
  | { kind: "files"; fileCount: number }
  | { kind: "column"; column: number };

export interface SplitPart {
  /** File name, unique within the split, ending in .csv. */
  name: string;
  /** Data rows in this part (without the header). */
  rows: string[][];
  /** For column splits: the value shared by the rows. */
  value?: string;
}

/** The most files one split may create; more is rarely useful and slows the browser. */
export const MAX_PARTS = 1000;

export interface SplitResult {
  parts: SplitPart[];
  /** Set when the split cannot be made; no parts are returned. */
  error?: string;
}

/** A file-name-safe version of a column value (letters, digits, - and _ kept; max 60 characters). */
export function safeFileStem(value: string): string {
  const cleaned = value
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 60)
    .replace(/[-.]+$/, "");
  return cleaned === "" ? "empty" : cleaned;
}

function padNumber(n: number, total: number): string {
  return String(n).padStart(Math.max(3, String(total).length), "0");
}

/** Split data rows according to `mode`. `base` is the file name stem for the parts. */
export function splitRows(dataRows: string[][], mode: SplitMode, base: string): SplitResult {
  const stem = safeFileStem(base) || "data";

  if (dataRows.length === 0) return { parts: [], error: "The file has no data rows to split." };

  if (mode.kind === "rows" || mode.kind === "files") {
    // Part sizes: a fixed size, or as equal as possible (the first parts get one extra row).
    const sizes: number[] = [];
    if (mode.kind === "rows") {
      if (!Number.isInteger(mode.rowsPerFile) || mode.rowsPerFile < 1) {
        return { parts: [], error: "Enter a whole number of rows per file (1 or more)." };
      }
      const count = Math.ceil(dataRows.length / mode.rowsPerFile);
      if (count > MAX_PARTS) {
        return {
          parts: [],
          error: `That would create ${count.toLocaleString()} files. Choose a split that makes ${MAX_PARTS.toLocaleString()} files or fewer.`,
        };
      }
      for (let i = 0; i < count; i++) sizes.push(Math.min(mode.rowsPerFile, dataRows.length - i * mode.rowsPerFile));
    } else {
      if (!Number.isInteger(mode.fileCount) || mode.fileCount < 2) {
        return { parts: [], error: "Enter a whole number of files (2 or more)." };
      }
      if (mode.fileCount > MAX_PARTS) {
        return { parts: [], error: `Choose ${MAX_PARTS.toLocaleString()} files or fewer.` };
      }
      if (mode.fileCount > dataRows.length) {
        return {
          parts: [],
          error: `The file has ${dataRows.length.toLocaleString()} data row(s), so it can be split into at most ${dataRows.length.toLocaleString()} files.`,
        };
      }
      const base = Math.floor(dataRows.length / mode.fileCount);
      const extra = dataRows.length % mode.fileCount;
      for (let i = 0; i < mode.fileCount; i++) sizes.push(base + (i < extra ? 1 : 0));
    }
    const parts: SplitPart[] = [];
    let start = 0;
    sizes.forEach((size, i) => {
      parts.push({ name: `${stem}-part-${padNumber(i + 1, sizes.length)}.csv`, rows: dataRows.slice(start, start + size) });
      start += size;
    });
    return { parts };
  }

  // Split by column value, keeping the order in which values first appear.
  const groups = new Map<string, string[][]>();
  for (const row of dataRows) {
    const value = row[mode.column] ?? "";
    let group = groups.get(value);
    if (!group) {
      if (groups.size >= MAX_PARTS) {
        return {
          parts: [],
          error: `This column has more than ${MAX_PARTS.toLocaleString()} different values. Choose a column with fewer distinct values, or split by row count.`,
        };
      }
      group = [];
      groups.set(value, group);
    }
    group.push(row);
  }

  // Different values can map to the same file name ("A/B" and "A B", or "x" and "X"
  // on case-insensitive file systems), so names get a numeric suffix until unique.
  const used = new Set<string>();
  const parts: SplitPart[] = [];
  groups.forEach((rows, value) => {
    const valueStem = value.trim() === "" ? "empty" : safeFileStem(value);
    const wanted = `${stem}-${valueStem}`;
    let name = wanted;
    for (let n = 2; used.has(name.toLowerCase()); n++) name = `${wanted}-${n}`;
    used.add(name.toLowerCase());
    parts.push({ name: `${name}.csv`, rows, value });
  });
  return { parts };
}

/** CSV text for one part, with the header first when `header` is given. */
export function partToCSV(
  part: SplitPart,
  header: string[] | null,
  options: { delimiter: string; formulaSafe: boolean }
): { csvText: string; formulaCells: number } {
  const table = header ? [header, ...part.rows] : part.rows;
  const safety = neutralizeFormulaCells(table, options.formulaSafe);
  return { csvText: Papa.unparse(safety.rows, { delimiter: options.delimiter }), formulaCells: safety.count };
}
