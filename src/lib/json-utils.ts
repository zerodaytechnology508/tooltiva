import Papa from "papaparse";
import type { JSONRepairLog, JSONValidationResult } from "./types";
import { detectDelimiter, formulaNotice, neutralizeFormulaCells, parseCSVRows } from "./csv-utils";
import { describeNode, formatJSON, parseJSONDocument, type JSONNode } from "./json-ast";

/**
 * Validate JSON text with exact error positions. Uses the shared lossless
 * parser, so the line/column, snippet and caret are the same in every browser
 * (JavaScript engines word their JSON.parse errors differently and some omit
 * the position entirely).
 */
export function validateJSON(text: string): JSONValidationResult {
  if (!text || text.trim() === "") {
    return {
      isValid: false,
      error: { message: "Input is empty. Please paste or upload JSON data." },
    };
  }
  const result = parseJSONDocument(text);
  if (result.ok) return { isValid: true };
  return {
    isValid: false,
    error: {
      message: result.message,
      line: result.line,
      column: result.column,
      snippet: result.snippet,
      pointer: result.pointer,
    },
  };
}

/**
 * Smart JSON repair engine
 * NEVER modifies silently: tracks and returns every single rule applied with counts
 */
export function repairJSON(rawText: string): { repaired: string; logs: JSONRepairLog[] } {
  const logs: JSONRepairLog[] = [];
  let working = rawText;

  // Remove comments and convert single-quoted strings in one lexical pass. Both
  // operations are deliberately limited to text outside double-quoted strings.
  let commentMatches = 0;
  let singleQuoteMatches = 0;
  let lexical = "";
  for (let i = 0; i < working.length;) {
    const char = working[i];

    if (char === '"') {
      const start = i++;
      while (i < working.length) {
        if (working[i] === "\\") i += 2;
        else if (working[i++] === '"') break;
      }
      lexical += working.slice(start, i);
      continue;
    }

    if (char === "/" && working[i + 1] === "/") {
      commentMatches++;
      i += 2;
      while (i < working.length && working[i] !== "\n" && working[i] !== "\r") i++;
      continue;
    }

    if (char === "/" && working[i + 1] === "*") {
      commentMatches++;
      i += 2;
      while (i < working.length && !(working[i] === "*" && working[i + 1] === "/")) i++;
      i = Math.min(working.length, i + 2);
      continue;
    }

    if (char === "'") {
      singleQuoteMatches++;
      lexical += '"';
      i++;
      while (i < working.length) {
        const current = working[i++];
        if (current === "'") {
          lexical += '"';
          break;
        }
        if (current === "\\" && i < working.length) {
          const escaped = working[i++];
          if (escaped === "'") lexical += "'";
          else if (escaped === '"') lexical += '\\"';
          else lexical += `\\${escaped}`;
        } else {
          lexical += current === '"' ? '\\"' : current;
        }
      }
      continue;
    }

    lexical += char;
    i++;
  }
  working = lexical;
  if (commentMatches > 0) {
    logs.push({
      id: "comment-stripped",
      rule: "comment-stripped",
      description: "Removed JavaScript comments (not permitted in strict RFC 8259 JSON)",
      count: commentMatches,
    });
  }

  // Mask string contents before applying syntax-only regular expressions so
  // keys and commas inside valid JSON values remain byte-for-byte unchanged.
  const maskStrings = (text: string): string => {
    let masked = "";
    for (let i = 0; i < text.length;) {
      if (text[i] !== '"') {
        masked += text[i++];
        continue;
      }
      masked += " ";
      i++;
      while (i < text.length) {
        const char = text[i++];
        masked += char === "\n" || char === "\r" ? char : " ";
        if (char === "\\" && i < text.length) {
          const escaped = text[i++];
          masked += escaped === "\n" || escaped === "\r" ? escaped : " ";
        } else if (char === '"') break;
      }
    }
    return masked;
  };

  let unquotedMatches = 0;
  const keyPattern = /([{,])(\s*)([A-Za-z_$][\w$-]*)(\s*):/gm;
  const maskedForKeys = maskStrings(working);
  const keyEdits: Array<{ start: number; end: number; replacement: string }> = [];
  let keyMatch: RegExpExecArray | null;
  while ((keyMatch = keyPattern.exec(maskedForKeys)) !== null) {
    const match = keyMatch;
    const start = match.index!;
    const keyStart = start + match[1].length + match[2].length;
    const keyEnd = keyStart + match[3].length;
    keyEdits.push({ start: keyStart, end: keyEnd, replacement: JSON.stringify(match[3]) });
    unquotedMatches++;
  }
  for (const edit of keyEdits.reverse()) {
    working = working.slice(0, edit.start) + edit.replacement + working.slice(edit.end);
  }
  if (unquotedMatches > 0) {
    logs.push({
      id: "unquoted-key",
      rule: "unquoted-key",
      description: "Wrapped unquoted object keys with double quotes",
      count: unquotedMatches,
    });
  }

  if (singleQuoteMatches > 0) {
    logs.push({
      id: "single-to-double-quotes",
      rule: "single-to-double-quotes",
      description: "Converted single-quoted strings to standard double quotes",
      count: singleQuoteMatches,
    });
  }

  // Remove commas directly before a closing container, ignoring string text.
  const trailingCommaRegex = /,(\s*[}\]])/g;
  let trailingCommaMatches = 0;
  const maskedForCommas = maskStrings(working);
  const commaEdits: number[] = [];
  let commaMatch: RegExpExecArray | null;
  while ((commaMatch = trailingCommaRegex.exec(maskedForCommas)) !== null) {
    const match = commaMatch;
    commaEdits.push(match.index!);
    trailingCommaMatches++;
  }
  for (const index of commaEdits.reverse()) working = working.slice(0, index) + working.slice(index + 1);
  if (trailingCommaMatches > 0) {
    logs.push({
      id: "trailing-comma",
      rule: "trailing-comma",
      description: "Removed trailing commas before closing brackets or braces",
      count: trailingCommaMatches,
    });
  }

  return { repaired: working, logs };
}

