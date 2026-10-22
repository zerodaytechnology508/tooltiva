/**
 * Lossless JSON reader for the Tooltiva JSON tools.
 *
 * JSON.parse is fine for validation, but it silently changes data that people
 * paste into a formatter or converter:
 * - integers beyond 2^53 are rounded (9007199254740993 -> 9007199254740992)
 * - number spelling is normalised (1.0 -> 1, 1e5 -> 100000, -0 -> 0)
 * - duplicate object keys collapse to the last value without any report
 *
 * This module parses RFC 8259 JSON into a small tree that keeps the exact
 * source text of every number and string, records duplicate keys, and reports
 * syntax errors with an exact line, column and caret. It has no dependencies
 * and deliberately supports only strict JSON (the separate repair step handles
 * comments, single quotes, unquoted keys and trailing commas).
 */

export type JSONNode =
  | { type: "object"; entries: JSONEntry[] }
  | { type: "array"; items: JSONNode[] }
  | { type: "string"; raw: string; value: string }
  | { type: "number"; raw: string }
  | { type: "boolean"; value: boolean }
  | { type: "null" };

export interface JSONEntry {
  /** Decoded property name. */
  key: string;
  /** Property name exactly as written, including quotes and escapes. */
  rawKey: string;
  value: JSONNode;
}

export interface JSONDuplicateKey {
  /** Path of the object containing the duplicate, e.g. `$.users[2]`. */
  path: string;
  key: string;
  line: number;
  column: number;
}

export interface JSONUnsafeInteger {
  path: string;
  raw: string;
}

export interface JSONParseSuccess {
  ok: true;
  root: JSONNode;
  /** Up to 50 duplicate keys, in document order. */
  duplicateKeys: JSONDuplicateKey[];
  /** Total number of duplicate keys (may exceed the reported list). */
  duplicateKeyCount: number;
  /** Up to 50 integers that JavaScript numbers cannot represent exactly. */
  unsafeIntegers: JSONUnsafeInteger[];
  /** Total number of such integers (may exceed the reported list). */
  unsafeIntegerCount: number;
}

export interface JSONParseFailure {
  ok: false;
  message: string;
  offset: number;
  line: number;
  column: number;
  /** The source line containing the error (shortened around the error if long). */
  snippet: string;
  /** Spaces followed by a caret under the error position within `snippet`. */
  pointer: string;
}

export type JSONParseResult = JSONParseSuccess | JSONParseFailure;

/** Deeper nesting is rejected with a clear message instead of overflowing the call stack. */
export const MAX_JSON_DEPTH = 1000;

/** At most this many duplicate keys / unsafe integers are collected (counts stay exact). */
const MAX_REPORTED = 50;

class SyntaxFailure {
  message: string;
  offset: number;
  constructor(message: string, offset: number) {
    this.message = message;
    this.offset = offset;
  }
}

const SIMPLE_KEY = /^[A-Za-z_$][\w$]*$/;
const HEX = /^[0-9a-fA-F]{4}$/;

function describeChar(text: string, offset: number): string {
  if (offset >= text.length) return "end of input";
  const ch = text[offset];
  if (ch === "\n" || ch === "\r") return "line break";
  if (ch === "\t") return "tab character";
  return `'${ch}'`;
}

export function pathSegment(key: string | number): string {
  if (typeof key === "number") return `[${key}]`;
  return SIMPLE_KEY.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
}

class Parser {
  pos = 0;
  readonly duplicates: { path: string; key: string; offset: number }[] = [];
  duplicateCount = 0;
  readonly unsafe: JSONUnsafeInteger[] = [];
  unsafeCount = 0;
  /** Keys/indexes from the root to the current value; formatted only when reported. */
  private readonly path: (string | number)[] = [];
  private readonly text: string;

  constructor(text: string) {
    this.text = text;
  }

  currentPath(): string {
    let out = "$";
    for (const part of this.path) out += pathSegment(part);
    return out;
  }

  fail(message: string, offset = this.pos): never {
    throw new SyntaxFailure(message, offset);
  }

  skipWhitespace() {
    const text = this.text;
    while (this.pos < text.length) {
      const c = text.charCodeAt(this.pos);
      if (c === 0x20 || c === 0x0a || c === 0x0d || c === 0x09) this.pos++;
      else break;
    }
  }

