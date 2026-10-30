/**
 * Turn CSV rows into an Excel sheet without Excel's guessing: a column becomes
 * numbers only when every value is a plain number Excel can show exactly, and
 * dates only when every value is an unambiguous ISO date. Everything else,
 * including codes with leading zeros, long IDs and phone numbers, stays text.
 */
import { dateToSerial, type WriteCell } from "./xlsx-write";

export const EXCEL_MAX_ROWS = 1_048_576;
export const EXCEL_MAX_COLUMNS = 16_384;

export type ColumnKind = "number" | "date" | "datetime" | "text";

/** A plain number: optional minus, no leading zeros, no thousands separators, at most 11 integer digits and 15 significant digits. */
const PLAIN_NUMBER = /^-?(0|[1-9]\d{0,10})(\.\d+)?$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

export function isPlainNumber(value: string): boolean {
  if (!PLAIN_NUMBER.test(value)) return false;
  const digits = value.replace(/^-/, "").replace(".", "").replace(/^0+/, "");
  return digits.length <= 15;
}

function validDate(y: number, m: number, d: number): boolean {
  if (y < 1900 || y > 9999 || m < 1 || m > 12 || d < 1) return false;
  if (y === 1900 && m < 3) return false; // before Excel's 1900 leap-year bug the serials are shifted
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** The Excel serial for an ISO date or date-time, or null when it is not one. */
export function isoToSerial(value: string): { serial: number; time: boolean; seconds: boolean } | null {
  let m = ISO_DATE.exec(value);
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return validDate(y, mo, d) ? { serial: dateToSerial(y, mo, d), time: false, seconds: false } : null;
  }
  m = ISO_DATETIME.exec(value);
  if (m) {
    const [y, mo, d, h, mi] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])];
    const s = m[6] === undefined ? 0 : Number(m[6]);
    if (!validDate(y, mo, d) || h > 23 || mi > 59 || s > 59) return null;
    return { serial: dateToSerial(y, mo, d, h, mi, s), time: true, seconds: m[6] !== undefined };
  }
  return null;
}

/** Decide each column's kind from all its non-empty values (the header row excluded). */
export function columnKinds(rows: string[][], header: boolean, detect: { numbers: boolean; dates: boolean }): ColumnKind[] {
  const columns = rows.reduce((n, r) => Math.max(n, r.length), 0);
  const kinds: ColumnKind[] = [];
  for (let c = 0; c < columns; c++) {
    let numbers = detect.numbers;
    let dates = detect.dates;
    let datetimes = detect.dates;
    let seen = 0;
    for (let r = header ? 1 : 0; r < rows.length && (numbers || dates || datetimes); r++) {
      const v = rows[r][c];
      if (v === undefined || v === "") continue;
      seen++;
      if (numbers && !isPlainNumber(v)) numbers = false;
      if (dates || datetimes) {
        const d = isoToSerial(v);
        if (!d) dates = datetimes = false;
        else if (d.time) dates = false;
      }
    }
    kinds.push(seen === 0 ? "text" : numbers ? "number" : dates ? "date" : datetimes ? "datetime" : "text");
  }
  return kinds;
}

export interface SheetBuild {
  rows: WriteCell[][];
  kinds: ColumnKind[];
}

/** Build sheet cells from CSV rows. Empty strings become empty cells. */
export function csvRowsToCells(rows: string[][], header: boolean, detect: { numbers: boolean; dates: boolean }): SheetBuild {
  const kinds = columnKinds(rows, header, detect);
  // Some date-time columns have seconds and some do not: use one format per column.
  const withSeconds = kinds.map((k, c) => k === "datetime" && rows.some((row, r) => (!header || r > 0) && /:\d{2}:\d{2}$/.test(row[c] ?? "")));
  const out = rows.map((row, r) =>
    row.map((v): WriteCell => {
      if (v === "") return null;
      if (header && r === 0) return v;
      return v;
    })
  );
  for (let c = 0; c < kinds.length; c++) {
    const kind = kinds[c];
    if (kind === "text") continue;
    // Keep visible decimals such as 1250.50: when a value has a trailing zero after the point,
    // give the column a fixed number of decimals (General would show 1250.5).
    let numberFormat: string | undefined;
    if (kind === "number") {
      let decimals = 0;
      let trailingZero = false;
      for (let r = header ? 1 : 0; r < rows.length; r++) {
        const v = rows[r][c];
        const dot = v ? v.indexOf(".") : -1;
        if (dot < 0) continue;
        decimals = Math.max(decimals, v.length - dot - 1);
        if (v.endsWith("0")) trailingZero = true;
      }
      if (trailingZero && decimals > 0 && decimals <= 10) numberFormat = `0.${"0".repeat(decimals)}`;
    }
    for (let r = header ? 1 : 0; r < rows.length; r++) {
      const v = rows[r][c];
      if (v === undefined || v === "") continue;
      if (kind === "number") out[r][c] = numberFormat ? { value: Number(v), format: numberFormat } : Number(v);
      else {
        const d = isoToSerial(v)!;
        out[r][c] = { value: d.serial, format: kind === "date" ? "yyyy-mm-dd" : withSeconds[c] ? "yyyy-mm-dd hh:mm:ss" : "yyyy-mm-dd hh:mm" };
      }
    }
  }
  return { rows: out, kinds };
}

/** A message when the data does not fit on one Excel sheet, or null. */
export function excelLimitProblem(rowCount: number, columnCount: number): string | null {
  if (rowCount > EXCEL_MAX_ROWS) {
    return `This file has ${rowCount.toLocaleString()} rows, but an Excel sheet holds at most ${EXCEL_MAX_ROWS.toLocaleString()}. Split it into smaller files first.`;
  }
  if (columnCount > EXCEL_MAX_COLUMNS) {
    return `This file has ${columnCount.toLocaleString()} columns, but an Excel sheet holds at most ${EXCEL_MAX_COLUMNS.toLocaleString()}.`;
  }
  return null;
}