/**
 * Convert a CSV cell to a JSON number or boolean only when nothing about the
 * value can change: the JSON form must be spelled exactly like the cell.
 * - "42", "-7", "98.5", "0.25" become numbers
 * - "true" / "false" (lowercase) become booleans
 * - everything else stays text, including "00123", "1e5", "1.50", "+5", " 5",
 *   "TRUE", empty cells, and integers too large for JavaScript to hold exactly
 */
export function inferExactType(value: string): string | number | boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?(?:0|[1-9]\d*)$/.test(value)) {
    const n = Number(value);
    return Number.isSafeInteger(n) && value !== "-0" ? n : value;
  }
  if (/^-?(?:0|[1-9]\d*)\.\d+$/.test(value)) {
    const n = Number(value);
    return String(n) === value ? n : value;
  }
  return value;
}

/** Make header names unique the way PapaParse did ("a", "a_1", "a_2"), reporting each rename. */
function uniqueHeaders(headers: string[], warnings: string[]): string[] {
  const used = new Set<string>();
  const renamed: string[] = [];
  const result = headers.map((name) => {
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
    let n = 1;
    while (used.has(`${name}_${n}`)) n++;
    const unique = `${name}_${n}`;
    used.add(unique);
    renamed.push(`"${name}" → "${unique}"`);
    return unique;
  });
  if (renamed.length > 0) {
    warnings.push(
      `Duplicate column name(s) were renamed so every JSON key is unique: ${renamed.slice(0, 5).join(", ")}${
        renamed.length > 5 ? `, and ${renamed.length - 5} more` : ""
      }.`
    );
  }
  return result;
}

export interface CSVToJSONResult {
  jsonText: string;
  rowCount: number;
  warnings: string[];
  /** False when the CSV is malformed; `jsonText` is then empty and `warnings[0..]` explain why. */
  ok: boolean;
}

/** True when text pasted into CSV mode is a JSON array or object (a likely wrong-mode paste). */
function looksLikeJSON(text: string): boolean {
  const first = text.trimStart()[0];
  return (first === "[" || first === "{") && parseJSONDocument(text).ok;
}