  parseValue(depth: number): JSONNode {
    if (depth >= MAX_JSON_DEPTH) {
      this.fail(`Nesting is deeper than ${MAX_JSON_DEPTH} levels, which this tool does not support.`);
    }
    this.skipWhitespace();
    const text = this.text;
    if (this.pos >= text.length) this.fail("Unexpected end of input: a value was expected.");
    const ch = text[this.pos];
    switch (ch) {
      case "{":
        return this.parseObject(depth);
      case "[":
        return this.parseArray(depth);
      case '"':
        return this.parseString();
      case "t":
        return this.parseLiteral("true", { type: "boolean", value: true });
      case "f":
        return this.parseLiteral("false", { type: "boolean", value: false });
      case "n":
        return this.parseLiteral("null", { type: "null" });
      default:
        if (ch === "-" || (ch >= "0" && ch <= "9")) return this.parseNumber();
        return this.unexpectedValue();
    }
  }

  unexpectedValue(): never {
    const ch = this.text[this.pos];
    if (ch === "'") this.fail("Strings must use double quotes (\"), not single quotes.");
    if (ch === "}" || ch === "]") this.fail(`Unexpected '${ch}': a value was expected.`);
    if (ch === ",") this.fail("Unexpected ',': a value was expected (is there an extra comma?).");
    if (ch === "+" || ch === ".") this.fail(`Invalid number: JSON numbers cannot start with '${ch}'.`);
    if (/[A-Za-z_$]/.test(ch)) {
      const found = /^[A-Za-z_$][\w$]*/.exec(this.text.slice(this.pos, this.pos + 64))?.[0] ?? ch;
      if (found === "NaN" || found === "Infinity" || found === "undefined") {
        this.fail(`'${found}' is not allowed in JSON.`);
      }
      this.fail(`Unexpected '${found}': text values must be wrapped in double quotes.`);
    }
    this.fail(`Unexpected ${describeChar(this.text, this.pos)}: a value was expected.`);
  }

  parseLiteral(word: string, node: JSONNode): JSONNode {
    if (this.text.startsWith(word, this.pos)) {
      this.pos += word.length;
      return node;
    }
    return this.unexpectedValue();
  }

  parseNumber(): JSONNode {
    const text = this.text;
    const start = this.pos;
    const isDigit = (index: number) => {
      const c = text.charCodeAt(index);
      return c >= 0x30 && c <= 0x39;
    };
    let i = start;
    if (text[i] === "-") i++;
    if (!isDigit(i)) this.fail("Invalid number: a digit was expected.", i);
    if (text[i] === "0") {
      i++;
      if (isDigit(i)) this.fail("Invalid number: JSON numbers cannot have leading zeros.", start);
    } else {
      while (isDigit(i)) i++;
    }
    if (text[i] === ".") {
      i++;
      if (!isDigit(i)) this.fail("Invalid number: digits must follow the decimal point.", i);
      while (isDigit(i)) i++;
    }
    if (text[i] === "e" || text[i] === "E") {
      i++;
      if (text[i] === "+" || text[i] === "-") i++;
      if (!isDigit(i)) this.fail("Invalid number: the exponent needs digits.", i);
      while (isDigit(i)) i++;
    }
    const next = text[i];
    if (next === "." || next === "e" || next === "E" || next === "+" || next === "-") {
      this.fail("Invalid number format.", i);
    }
    const raw = text.slice(start, i);
    this.pos = i;
    if (!/[.eE]/.test(raw) && !Number.isSafeInteger(Number(raw))) {
      this.unsafeCount++;
      if (this.unsafe.length < MAX_REPORTED) this.unsafe.push({ path: this.currentPath(), raw });
    }
    return { type: "number", raw };
  }

  /** Returns the raw string token (with quotes); `this.pos` ends after the closing quote. */
  scanString(): string {
    const text = this.text;
    const start = this.pos;
    let i = start + 1;
    for (;;) {
      if (i >= text.length) this.fail("Unterminated string: the closing double quote is missing.", start);
      const c = text.charCodeAt(i);
      if (c === 0x22) break;
      if (c === 0x5c) {
        const e = text[i + 1];
        if (e === "u") {
          if (!HEX.test(text.slice(i + 2, i + 6))) this.fail("Invalid \\u escape: four hex digits are required.", i);
          i += 6;
          continue;
        }
        if (e === undefined || '"\\/bfnrt'.indexOf(e) === -1) {
          this.fail(`Invalid escape sequence '\\${e ?? ""}' in string.`, i);
        }
        i += 2;
        continue;
      }
      if (c < 0x20) {
        if (c === 0x0a || c === 0x0d) {
          this.fail("Line break inside a string: write it as \\n instead.", i);
        }
        this.fail("Control character inside a string must be escaped (for example \\t).", i);
      }
      i++;
    }
    this.pos = i + 1;
    return text.slice(start, this.pos);
  }

