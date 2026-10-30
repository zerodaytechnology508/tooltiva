/**
 * Turn JSON into Excel sheets. Accepts an array of objects (one row each), an
 * array of arrays, an array of single values, one object, a dictionary of
 * objects, or an object whose values are arrays (one sheet per key, which is
 * what Tooltiva's Excel to JSON produces for a whole workbook). Numbers keep
 * their exact digits, nested objects can be flattened into dot-named columns.
 */
import { parseJSONDocument, type JSONNode } from "./json-ast";
import { isoToSerial } from "./csv-to-xlsx";
import type { WriteCell } from "./xlsx-write";

export interface JSONToExcelOptions {
  /** Nested objects become columns such as address.city; otherwise they are written as JSON text. */
  flatten: boolean;
  /** ISO date strings (2024-01-31, 2024-01-31 14:05) become Excel dates. */
  dates: boolean;
}

export interface JSONSheet {
  name: string;
  rows: WriteCell[][];
  header: boolean;
}

export type JSONToExcelResult =
  | { ok: true; sheets: JSONSheet[]; notes: string[] }
  | { ok: false; error: string };

type Counters = { nested: number; bigNumbers: number; dates: number };

function compact(node: JSONNode): string {
  switch (node.type) {
    case "object":
      return `{${node.entries.map((e) => `${JSON.stringify(e.key)}:${compact(e.value)}`).join(",")}}`;
    case "array":
      return `[${node.items.map(compact).join(",")}]`;
    case "string":
      return JSON.stringify(node.value);
    case "number":
      return node.raw;
    case "boolean":
      return node.value ? "true" : "false";
    case "null":
      return "null";
  }
}

function cellFor(node: JSONNode, options: JSONToExcelOptions, n: Counters): WriteCell {
  switch (node.type) {
    case "null":
      return null;
    case "boolean":
      return node.value;
    case "string": {
      if (options.dates) {
        const d = isoToSerial(node.value);
        if (d) {
          n.dates++;
          return { value: d.serial, format: !d.time ? "yyyy-mm-dd" : d.seconds ? "yyyy-mm-dd hh:mm:ss" : "yyyy-mm-dd hh:mm" };
        }
      }
      return node.value;
    }
    case "number": {
      const value = Number(node.raw);
      const digits = node.raw.replace(/^-/, "").replace(/[eE].*$/, "").replace(".", "").replace(/^0+/, "");
      // More than 15 significant digits cannot be stored exactly in Excel: keep the digits as text.
      if (!Number.isFinite(value) || digits.length > 15) {
        n.bigNumbers++;
        return node.raw;
      }
      // Large whole numbers would show as 1.23E+11 in General format.
      if (Number.isInteger(value) && Math.abs(value) >= 1e11) return { value, format: "0" };
      return value;
    }
    default:
      n.nested++;
      return compact(node);
  }
}

/** Flatten an object into [column, value] pairs: { a: { b: 1 } } → [["a.b", 1]]. */
function flattenEntries(node: Extract<JSONNode, { type: "object" }>, options: JSONToExcelOptions, prefix = ""): [string, JSONNode][] {
  const out: [string, JSONNode][] = [];
  for (const entry of node.entries) {
    const key = prefix ? `${prefix}.${entry.key}` : entry.key;
    if (options.flatten && entry.value.type === "object" && entry.value.entries.length > 0) out.push(...flattenEntries(entry.value, options, key));
    else out.push([key, entry.value]);
  }
  return out;
}

function objectsToSheet(name: string, items: JSONNode[], options: JSONToExcelOptions, n: Counters, keyColumn?: { label: string; keys: string[] }): JSONSheet {
  const columns: string[] = [];
  const index = new Map<string, number>();
  const records = items.map((item) => {
    const map = new Map<string, JSONNode>();
    if (item.type === "object") for (const [k, v] of flattenEntries(item, options)) map.set(k, v);
    map.forEach((_, k) => {
      if (!index.has(k)) {
        index.set(k, columns.length);
        columns.push(k);
      }
    });
    return map;
  });
  let keyLabel = keyColumn?.label;
  if (keyLabel) while (index.has(keyLabel)) keyLabel = `_${keyLabel}`;
  const header: WriteCell[] = keyLabel ? [keyLabel, ...columns] : [...columns];
  const rows: WriteCell[][] = [header];
  records.forEach((record, i) => {
    const row: WriteCell[] = columns.map((c) => {
      const v = record.get(c);
      return v === undefined ? null : cellFor(v, options, n);
    });
    rows.push(keyLabel ? [keyColumn!.keys[i], ...row] : row);
  });
  return { name, rows, header: true };
}