/**
 * Convert CSV text to JSON.
 *
 * Values are kept as text by default. With `parseTypes`, only cells whose
 * number or boolean form is spelled exactly like the cell are converted (see
 * inferExactType). Empty cells stay "" and never become null.
 */
export function csvToJSON(
  csvText: string,
  options: {
    delimiter?: string;
    format: "array-of-objects" | "2d-array" | "keyed-object";
    keyColumn?: string;
    parseTypes: boolean;
    indent: number;
  }
): CSVToJSONResult {
  const warnings: string[] = [];
  if (!csvText || csvText.trim() === "") {
    return { jsonText: "[]", rowCount: 0, warnings: ["Input is empty"], ok: true };
  }

  const delimiter =
    options.delimiter && options.delimiter !== "auto" ? options.delimiter : detectDelimiter(csvText);
  const { rows, errors, skippedBlankLines, fatalError } = parseCSVRows(csvText, delimiter);
  const jsonHint = looksLikeJSON(csvText)
    ? "This input looks like JSON, not CSV. To convert JSON to CSV, switch the mode to JSON ➔ CSV."
    : null;
  if (fatalError) {
    // Malformed quoting makes the record boundaries unknowable; never return
    // records that could silently merge or split rows.
    return { jsonText: "", rowCount: 0, warnings: jsonHint ? [jsonHint, fatalError] : [fatalError], ok: false };
  }
  if (jsonHint) warnings.push(jsonHint);
  warnings.push(...errors.map((e) => `CSV ${e}`));
  if (skippedBlankLines > 0) warnings.push(`${skippedBlankLines} blank line(s) were ignored.`);

  const convert = options.parseTypes ? inferExactType : (value: string) => value;
  const space = options.indent === 0 ? undefined : options.indent;

  if (options.format === "2d-array") {
    const data = rows.map((row) => row.map(convert));
    return { jsonText: JSON.stringify(data, null, space), rowCount: rows.length, warnings, ok: true };
  }

  if (rows.length === 0) {
    return { jsonText: "[]", rowCount: 0, warnings: [...warnings, "No data rows found."], ok: true };
  }

  const headers = uniqueHeaders(rows[0], warnings);
  let shortRows = 0;
  let longRows = 0;
  const extraKeys: string[] = [];
  const keyFor = (index: number): string => {
    if (index < headers.length) return headers[index];
    // Values beyond the header get positional keys that cannot clash with a header.
    const taken = new Set(headers);
    let key = `column_${index + 1}`;
    while (taken.has(key)) key = `_${key}`;
    if (!extraKeys.includes(key)) extraKeys.push(key);
    return key;
  };

  const records = rows.slice(1).map((row) => {
    // A prototype-free object, so a column named "__proto__" is an ordinary key.
    const record: Record<string, string | number | boolean> = Object.create(null);
    if (row.length < headers.length) shortRows++;
    if (row.length > headers.length) longRows++;
    row.forEach((cell, index) => {
      record[keyFor(index)] = convert(cell);
    });
    return record;
  });

  if (shortRows > 0) {
    warnings.push(`${shortRows} row(s) have fewer fields than the header; their missing fields were left out.`);
  }
  if (longRows > 0) {
    warnings.push(
      `${longRows} row(s) have more fields than the header; extra values were kept under ${extraKeys
        .slice(0, 3)
        .join(", ")}${extraKeys.length > 3 ? ", ..." : ""}.`
    );
  }

  let finalData: unknown = records;
  if (options.format === "keyed-object" && options.keyColumn) {
    const keyedObj: Record<string, unknown> = Object.create(null);
    for (const item of records) {
      const keyVal = String(item[options.keyColumn] ?? "");
      if (keyVal) keyedObj[keyVal] = item;
    }
    finalData = keyedObj;
  }

  return { jsonText: JSON.stringify(finalData, null, space), rowCount: records.length, warnings, ok: true };
}

export interface JSONToCSVResult {
  csvText: string;
  rowCount: number;
  /** User-facing messages. When `ok` is false the first message explains why nothing was converted. */
  warnings: string[];
  /** False when the input could not be converted; `csvText` is then empty. */
  ok: boolean;
  /** False for arrays of arrays, which are written without a header row. */
  hasHeader: boolean;
}

type RowKind = "object" | "array" | "scalar";