  parseString(): JSONNode {
    const raw = this.scanString();
    return { type: "string", raw, value: decodeRawString(raw) };
  }

  parseObject(depth: number): JSONNode {
    const objectStart = this.pos;
    this.pos++; // {
    const entries: JSONEntry[] = [];
    const seen = new Set<string>();
    this.skipWhitespace();
    if (this.text[this.pos] === "}") {
      this.pos++;
      return { type: "object", entries };
    }
    for (;;) {
      this.skipWhitespace();
      const ch = this.text[this.pos];
      if (ch !== '"') {
        if (ch === undefined) this.fail("Unexpected end of input: the object is not closed with '}'.", objectStart);
        if (ch === "'") this.fail("Property names must use double quotes (\"), not single quotes.");
        if (ch === "}") this.fail("Trailing comma before '}' is not allowed in JSON.");
        if (/[A-Za-z_$]/.test(ch)) this.fail("Property names must be wrapped in double quotes.");
        this.fail(`Expected a double-quoted property name but found ${describeChar(this.text, this.pos)}.`);
      }
      const keyOffset = this.pos;
      const rawKey = this.scanString();
      const key = decodeRawString(rawKey);
      if (seen.has(key)) {
        this.duplicateCount++;
        if (this.duplicates.length < MAX_REPORTED) {
          this.duplicates.push({ path: this.currentPath(), key, offset: keyOffset });
        }
      } else {
        seen.add(key);
      }
      this.skipWhitespace();
      if (this.text[this.pos] !== ":") {
        this.fail(`Expected ':' after property name ${rawKey} but found ${describeChar(this.text, this.pos)}.`);
      }
      this.pos++;
      this.path.push(key);
      const value = this.parseValue(depth + 1);
      this.path.pop();
      entries.push({ key, rawKey, value });
      this.skipWhitespace();
      const next = this.text[this.pos];
      if (next === ",") {
        this.pos++;
        continue;
      }
      if (next === "}") {
        this.pos++;
        return { type: "object", entries };
      }
      if (next === undefined) this.fail("Unexpected end of input: the object is not closed with '}'.", objectStart);
      this.fail(`Expected ',' or '}' after a property value but found ${describeChar(this.text, this.pos)}.`);
    }
  }

  parseArray(depth: number): JSONNode {
    const arrayStart = this.pos;
    this.pos++; // [
    const items: JSONNode[] = [];
    this.skipWhitespace();
    if (this.text[this.pos] === "]") {
      this.pos++;
      return { type: "array", items };
    }
    for (;;) {
      this.skipWhitespace();
      if (this.text[this.pos] === "]") this.fail("Trailing comma before ']' is not allowed in JSON.");
      this.path.push(items.length);
      items.push(this.parseValue(depth + 1));
      this.path.pop();
      this.skipWhitespace();
      const next = this.text[this.pos];
      if (next === ",") {
        this.pos++;
        continue;
      }
      if (next === "]") {
        this.pos++;
        return { type: "array", items };
      }
      if (next === undefined) this.fail("Unexpected end of input: the array is not closed with ']'.", arrayStart);
      this.fail(`Expected ',' or ']' after an array item but found ${describeChar(this.text, this.pos)}.`);
    }
  }
}

function decodeRawString(raw: string): string {
  // Fast path: no escapes means the content is the text between the quotes.
  if (raw.indexOf("\\") === -1) return raw.slice(1, -1);
  // The token has already been validated, so JSON.parse decodes it exactly.
  return JSON.parse(raw) as string;
}

interface LineInfo {
  line: number;
  column: number;
  lineStart: number;
  lineEnd: number;
}

function locate(text: string, offset: number): LineInfo {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 0x0a) {
      line++;
      lineStart = i + 1;
    } else if (c === 0x0d) {
      if (text.charCodeAt(i + 1) === 0x0a) i++;
      line++;
      lineStart = i + 1;
    }
  }
  let lineEnd = lineStart;
  while (lineEnd < text.length && text[lineEnd] !== "\n" && text[lineEnd] !== "\r") lineEnd++;
  return { line, column: offset - lineStart + 1, lineStart, lineEnd };
}

