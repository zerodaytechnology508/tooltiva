import Papa from "papaparse";
import type { JSONRepairLog, JSONValidationResult } from "./types";

/**
 * Validate JSON string and extract detailed line/column error information
 */
export function validateJSON(text: string): JSONValidationResult {
  if (!text || text.trim() === "") {
    return {
      isValid: false,
      error: { message: "Input is empty. Please paste or upload JSON data." },
    };
  }

  try {
    JSON.parse(text);
    return { isValid: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Attempt to extract position from V8 / standard error messages
    let line: number | undefined;
    let column: number | undefined;
    let snippet: string | undefined;

    const posMatch = errorMsg.match(/position\s+(\d+)/i);
    const unexpectedTokenMatch = errorMsg.match(/unexpected token ['\"](.?)['\"]/i);
    const pos = posMatch?.[1]
      ? parseInt(posMatch[1], 10)
      : unexpectedTokenMatch?.[1]
      ? text.indexOf(unexpectedTokenMatch[1])
      : -1;
    if (pos >= 0) {
      const textUpToPos = text.substring(0, pos);
      const lines = textUpToPos.split(/\r\n|\n|\r/);
      line = lines.length;
      column = lines[lines.length - 1].length + 1;

      const allLines = text.split(/\r\n|\n|\r/);
      const errLine = allLines[line - 1] || "";
      snippet = errLine.trim();
    } else {
      const lineMatch = errorMsg.match(/line (\d+) column (\d+)/i);
      if (lineMatch) {
        line = parseInt(lineMatch[1], 10);
        column = parseInt(lineMatch[2], 10);
        const allLines = text.split(/\r\n|\n|\r/);
        snippet = (allLines[line - 1] || "").trim();
      }
    }

    return {
      isValid: false,
      error: {
        message: errorMsg,
        line,
        column,
        snippet,
      },
    };
  }
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
 * Convert CSV text to JSON structure
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
): { jsonText: string; rowCount: number; warnings: string[] } {
  const warnings: string[] = [];
  if (!csvText || csvText.trim() === "") {
    return { jsonText: "[]", rowCount: 0, warnings: ["Input is empty"] };
  }

  const parsed = Papa.parse(csvText, {
    delimiter: options.delimiter && options.delimiter !== "auto" ? options.delimiter : undefined,
    header: options.format !== "2d-array",
    dynamicTyping: options.parseTypes,
    skipEmptyLines: true,
  });

  if (parsed.errors && parsed.errors.length > 0) {
    parsed.errors.slice(0, 3).forEach((err) => {
      warnings.push(`CSV Row ${err.row !== undefined ? err.row + 1 : "?"}: ${err.message}`);
    });
  }

  let finalData: unknown = parsed.data;

  if (options.format === "keyed-object" && options.keyColumn && Array.isArray(parsed.data)) {
    const keyedObj: Record<string, unknown> = {};
    for (const item of parsed.data as Record<string, unknown>[]) {
      const keyVal = String(item[options.keyColumn] ?? "");
      if (keyVal) {
        keyedObj[keyVal] = item;
      }
    }
    finalData = keyedObj;
  }

  const jsonText = JSON.stringify(finalData, null, options.indent === 0 ? undefined : options.indent);
  return {
    jsonText,
    rowCount: Array.isArray(parsed.data) ? parsed.data.length : Object.keys(finalData as object).length,
    warnings,
  };
}

export interface JSONToCSVResult {
  csvText: string;
  rowCount: number;
  /** User-facing messages. When `ok` is false the first message explains why nothing was converted. */
  warnings: string[];
  /** False when the input could not be converted; `csvText` is then empty. */
  ok: boolean;
}

type RowKind = "object" | "array" | "scalar";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rowKind(value: unknown): RowKind {
  if (Array.isArray(value)) return "array";
  if (isPlainObject(value)) return "object";
  return "scalar";
}

function describeValue(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  if (typeof value === "object") return "an object";
  return `a ${typeof value}`;
}

interface CellStats {
  nulls: number;
  missing: number;
  nested: number;
}

/**
 * Convert one JSON value into CSV cell text without losing information:
 * - strings are written as-is; numbers and booleans use their JSON text
 * - null becomes an empty cell (counted, so the user is told)
 * - nested objects and arrays are written as compact JSON text (counted)
 */
function toCell(value: unknown, stats: CellStats): string {
  if (value === null) {
    stats.nulls++;
    return "";
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    stats.nested++;
    return JSON.stringify(value);
  }
  // JSON.parse cannot produce other types; keep a defensive fallback.
  return String(value);
}

function failure(message: string): JSONToCSVResult {
  return { csvText: "", rowCount: 0, warnings: [message], ok: false };
}

/**
 * Collect column names across every object row, in first-seen order.
 * Uses a Set of own enumerable keys, so keys such as "__proto__" are treated
 * as ordinary column names.
 */
function unionKeys(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) seen.add(key);
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
 * null values become empty cells and nested objects/arrays become JSON text;
 * both are reported in `warnings` so the conversion is never silent.
 * Arrays or dictionaries that mix rows of different kinds are rejected with a
 * message naming the first mismatching item.
 */
export function jsonToCSV(
  jsonText: string,
  options: {
    delimiter: string;
    quotes: boolean;
  }
): JSONToCSVResult {
  if (!jsonText || jsonText.trim() === "") {
    return failure("Input is empty");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return failure(`Invalid JSON: ${errorMsg}`);
  }

  const stats: CellStats = { nulls: 0, missing: 0, nested: 0 };
  const notices: string[] = [];
  let fields: string[] | null = null;
  let data: string[][];

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return failure("The JSON array is empty, so there are no rows to convert.");
    }

    const firstKind = rowKind(parsed[0]);
    const mismatch = parsed.findIndex((item) => rowKind(item) !== firstKind);
    if (mismatch !== -1) {
      return failure(
        `Cannot convert a JSON array that mixes row types: item 1 is ${describeValue(parsed[0])}, ` +
          `but item ${mismatch + 1} is ${describeValue(parsed[mismatch])}. ` +
          `Use an array where every item is an object, every item is an array, or every item is a single value.`
      );
    }

    if (firstKind === "object") {
      const rows = parsed as Record<string, unknown>[];
      fields = unionKeys(rows);
      if (fields.length === 0) {
        return failure("The JSON objects have no properties, so there are no columns to convert.");
      }
      const columns = fields;
      data = rows.map((row) =>
        columns.map((key) => {
          if (!Object.prototype.hasOwnProperty.call(row, key)) {
            stats.missing++;
            return "";
          }
          return toCell(row[key], stats);
        })
      );
    } else if (firstKind === "array") {
      if ((parsed as unknown[][]).every((row) => row.length === 0)) {
        return failure("The inner JSON arrays are all empty, so there are no values to convert.");
      }
      data =(parsed as unknown[][]).map((row) => row.map((cell) => toCell(cell, stats)));
      notices.push("Each inner array was written as one CSV row; no header row was added.");
    } else {
      fields = ["value"];
      data = parsed.map((item) => [toCell(item, stats)]);
    }
  } else if (isPlainObject(parsed)) {
    const entries = Object.entries(parsed);
    if (entries.length === 0) {
      return failure("The JSON object is empty, so there are no rows to convert.");
    }

    const recordEntries = entries.filter(([, value]) => isPlainObject(value));
    if (recordEntries.length > 0 && recordEntries.length < entries.length) {
      const firstObjectKey = recordEntries[0][0];
      const [otherKey, otherValue] = entries.find(([, value]) => !isPlainObject(value))!;
      return failure(
        `Cannot convert a JSON object that mixes record and non-record values: ` +
          `"${firstObjectKey}" is an object, but "${otherKey}" is ${describeValue(otherValue)}. ` +
          `Use an object whose values are all objects, or all single values.`
      );
    }

    if (recordEntries.length > 0) {
      const records = entries.map(([, value]) => value as Record<string, unknown>);
      const recordFields = unionKeys(records);
      const keyColumn = pickKeyColumn(recordFields);
      if (keyColumn !== "_id") {
        notices.push(
          `The records already contain an "_id" field, so the dictionary keys were written to a "${keyColumn}" column.`
        );
      }
      fields = [keyColumn, ...recordFields];
      data = entries.map(([entryKey, value]) => {
        const record = value as Record<string, unknown>;
        return [
          entryKey,
          ...recordFields.map((key) => {
            if (!Object.prototype.hasOwnProperty.call(record, key)) {
              stats.missing++;
              return "";
            }
            return toCell(record[key], stats);
          }),
        ];
      });
    } else {
      fields = ["key", "value"];
      data = entries.map(([entryKey, value]) => [entryKey, toCell(value, stats)]);
    }
  } else {
    return failure(
      `JSON must be an array or an object dictionary to convert to CSV, but the input is ${describeValue(parsed)}.`
    );
  }

  if (stats.missing > 0) {
    notices.push(
      `${stats.missing} cell(s) are empty because some rows do not have every column.`
    );
  }
  if (stats.nulls > 0) {
    notices.push(`${stats.nulls} null value(s) were written as empty cells.`);
  }
  if (stats.nested > 0) {
    notices.push(
      `${stats.nested} nested object or array value(s) were written as JSON text inside a single cell.`
    );
  }

  const csv = fields
    ? Papa.unparse({ fields, data }, { delimiter: options.delimiter, quotes: options.quotes })
    : Papa.unparse(data, { delimiter: options.delimiter, quotes: options.quotes });

  return {
    csvText: csv,
    rowCount: data.length,
    warnings: notices,
    ok: true,
  };
}