function rowKind(node: JSONNode): RowKind {
  if (node.type === "array") return "array";
  if (node.type === "object") return "object";
  return "scalar";
}

interface CellStats {
  nulls: number;
  missing: number;
  nested: number;
}

/**
 * Convert one JSON value into CSV cell text without losing information:
 * - strings are written as their decoded text
 * - numbers are written exactly as in the input (9007199254740993, 1.0, 1e5 and
 *   -0 keep their spelling and precision)
 * - booleans become true / false
 * - null becomes an empty cell (counted, so the user is told)
 * - nested objects and arrays become compact JSON text (counted)
 */
function toCell(node: JSONNode, stats: CellStats): string {
  switch (node.type) {
    case "string":
      return node.value;
    case "number":
      return node.raw;
    case "boolean":
      return node.value ? "true" : "false";
    case "null":
      stats.nulls++;
      return "";
    default:
      stats.nested++;
      return formatJSON(node, 0);
  }
}

function failure(message: string): JSONToCSVResult {
  return { csvText: "", rowCount: 0, warnings: [message], ok: false, hasHeader: true };
}

/**
 * Turn object rows into a key -> value map per row. If a row repeats a key,
 * the last value wins (the way JSON.parse and most programs read it); the
 * caller reports this because the earlier value is not in the CSV.
 */
function recordMaps(rows: JSONNode[]): Map<string, JSONNode>[] {
  return rows.map((row) => {
    const map = new Map<string, JSONNode>();
    if (row.type === "object") for (const entry of row.entries) map.set(entry.key, entry.value);
    return map;
  });
}

/** Column names across every row, in order of first appearance. */
function unionKeys(rows: JSONNode[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.type === "object") for (const entry of row.entries) seen.add(entry.key);
  }
  return Array.from(seen);
}

/** Pick a dictionary-key column name that no record already uses. */
function pickKeyColumn(columns: string[]): string {
  const taken = new Set(columns);
  for (const candidate of ["_id", "_key"]) {
    if (!taken.has(candidate)) return candidate;
  }
  let n = 2;
  while (taken.has(`_key_${n}`)) n++;
  return `_key_${n}`;
}

function cellsFor(columns: string[], record: Map<string, JSONNode>, stats: CellStats): string[] {
  return columns.map((key) => {
    const value = record.get(key);
    if (value === undefined) {
      stats.missing++;
      return "";
    }
    return toCell(value, stats);
  });
}

/**
 * Convert JSON text to CSV structure.
 *
 * Accepted shapes (each row must be the same kind):
 * - Array of objects: columns are the union of keys across all rows, in
 *   first-seen order. A key missing from a row becomes an empty cell.
 * - Array of arrays: each inner array is written as one CSV row (no header).
 * - Array of single values: written as one column named "value".
 * - Object dictionary of objects: one row per entry, with the entry key in an
 *   "_id" column (renamed if a record already has an "_id" field).
 * - Object dictionary of single values or arrays: "key" and "value" columns.
 *
 * The input is read with the lossless parser, so numbers keep their exact
 * digits. null values become empty cells, nested objects/arrays become JSON
 * text and duplicate keys keep their last value; each is reported in
 * `warnings` so the conversion is never silent. Arrays or dictionaries that
 * mix rows of different kinds are rejected with a message naming the first
 * mismatching item. With `formulaSafe`, formula-like cells are prefixed with
 * an apostrophe for spreadsheet apps (see csv-utils isFormulaRisk).
 */
