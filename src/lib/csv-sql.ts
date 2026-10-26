/**
 * Logic for CSV to SQL: turn rows of a CSV file into INSERT statements (and an
 * optional CREATE TABLE) for MySQL, PostgreSQL, SQL Server, SQLite or Oracle.
 * Values are written exactly as they are in the file; only quoting and escaping
 * are added. A column is written as numbers only when every value in it is a
 * plain number without leading zeros, so codes such as 00123 stay text.
 */

export type SQLDialect = "mysql" | "postgresql" | "sqlserver" | "sqlite" | "oracle";

export const DIALECTS: { value: SQLDialect; label: string; maxRowsPerStatement: number }[] = [
  { value: "mysql", label: "MySQL / MariaDB", maxRowsPerStatement: 5000 },
  { value: "postgresql", label: "PostgreSQL", maxRowsPerStatement: 5000 },
  { value: "sqlserver", label: "SQL Server", maxRowsPerStatement: 1000 },
  { value: "sqlite", label: "SQLite", maxRowsPerStatement: 500 },
  { value: "oracle", label: "Oracle", maxRowsPerStatement: 1000 },
];

export type ColumnKind = "integer" | "decimal" | "boolean" | "date" | "datetime" | "text";

export interface ColumnInfo {
  /** Name as written in the SQL (before identifier quoting). */
  name: string;
  kind: ColumnKind;
  /** Longest value in characters (text) or digits before/after the point (decimal). */
  maxLength: number;
  precision: number;
  scale: number;
  /** Some cells are empty. */
  hasEmpty: boolean;
  /** Integer values beyond ±2,147,483,647 (need BIGINT). */
  big: boolean;
}

export interface SQLOptions {
  dialect: SQLDialect;
  table: string;
  /** Column names, one per CSV column. */
  columns: string[];
  /** Indexes of the CSV columns to include, in order. */
  include: number[];
  rowsPerStatement: number;
  createTable: boolean;
  /** Write empty cells as NULL (otherwise as an empty string, or NULL in numeric columns). */
  emptyAsNull: boolean;
  /** Wrap everything in a transaction. */
  transaction: boolean;
  /** Detect numbers, true/false and dates; when off every value is quoted text. */
  detectTypes: boolean;
}

const INTEGER = /^-?(?:0|[1-9]\d*)$/;
const DECIMAL = /^-?(?:0|[1-9]\d*)\.\d+$/;
const BOOLEAN = /^(?:true|false)$/i;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?$/;
const INT32_MAX = 2147483647;

function validDate(y: string, m: string, d: string): boolean {
  const year = +y, month = +m, day = +d;
  if (month < 1 || month > 12 || day < 1) return false;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= days;
}

function kindOf(value: string): ColumnKind {
  if (INTEGER.test(value)) return "integer";
  if (DECIMAL.test(value)) return "decimal";
  if (BOOLEAN.test(value)) return "boolean";
  let m = DATE.exec(value);
  if (m) return validDate(m[1], m[2], m[3]) ? "date" : "text";
  m = DATETIME.exec(value);
  if (m && validDate(m[1], m[2], m[3]) && +m[4] < 24 && +m[5] < 60 && (m[6] === undefined || +m[6] < 60)) return "datetime";
  return "text";
}

/** Combine two kinds seen in one column into the narrowest kind that holds both. */
function widen(a: ColumnKind | null, b: ColumnKind): ColumnKind {
  if (a === null || a === b) return b;
  if ((a === "integer" && b === "decimal") || (a === "decimal" && b === "integer")) return "decimal";
  if ((a === "date" && b === "datetime") || (a === "datetime" && b === "date")) return "datetime";
  return "text";
}

/** Work out each column's type from its values. Empty cells do not count. */
export function analyzeColumns(names: string[], rows: string[][], detectTypes: boolean): ColumnInfo[] {
  return names.map((name, c) => {
    let kind: ColumnKind | null = null;
    let maxLength = 0, intDigits = 0, scale = 0;
    let hasEmpty = false, big = false;
    for (const row of rows) {
      const v = row[c] ?? "";
      if (v === "") {
        hasEmpty = true;
        continue;
      }
      if (v.length > maxLength) maxLength = v.length;
      if (!detectTypes) {
        kind = "text";
        continue;
      }
      const k = kindOf(v);
      kind = widen(kind, k);
      if (k === "integer") {
        const digits = v.replace("-", "").length;
        if (digits > intDigits) intDigits = digits;
        if (Math.abs(Number(v)) > INT32_MAX) big = true;
      } else if (k === "decimal") {
        const [i, f] = v.replace("-", "").split(".");
        if (i.length > intDigits) intDigits = i.length;
        if (f.length > scale) scale = f.length;
      }
    }
    // Integers longer than 18 digits do not fit BIGINT; keep them as text.
    if (kind === "integer" && intDigits > 18) kind = "text";
    if (kind === "decimal" && intDigits + scale > 38) kind = "text";
    return { name, kind: kind ?? "text", maxLength, precision: intDigits + scale, scale, hasEmpty, big };
  });
}