function arrayToSheet(name: string, node: Extract<JSONNode, { type: "array" }>, options: JSONToExcelOptions, n: Counters): JSONSheet | string {
  const items = node.items;
  if (items.length === 0) return { name, rows: [], header: false };
  if (items.every((i) => i.type === "object")) return objectsToSheet(name, items, options, n);
  if (items.every((i) => i.type === "array")) {
    const rows = (items as Extract<JSONNode, { type: "array" }>[]).map((row) => row.items.map((cell) => cellFor(cell, options, n)));
    return { name, rows, header: false };
  }
  if (items.every((i) => i.type !== "object" && i.type !== "array")) {
    return { name, rows: [["value"], ...items.map((i) => [cellFor(i, options, n)])], header: true };
  }
  const first = items[0].type;
  const bad = items.findIndex((i) => i.type !== first);
  return `The array mixes kinds of items: item 1 is ${kindName(items[0])} but item ${bad + 1} is ${kindName(items[bad])}. Use an array where every item is an object (one row each), or every item is an array.`;
}

function kindName(node: JSONNode): string {
  return node.type === "object" ? "an object" : node.type === "array" ? "an array" : `a ${node.type}`;
}

/** Convert JSON text to one or more sheets. */
export function jsonToSheets(text: string, options: JSONToExcelOptions): JSONToExcelResult {
  if (text.trim() === "") return { ok: false, error: "Paste JSON or open a .json file first." };
  const parsed = parseJSONDocument(text);
  if (!parsed.ok) return { ok: false, error: `This is not valid JSON: ${parsed.message} (line ${parsed.line}, column ${parsed.column}).` };
  const root = parsed.root;
  const n: Counters = { nested: 0, bigNumbers: 0, dates: 0 };
  let sheets: JSONSheet[];

  if (root.type === "array") {
    const sheet = arrayToSheet("Sheet1", root, options, n);
    if (typeof sheet === "string") return { ok: false, error: sheet };
    sheets = [sheet];
  } else if (root.type === "object") {
    const values = root.entries.map((e) => e.value);
    if (root.entries.length > 0 && values.every((v) => v.type === "array")) {
      // { "Customers": [...], "Orders": [...] }: one sheet per key.
      sheets = [];
      for (const entry of root.entries) {
        const sheet = arrayToSheet(entry.key, entry.value as Extract<JSONNode, { type: "array" }>, options, n);
        if (typeof sheet === "string") return { ok: false, error: `In "${entry.key}": ${sheet}` };
        sheets.push(sheet);
      }
    } else if (root.entries.length > 0 && values.every((v) => v.type === "object")) {
      // A dictionary of records: { "u1": {...}, "u2": {...} } → one row each, with the key in the first column.
      sheets = [objectsToSheet("Sheet1", values, options, n, { label: "key", keys: root.entries.map((e) => e.key) })];
    } else {
      // A single record.
      sheets = [objectsToSheet("Sheet1", [root], options, n)];
    }
  } else {
    return { ok: false, error: "The JSON is a single value. Use an array or an object to make a table." };
  }

  if (sheets.every((s) => s.rows.length === 0)) return { ok: false, error: "The JSON has no rows to convert: the arrays are empty." };
  const notes: string[] = [];
  if (n.nested > 0) {
    notes.push(
      `${n.nested.toLocaleString()} ${n.nested === 1 ? "value is" : "values are"} a list or nested object and ${n.nested === 1 ? "is" : "are"} written as JSON text in ${n.nested === 1 ? "its cell" : "their cells"}.`
    );
  }
  if (n.bigNumbers > 0) {
    notes.push(
      `${n.bigNumbers.toLocaleString()} ${n.bigNumbers === 1 ? "number has" : "numbers have"} more than 15 significant digits, more than Excel can store exactly, so ${n.bigNumbers === 1 ? "it is" : "they are"} written as text with every digit kept.`
    );
  }
  if (n.dates > 0) notes.push(`${n.dates.toLocaleString()} ISO ${n.dates === 1 ? "date was" : "dates were"} written as Excel ${n.dates === 1 ? "date" : "dates"}.`);
  return { ok: true, sheets, notes };
}