const SNIPPET_RADIUS = 60;

function failureAt(text: string, message: string, offset: number): JSONParseFailure {
  const { line, column, lineStart, lineEnd } = locate(text, offset);
  let from = lineStart;
  let to = lineEnd;
  let prefix = "";
  let suffix = "";
  if (to - from > SNIPPET_RADIUS * 2) {
    from = Math.max(lineStart, offset - SNIPPET_RADIUS);
    to = Math.min(lineEnd, offset + SNIPPET_RADIUS);
    if (from > lineStart) prefix = "…";
    if (to < lineEnd) suffix = "…";
  }
  const snippet = prefix + text.slice(from, to).replace(/\t/g, " ") + suffix;
  const pointer = " ".repeat(prefix.length + Math.max(0, offset - from)) + "^";
  return { ok: false, message, offset, line, column, snippet, pointer };
}

/** Parse strict JSON without losing number spelling, string escapes or duplicate keys. */
export function parseJSONDocument(text: string): JSONParseResult {
  const parser = new Parser(text);
  try {
    if (text.charCodeAt(0) === 0xfeff) parser.pos = 1; // tolerate a UTF-8 byte-order mark
    parser.skipWhitespace();
    if (parser.pos >= text.length) parser.fail("Input is empty. Please paste or upload JSON data.");
    const root = parser.parseValue(0);
    parser.skipWhitespace();
    if (parser.pos < text.length) {
      parser.fail(
        `Unexpected ${describeChar(text, parser.pos)} after the end of the JSON value (only one top-level value is allowed).`
      );
    }
    const duplicateKeys = parser.duplicates.map((d) => {
      const { line, column } = locate(text, d.offset);
      return { path: d.path, key: d.key, line, column };
    });
    return {
      ok: true,
      root,
      duplicateKeys,
      duplicateKeyCount: parser.duplicateCount,
      unsafeIntegers: parser.unsafe,
      unsafeIntegerCount: parser.unsafeCount,
    };
  } catch (err) {
    if (err instanceof SyntaxFailure) return failureAt(text, err.message, err.offset);
    throw err;
  }
}

/**
 * Serialise a parsed tree. `indent` 0 produces compact output; otherwise the
 * layout matches JSON.stringify(value, null, indent). Numbers, strings and
 * property names are written exactly as they appeared in the source, and
 * duplicate keys are kept, so only whitespace changes.
 */
export function formatJSON(node: JSONNode, indent: number): string {
  const pretty = indent > 0;
  const unit = pretty ? " ".repeat(indent) : "";
  const newlines: string[] = [];
  const lineAt = (level: number): string => {
    let value = newlines[level];
    if (value === undefined) {
      value = "\n" + unit.repeat(level);
      newlines[level] = value;
    }
    return value;
  };
  const colon = pretty ? ": " : ":";
  const write = (n: JSONNode, level: number): string => {
    switch (n.type) {
      case "string":
      case "number":
        return n.raw;
      case "boolean":
        return n.value ? "true" : "false";
      case "null":
        return "null";
      case "array": {
        if (n.items.length === 0) return "[]";
        const inner = pretty ? lineAt(level + 1) : "";
        let out = "[";
        for (let i = 0; i < n.items.length; i++) {
          if (i > 0) out += ",";
          out += inner + write(n.items[i], level + 1);
        }
        return out + (pretty ? lineAt(level) : "") + "]";
      }
      case "object": {
        if (n.entries.length === 0) return "{}";
        const inner = pretty ? lineAt(level + 1) : "";
        let out = "{";
        for (let i = 0; i < n.entries.length; i++) {
          const entry = n.entries[i];
          if (i > 0) out += ",";
          out += inner + entry.rawKey + colon + write(entry.value, level + 1);
        }
        return out + (pretty ? lineAt(level) : "") + "}";
      }
    }
  };
  return write(node, 0);
}

/** Short human description used in error messages, e.g. "an object", "null". */
export function describeNode(node: JSONNode): string {
  switch (node.type) {
    case "null":
      return "null";
    case "array":
      return "an array";
    case "object":
      return "an object";
    case "string":
      return "a string";
    case "number":
      return "a number";
    case "boolean":
      return "a boolean";
  }
}