/** Quote a table or column name for the dialect. */
export function quoteIdentifier(name: string, dialect: SQLDialect): string {
  if (dialect === "mysql") return "`" + name.replace(/`/g, "``") + "`";
  if (dialect === "sqlserver") return "[" + name.replace(/]/g, "]]") + "]";
  return '"' + name.replace(/"/g, '""') + '"';
}

/** A table name like "orders" or "sales.orders": each dotted part is quoted on its own. */
export function quoteTableName(name: string, dialect: SQLDialect): string {
  const parts = name.split(".").map((p) => p.trim()).filter((p) => p !== "");
  return (parts.length ? parts : ["my_table"]).map((p) => quoteIdentifier(p, dialect)).join(".");
}

// Built with RegExp so the Unicode flag is accepted by the ES5 TypeScript target.
const NON_WORD = new RegExp("[^\\p{L}\\p{N}]+", "gu");
const STARTS_WITH_DIGIT = new RegExp("^\\p{N}", "u");

/** "First Name" -> "first_name"; keeps letters and digits from any script. */
export function snakeCase(name: string, index: number): string {
  const s = name
    .normalize("NFKC")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(NON_WORD, "_")
    .replace(/^_+|_+$/g, "");
  if (s === "") return `column_${index + 1}`;
  return STARTS_WITH_DIGIT.test(s) ? `c_${s}` : s;
}

/** Make column names unique by adding _2, _3, ... (comparing without case). */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  const taken = new Set(names.map((n) => n.toLowerCase()));
  return names.map((n) => {
    const key = n.toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 1) return n;
    let k = count;
    let candidate = `${n}_${k}`;
    while (taken.has(candidate.toLowerCase())) candidate = `${n}_${++k}`;
    taken.add(candidate.toLowerCase());
    return candidate;
  });
}

