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

/**
 * Convert JSON text to CSV structure
 */
export function jsonToCSV(
  jsonText: string,
  options: {
    delimiter: string;
    quotes: boolean;
  }
): { csvText: string; rowCount: number; warnings: string[] } {
  const warnings: string[] = [];
  if (!jsonText || jsonText.trim() === "") {
    return { csvText: "", rowCount: 0, warnings: ["Input is empty"] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { csvText: "", rowCount: 0, warnings: [`Invalid JSON: ${errorMsg}`] };
  }

  let dataArray: unknown[] = [];

  if (Array.isArray(parsed)) {
    dataArray = parsed;
  } else if (typeof parsed === "object" && parsed !== null) {
    // If it's a keyed object, flatten into array of objects with key
    dataArray = Object.entries(parsed).map(([key, val]) => {
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        return { _id: key, ...val };
      }
      return { key, value: val };
    });
  } else {
    return { csvText: "", rowCount: 0, warnings: ["JSON must be an array of objects or an object dictionary to convert to CSV."] };
  }

  const csv = Papa.unparse(dataArray as Papa.UnparseObject<unknown> | unknown[], {
    delimiter: options.delimiter,
    quotes: options.quotes,
  });

  return {
    csvText: csv,
    rowCount: dataArray.length,
    warnings,
  };
}
