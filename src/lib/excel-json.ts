/** Turn a worksheet into JSON: an array of objects keyed by the header row, or an array of row arrays. */
import { cellJSON, cellText, columnLetters, type JSONCellValue, type JSONOptions, type Sheet, type Workbook } from "./xlsx-read";

export interface SheetJSONOptions extends JSONOptions {
  header: boolean;
  shape: "objects" | "arrays";
  /** "null" writes empty cells as null; "omit" leaves the key out (objects only). */
  empty: "null" | "omit";
}

/** Unique, non-empty keys from the header row: blanks become "Column C", repeats get _2, _3. */
export function headerKeys(sheet: Sheet, wb: Pick<Workbook, "formatOf" | "date1904">): string[] {
  const first = sheet.rows[0] ?? [];
  const seen = new Map<string, number>();
  const keys: string[] = [];
  for (let c = 0; c < sheet.columnCount; c++) {
    let key = cellText(first[c], wb, { values: "shown", dates: "iso" }).trim() || `Column ${columnLetters(c)}`;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count > 0) {
      let n = count + 1;
      while (seen.has(`${key}_${n}`)) n++;
      key = `${key}_${n}`;
      seen.set(key, 1);
    }
    keys.push(key);
  }
  return keys;
}

export function sheetToJSONValue(sheet: Sheet, wb: Pick<Workbook, "formatOf" | "date1904">, options: SheetJSONOptions): unknown[] {
  const cell = (r: number, c: number): JSONCellValue => cellJSON(sheet.rows[r]?.[c], wb, options);
  if (options.shape === "arrays") {
    return sheet.rows.map((_, r) => Array.from({ length: sheet.columnCount }, (_, c) => cell(r, c)));
  }
  const keys = options.header ? headerKeys(sheet, wb) : Array.from({ length: sheet.columnCount }, (_, c) => columnLetters(c));
  const out: Record<string, JSONCellValue>[] = [];
  for (let r = options.header ? 1 : 0; r < sheet.rows.length; r++) {
    const obj: Record<string, JSONCellValue> = {};
    let any = false;
    for (let c = 0; c < keys.length; c++) {
      const v = cell(r, c);
      if (v !== null) any = true;
      if (v === null && options.empty === "omit") continue;
      obj[keys[c]] = v;
    }
    // Rows with no values at all are skipped, so blank spacer rows do not become empty objects.
    if (any) out.push(obj);
  }
  return out;
}