export function jsonToCSV(
  jsonText: string,
  options: {
    delimiter: string;
    quotes: boolean;
    formulaSafe?: boolean;
  }
): JSONToCSVResult {
  if (!jsonText || jsonText.trim() === "") {
    return failure("Input is empty");
  }

  const parsed = parseJSONDocument(jsonText);
  if (!parsed.ok) {
    return failure(`Invalid JSON: ${parsed.message} (line ${parsed.line}, column ${parsed.column})`);
  }
  const root = parsed.root;

  const stats: CellStats = { nulls: 0, missing: 0, nested: 0 };
  const notices: string[] = [];
  let header: string[] | null = null;
  let data: string[][];

  if (root.type === "array") {
    const items = root.items;
    if (items.length === 0) {
      return failure("The JSON array is empty, so there are no rows to convert.");
    }

    const firstKind = rowKind(items[0]);
    const mismatch = items.findIndex((item) => rowKind(item) !== firstKind);
    if (mismatch !== -1) {
      return failure(
        `Cannot convert a JSON array that mixes row types: item 1 is ${describeNode(items[0])}, ` +
          `but item ${mismatch + 1} is ${describeNode(items[mismatch])}. ` +
          `Use an array where every item is an object, every item is an array, or every item is a single value.`
      );
    }

    if (firstKind === "object") {
      header = unionKeys(items);
      if (header.length === 0) {
        return failure("The JSON objects have no properties, so there are no columns to convert.");
      }
      const columns = header;
      data = recordMaps(items).map((record) => cellsFor(columns, record, stats));
    } else if (firstKind === "array") {
      const arrays = items as Extract<JSONNode, { type: "array" }>[];
      if (arrays.every((row) => row.items.length === 0)) {
        return failure("The inner JSON arrays are all empty, so there are no values to convert.");
      }
      data = arrays.map((row) => row.items.map((cell) => toCell(cell, stats)));
      notices.push("Each inner array was written as one CSV row; no header row was added.");
    } else {
      header = ["value"];
      data = items.map((item) => [toCell(item, stats)]);
    }
  } else if (root.type === "object") {
    const entries = root.entries;
    if (entries.length === 0) {
      return failure("The JSON object is empty, so there are no rows to convert.");
    }

    const recordEntries = entries.filter((entry) => entry.value.type === "object");
    if (recordEntries.length > 0 && recordEntries.length < entries.length) {
      const other = entries.find((entry) => entry.value.type !== "object")!;
      return failure(
        `Cannot convert a JSON object that mixes record and non-record values: ` +
          `"${recordEntries[0].key}" is an object, but "${other.key}" is ${describeNode(other.value)}. ` +
          `Use an object whose values are all objects, or all single values.`
      );
    }

    if (recordEntries.length > 0) {
      const records = entries.map((entry) => entry.value);
      const recordFields = unionKeys(records);
      const keyColumn = pickKeyColumn(recordFields);
      if (keyColumn !== "_id") {
        notices.push(
          `The records already contain an "_id" field, so the dictionary keys were written to a "${keyColumn}" column.`
        );
      }
      header = [keyColumn, ...recordFields];
      const maps = recordMaps(records);
      data = entries.map((entry, i) => [entry.key, ...cellsFor(recordFields, maps[i], stats)]);
    } else {
      header = ["key", "value"];
      data = entries.map((entry) => [entry.key, toCell(entry.value, stats)]);
    }
  } else {
    return failure(
      `JSON must be an array or an object dictionary to convert to CSV, but the input is ${describeNode(root)}.`
    );
  }

  if (parsed.duplicateKeyCount > 0) {
    const examples = parsed.duplicateKeys
      .slice(0, 3)
      .map((d) => `"${d.key}" in ${d.path} (line ${d.line})`)
      .join(", ");
    notices.push(
      `${parsed.duplicateKeyCount} duplicate key(s) found, e.g. ${examples}. A CSV cell can hold one value, so the last value of each duplicate key was used.`
    );
  }
  if (stats.missing > 0) {
    notices.push(`${stats.missing} cell(s) are empty because some rows do not have every column.`);
  }
  if (stats.nulls > 0) {
    notices.push(`${stats.nulls} null value(s) were written as empty cells.`);
  }
  if (stats.nested > 0) {
    notices.push(
      `${stats.nested} nested object or array value(s) were written as JSON text inside a single cell.`
    );
  }

  const table = header ? [header, ...data] : data;
  const safety = neutralizeFormulaCells(table, options.formulaSafe === true);
  const formula = formulaNotice(safety.count, options.formulaSafe === true);
  if (formula) notices.push(formula);

  const csv = Papa.unparse(safety.rows, { delimiter: options.delimiter, quotes: options.quotes });

  return {
    csvText: csv,
    rowCount: data.length,
    warnings: notices,
    ok: true,
    hasHeader: header !== null,
  };
}