/** A string literal: single quotes doubled; MySQL also escapes backslashes; SQL Server uses N'' for non-ASCII. */
export function quoteString(value: string, dialect: SQLDialect): string {
  let v = value.replace(/'/g, "''");
  if (dialect === "mysql") v = v.replace(/\\/g, "\\\\");
  // A NUL character cannot be stored in text columns of most databases.
  v = v.replace(/\u0000/g, "");
  // eslint-disable-next-line no-control-regex
  const prefix = dialect === "sqlserver" && /[^\x00-\x7f]/.test(v) ? "N" : "";
  return `${prefix}'${v}'`;
}

function literal(value: string, col: ColumnInfo, options: SQLOptions): string {
  const { dialect } = options;
  if (value === "") {
    if (options.emptyAsNull || col.kind !== "text") return "NULL";
    // Oracle treats '' as NULL anyway.
    return "''";
  }
  switch (col.kind) {
    case "integer":
    case "decimal":
      return value;
    case "boolean": {
      const t = value.toLowerCase() === "true";
      if (dialect === "postgresql") return t ? "TRUE" : "FALSE";
      return t ? "1" : "0";
    }
    case "date":
      return dialect === "oracle" ? `DATE '${value}'` : `'${value}'`;
    case "datetime": {
      const v = value.replace("T", " ");
      // Oracle TIMESTAMP literals need a time; a date-only value means midnight.
      return dialect === "oracle" ? `TIMESTAMP '${v.length === 10 ? `${v} 00:00:00` : v}'` : `'${v}'`;
    }
    default:
      return quoteString(value, dialect);
  }
}

/** The SQL type used in CREATE TABLE for a column. */
/** Text length rounded up to a common size, so slightly longer values still fit later. */
export function roomyLength(maxLength: number): number {
  for (const size of [50, 100, 255]) if (maxLength <= size) return size;
  return maxLength;
}

export function sqlType(col: ColumnInfo, dialect: SQLDialect): string {
  const len = roomyLength(Math.max(1, col.maxLength));
  switch (col.kind) {
    case "integer":
      if (dialect === "oracle") return col.big ? "NUMBER(19)" : "NUMBER(10)";
      if (dialect === "sqlite") return "INTEGER";
      return col.big ? "BIGINT" : "INTEGER";
    case "decimal":
      if (dialect === "sqlite") return "REAL";
      return `${dialect === "oracle" ? "NUMBER" : "DECIMAL"}(${Math.max(col.precision, col.scale + 1)}, ${col.scale})`;
    case "boolean":
      if (dialect === "postgresql") return "BOOLEAN";
      if (dialect === "sqlserver") return "BIT";
      if (dialect === "oracle") return "NUMBER(1)";
      if (dialect === "sqlite") return "INTEGER";
      return "TINYINT(1)";
    case "date":
      return dialect === "sqlite" ? "TEXT" : "DATE";
    case "datetime":
      if (dialect === "mysql") return "DATETIME";
      if (dialect === "sqlserver") return "DATETIME2";
      if (dialect === "sqlite") return "TEXT";
      return "TIMESTAMP";
    default:
      if (dialect === "sqlite") return "TEXT";
      if (dialect === "postgresql") return len > 255 ? "TEXT" : `VARCHAR(${len})`;
      if (dialect === "sqlserver") return len > 4000 ? "NVARCHAR(MAX)" : `NVARCHAR(${len})`;
      if (dialect === "oracle") return len > 4000 ? "CLOB" : `VARCHAR2(${len} CHAR)`;
      return len > 255 ? "TEXT" : `VARCHAR(${len})`;
  }
}

export function createTableSQL(table: string, columns: ColumnInfo[], dialect: SQLDialect): string {
  const lines = columns.map((col) => `  ${quoteIdentifier(col.name, dialect)} ${sqlType(col, dialect)}`);
  // MySQL/MariaDB servers whose default character set is still latin1 would reject emoji and many scripts.
  const suffix = dialect === "mysql" ? " DEFAULT CHARSET=utf8mb4" : "";
  return `CREATE TABLE ${quoteTableName(table, dialect)} (\n${lines.join(",\n")}\n)${suffix};`;
}

export interface SQLResult {
  /** The script in pieces (join them, or pass them to a Blob). */
  chunks: string[];
  statements: number;
  rows: number;
  columns: ColumnInfo[];
  /** Length of the script in characters (about the same as bytes for plain-ASCII data). */
  bytes: number;
}

/** Build the whole SQL script. Rows are data rows (no header). */
export function buildSQL(rows: string[][], options: SQLOptions): SQLResult {
  const { dialect } = options;
  const names = options.include.map((c) => options.columns[c]);
  const projected = rows.map((row) => options.include.map((c) => row[c] ?? ""));
  const columns = analyzeColumns(names, projected, options.detectTypes);
  const table = quoteTableName(options.table, dialect);
  const columnList = `(${columns.map((c) => quoteIdentifier(c.name, dialect)).join(", ")})`;
  const max = DIALECTS.find((d) => d.value === dialect)!.maxRowsPerStatement;
  const perStatement = Math.max(1, Math.min(options.rowsPerStatement, max));

  const chunks: string[] = [];
  const begin = dialect === "sqlserver" ? "BEGIN TRANSACTION;" : dialect === "oracle" ? null : dialect === "mysql" ? "START TRANSACTION;" : "BEGIN;";
  if (options.transaction && begin) chunks.push(begin + "\n\n");
  if (options.createTable) chunks.push(createTableSQL(options.table, columns, dialect) + "\n\n");

  let statements = 0;
  for (let start = 0; start < projected.length; start += perStatement) {
    const batch = projected.slice(start, start + perStatement);
    const tuples = batch.map((row) => `(${row.map((v, i) => literal(v, columns[i], options)).join(", ")})`);
    if (dialect === "oracle" && batch.length > 1) {
      chunks.push(`INSERT ALL\n${tuples.map((t) => `  INTO ${table} ${columnList} VALUES ${t}`).join("\n")}\nSELECT 1 FROM DUAL;\n`);
    } else if (batch.length === 1) {
      chunks.push(`INSERT INTO ${table} ${columnList} VALUES ${tuples[0]};\n`);
    } else {
      chunks.push(`INSERT INTO ${table} ${columnList} VALUES\n  ${tuples.join(",\n  ")};\n`);
    }
    statements++;
  }
  if (options.transaction) chunks.push("\nCOMMIT;\n");

  let bytes = 0;
  for (const c of chunks) bytes += c.length;
  return { chunks, statements, rows: projected.length, columns, bytes };
}

/**
 * Column or table names cleaned for SQL: snake_case, unique, and upper case for
 * Oracle (where quoted lower-case names would have to be quoted in every query).
 */
export function cleanNames(names: string[], dialect: SQLDialect): string[] {
  const cleaned = uniqueNames(names.map((n, i) => snakeCase(n, i)));
  return dialect === "oracle" ? cleaned.map((n) => n.toUpperCase()) : cleaned;
}

/** A default table name from a file name: "Customers 2024.csv" -> "customers_2024". */
export function tableNameFromFile(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, "");
  return snakeCase(stem, 0).replace(/^column_1$/, "my_table") || "my_table";
}
