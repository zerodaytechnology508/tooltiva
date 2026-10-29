/**
 * Read .xlsx / .xlsm workbooks in the browser without a library: the ZIP package
 * is inflated with DecompressionStream and the XML parts are scanned directly.
 * Values come from what Excel saved, so formulas give their last calculated
 * result, and number formats are applied the way Excel displays them.
 */
import { listZip, looksLikeOle, looksLikeZip, readZipText, ZipError, type ZipFileEntry } from "./zip-read";
import { decodeEntities, decodeExcelEscapes, scanXml } from "./xml-lite";
import { formatCodeFor, formatGeneral, formatNumber, formatText, isDateFormat, isElapsedFormat, serialToISO } from "./excel-format";

export class XlsxError extends Error {}

export type Cell =
  | { t: "n"; v: number; s: number }
  | { t: "s"; v: string; s: number }
  | { t: "b"; v: boolean; s: number }
  | { t: "e"; v: string; s: number }
  | { t: "d"; v: string; s: number };

export interface SheetInfo {
  name: string;
  hidden: boolean;
  /** Chart sheets and other non-cell sheets cannot be converted. */
  isWorksheet: boolean;
  path: string | null;
}

export interface Sheet {
  name: string;
  /** Rows of cells; undefined entries are empty cells. Leading and trailing empty rows and columns are removed. */
  rows: (Cell | undefined)[][];
  columnCount: number;
  /** Formula cells saved without a calculated value (shown as empty). */
  formulasWithoutValue: number;
  formulaCount: number;
  mergedRanges: number;
  /** 1-based number of the first row and column that hold data in the sheet. */
  firstRow: number;
  firstColumn: number;
}

export interface Workbook {
  sheets: SheetInfo[];
  date1904: boolean;
  /** The number format code for a cell's style index. */
  formatOf: (styleIndex: number) => string;
  readSheet: (index: number) => Promise<Sheet>;
}

/** Column letters to a 0-based index: "A" → 0, "AA" → 26. */
export function columnIndex(letters: string): number {
  let n = 0;
  for (let i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64);
  return n - 1;
}

/** 0-based index to column letters: 0 → "A". */
export function columnLetters(index: number): string {
  let s = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function resolvePath(base: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const parts = base.split("/").slice(0, -1);
  for (const segment of target.split("/")) {
    if (segment === "..") parts.pop();
    else if (segment !== ".") parts.push(segment);
  }
  return parts.join("/");
}

async function readRels(bytes: Uint8Array, entries: Map<string, ZipFileEntry>, partPath: string) {
  const dir = partPath.split("/").slice(0, -1).join("/");
  const file = partPath.split("/").pop();
  const relsPath = `${dir ? dir + "/" : ""}_rels/${file}.rels`;
  const xml = await readZipText(bytes, entries, relsPath);
  const rels = new Map<string, { target: string; type: string; external: boolean }>();
  if (!xml) return rels;
  scanXml(xml, {
    open(name, a) {
      if (name === "Relationship" && a.Id) rels.set(a.Id, { target: a.Target ?? "", type: a.Type ?? "", external: a.TargetMode === "External" });
    },
  });
  return rels;
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  let current = "";
  let inSi = false;
  let inT = false;
  let skip = 0; // inside phonetic runs (rPh), whose text is not part of the value
  scanXml(xml, {
    open(name, _a, selfClosing) {
      if (name === "si") {
        inSi = true;
        current = "";
        if (selfClosing) {
          strings.push("");
          inSi = false;
        }
      } else if (name === "rPh" && !selfClosing) skip++;
      else if (name === "t" && !selfClosing) inT = true;
    },
    close(name) {
      if (name === "si" && inSi) {
        strings.push(decodeExcelEscapes(current));
        inSi = false;
      } else if (name === "rPh") skip = Math.max(0, skip - 1);
      else if (name === "t") inT = false;
    },
    text(t) {
      if (inSi && inT && skip === 0) current += t;
    },
  });
  return strings;
}

function parseStyles(xml: string | null): { customFormats: Map<number, string>; xfFormats: number[] } {
  const customFormats = new Map<number, string>();
  const xfFormats: number[] = [];
  if (!xml) return { customFormats, xfFormats };
  let inCellXfs = false;
  scanXml(xml, {
    open(name, a, selfClosing) {
      if (name === "numFmt" && a.numFmtId !== undefined) customFormats.set(Number(a.numFmtId), a.formatCode ?? "General");
      else if (name === "cellXfs" && !selfClosing) inCellXfs = true;
      else if (name === "xf" && inCellXfs) xfFormats.push(Number(a.numFmtId ?? 0));
    },
    close(name) {
      if (name === "cellXfs") inCellXfs = false;
    },
  });
  return { customFormats, xfFormats };
}

const ATTR_RE: Record<string, RegExp> = {};
function attr(tag: string, name: string): string | undefined {
  // Attribute lookup in a start tag; the names used here (r, s, t) never appear inside values.
  const re = (ATTR_RE[name] ??= new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`));
  const m = re.exec(tag);
  return m ? (m[2] ?? m[3]) : undefined;
}

/** Text of every <t> element in an inline string, skipping phonetic runs (<rPh>). */
function inlineStringText(segment: string): string {
  const cleaned = segment.replace(/<(\w+:)?rPh\b[\s\S]*?<\/(\w+:)?rPh>/g, "");
  let out = "";
  const re = /<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned))) out += m[1];
  return decodeEntities(out);
}

/**
 * Parse a worksheet's XML. Written for speed on large sheets: it walks the
 * <row> and <c> elements with indexOf instead of a general XML parser.
 */
function parseSheet(xml: string, name: string, sharedStrings: string[]): Sheet {
  const rows: (Cell | undefined)[][] = [];
  let formulasWithoutValue = 0;
  let formulaCount = 0;
  let rowIndex = -1;
  let colIndex = -1;
  const dataStart = xml.search(/<(\w+:)?sheetData[\s>/]/);
  const dataEndMatch = /<\/(\w+:)?sheetData>/.exec(xml);
  const dataEnd = dataEndMatch ? dataEndMatch.index : xml.length;
  // `pos` is where the next search for "<" starts.
  let pos = dataStart < 0 ? dataEnd : dataStart + 1;

  while (pos < dataEnd) {
    const lt = xml.indexOf("<", pos);
    if (lt < 0 || lt >= dataEnd) break;
    pos = lt + 1;
    // Element name, without a namespace prefix.
    let nameEnd = lt + 1;
    while (nameEnd < dataEnd) {
      const ch = xml.charCodeAt(nameEnd);
      if (ch === 32 || ch === 62 || ch === 47 || ch === 9 || ch === 10 || ch === 13) break;
      nameEnd++;
    }
    const qname = xml.slice(lt + 1, nameEnd);
    const local = qname.slice(qname.indexOf(":") + 1);
    if (local === "row") {
      const gt = xml.indexOf(">", nameEnd);
      const r = attr(xml.slice(lt, gt), "r");
      rowIndex = r ? Number(r) - 1 : rowIndex + 1;
      colIndex = -1;
      pos = gt + 1;
      continue;
    }
    if (local !== "c") continue;

    const gt = xml.indexOf(">", nameEnd);
    // Read the r, t and s attributes by scanning the tag in place.
    let ref: string | undefined;
    let type = "n";
    let style = 0;
    let k = nameEnd;
    while (k < gt) {
      while (k < gt && xml.charCodeAt(k) <= 32) k++;
      const eq = xml.indexOf("=", k);
      if (eq < 0 || eq > gt) break;
      const attrName = xml.slice(k, eq).trim();
      let q = eq + 1;
      while (xml.charCodeAt(q) <= 32) q++;
      const quote = xml[q];
      const valueEnd = xml.indexOf(quote, q + 1);
      const value = xml.slice(q + 1, valueEnd);
      if (attrName === "r") ref = value;
      else if (attrName === "t") type = value;
      else if (attrName === "s") style = Number(value) || 0;
      k = valueEnd + 1;
    }
    if (ref) {
      let letters = 0;
      let i = ref.charCodeAt(0) === 36 /* $ */ ? 1 : 0;
      let n = 0;
      for (; i < ref.length; i++) {
        const ch = ref.charCodeAt(i);
        if (ch < 65 || ch > 90) break;
        n = n * 26 + (ch - 64);
        letters++;
      }
      colIndex = letters ? n - 1 : colIndex + 1;
    } else colIndex++;
    if (xml.charCodeAt(gt - 1) === 47 /* self-closing <c .../> */) {
      pos = gt + 1;
      continue;
    }
    const closeTag = `</${qname}>`;
    let close = xml.indexOf(closeTag, gt);
    if (close < 0 || close > dataEnd) close = dataEnd;
    pos = close + closeTag.length;

    // Formula and value elements inside this cell (searched only within the cell).
    const inner = xml.slice(gt + 1, close);
    const prefix = qname.length > 1 ? qname.slice(0, qname.length - 1) : "";
    const fAt = inner.indexOf(`<${prefix}f`);
    const hasFormula = fAt >= 0 && /[\s>/]/.test(inner[fAt + prefix.length + 2] ?? ">");
    if (hasFormula) formulaCount++;
    let cell: Cell | undefined;
    if (type === "inlineStr") {
      const text = inlineStringText(inner);
      if (text !== "") cell = { t: "s", v: decodeExcelEscapes(text), s: style };
    } else {
      let value = "";
      const vOpen = `<${prefix}v>`;
      const vAt = inner.indexOf(vOpen);
      if (vAt >= 0) {
        const vEnd = inner.indexOf(`</${prefix}v>`, vAt);
        value = inner.slice(vAt + vOpen.length, vEnd < 0 ? inner.length : vEnd);
      } else if (inner.indexOf("v") >= 0) {
        // <v> with attributes (rare).
        const m = /<(?:\w+:)?v(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?v>/.exec(inner);
        if (m) value = m[1];
      }
      if (value.indexOf("&") >= 0) value = decodeEntities(value);
      if (value === "") {
        if (hasFormula) formulasWithoutValue++;
      } else if (type === "s") {
        const text = sharedStrings[Number(value)];
        if (text !== undefined && text !== "") cell = { t: "s", v: text, s: style };
      } else if (type === "n") {
        const num = Number(value);
        cell = Number.isFinite(num) ? { t: "n", v: num, s: style } : { t: "s", v: value, s: style };
      } else if (type === "str") {
        cell = { t: "s", v: decodeExcelEscapes(value), s: style };
      } else if (type === "b") {
        const b = value.trim();
        cell = { t: "b", v: b === "1" || b.toLowerCase() === "true", s: style };
      } else if (type === "e") {
        cell = { t: "e", v: value.trim(), s: style };
      } else if (type === "d") {
        cell = { t: "d", v: value.trim(), s: style };
      } else {
        const num = Number(value);
        cell = Number.isFinite(num) ? { t: "n", v: num, s: style } : { t: "s", v: value, s: style };
      }
    }
    if (cell && rowIndex >= 0 && colIndex >= 0) (rows[rowIndex] ??= [])[colIndex] = cell;
  }

  const mergedRanges = (xml.slice(dataEnd).match(/<(\w+:)?mergeCell[\s/>]/g) ?? []).length;

  // Trim empty rows and columns around the data (Excel's CSV export does the same for the used range).
  let firstRow = -1;
  let lastRow = -1;
  let firstCol = Infinity;
  let lastCol = -1;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    let rowHas = false;
    for (let c = 0; c < row.length; c++) {
      if (row[c] === undefined) continue;
      rowHas = true;
      if (c < firstCol) firstCol = c;
      if (c > lastCol) lastCol = c;
    }
    if (rowHas) {
      if (firstRow < 0) firstRow = r;
      lastRow = r;
    }
  }
  const out: (Cell | undefined)[][] = [];
  if (firstRow >= 0) {
    for (let r = firstRow; r <= lastRow; r++) {
      const row = rows[r] ?? [];
      out.push(row.slice(firstCol, lastCol + 1));
    }
  }
  return {
    name,
    rows: out,
    columnCount: firstRow >= 0 ? lastCol - firstCol + 1 : 0,
    formulasWithoutValue,
    formulaCount,
    mergedRanges,
    firstRow: firstRow + 1,
    firstColumn: Number.isFinite(firstCol) ? firstCol + 1 : 1,
  };
}

/** Open a workbook. Throws XlsxError with a message for the reader when the file cannot be read. */
export async function openXlsx(bytes: Uint8Array): Promise<Workbook> {
  if (looksLikeOle(bytes)) {
    throw new XlsxError(
      "This is an older .xls workbook (Excel 97–2003) or a password-protected file. Open it in Excel or Google Sheets and save it as .xlsx (Excel Workbook), or remove the password, then try again."
    );
  }
  if (!looksLikeZip(bytes)) {
    throw new XlsxError("This file is not an Excel .xlsx workbook. If it is a CSV file, open it with the CSV Viewer instead.");
  }
  let entries: Map<string, ZipFileEntry>;
  try {
    entries = listZip(bytes);
  } catch (e) {
    throw new XlsxError(`The workbook could not be opened: ${e instanceof ZipError ? e.message : "the file is damaged"}. Try saving it again from Excel.`);
  }
  if (entries.has("xl/workbook.bin")) {
    throw new XlsxError("This is an Excel Binary Workbook (.xlsb). Open it in Excel and save it as Excel Workbook (.xlsx), then try again.");
  }
  if (entries.has("content.xml") && !entries.has("[Content_Types].xml")) {
    throw new XlsxError("This is an OpenDocument spreadsheet (.ods). Open it in LibreOffice or Google Sheets and save it as .xlsx, then try again.");
  }

  // Find the main workbook part from the package relationships.
  let workbookPath = "xl/workbook.xml";
  const rootRels = await readRels(bytes, entries, "");
  rootRels.forEach((rel) => {
    if (/officeDocument$/.test(rel.type)) workbookPath = resolvePath("", rel.target);
  });
  const workbookXml = await readZipText(bytes, entries, workbookPath);
  if (!workbookXml) throw new XlsxError("This ZIP file is not an Excel workbook: it has no workbook part.");

  const rels = await readRels(bytes, entries, workbookPath);
  const sheets: SheetInfo[] = [];
  let date1904 = false;
  scanXml(workbookXml, {
    open(name, a) {
      if (name === "workbookPr") date1904 = a.date1904 === "1" || a.date1904 === "true";
      if (name === "sheet") {
        const idKey = Object.keys(a).find((k) => k === "r:id" || k.endsWith(":id"));
        const rel = idKey ? rels.get(a[idKey]) : undefined;
        const isWorksheet = !!rel && /\/worksheet$/.test(rel.type);
        sheets.push({
          name: a.name ?? `Sheet${sheets.length + 1}`,
          hidden: a.state === "hidden" || a.state === "veryHidden",
          isWorksheet,
          path: rel && !rel.external ? resolvePath(workbookPath, rel.target) : null,
        });
      }
    },
  });
  if (sheets.length === 0) throw new XlsxError("The workbook has no sheets.");

  let sharedPath = `${workbookPath.split("/").slice(0, -1).join("/")}/sharedStrings.xml`;
  let stylesPath = `${workbookPath.split("/").slice(0, -1).join("/")}/styles.xml`;
  rels.forEach((rel) => {
    if (/\/sharedStrings$/.test(rel.type)) sharedPath = resolvePath(workbookPath, rel.target);
    if (/\/styles$/.test(rel.type)) stylesPath = resolvePath(workbookPath, rel.target);
  });
  const sharedXml = await readZipText(bytes, entries, sharedPath);
  const sharedStrings = sharedXml ? parseSharedStrings(sharedXml) : [];
  const { customFormats, xfFormats } = parseStyles(await readZipText(bytes, entries, stylesPath));
  const formatCache = new Map<number, string>();
  const formatOf = (styleIndex: number) => {
    let code = formatCache.get(styleIndex);
    if (code === undefined) {
      code = formatCodeFor(xfFormats[styleIndex] ?? 0, customFormats);
      formatCache.set(styleIndex, code);
    }
    return code;
  };

  return {
    sheets,
    date1904,
    formatOf,
    async readSheet(index: number) {
      const info = sheets[index];
      if (!info) throw new XlsxError("That sheet does not exist.");
      if (!info.isWorksheet || !info.path) throw new XlsxError(`"${info.name}" is a chart or dialog sheet and has no cells to convert.`);
      const xml = await readZipText(bytes, entries, info.path);
      if (xml === null) throw new XlsxError(`The data for sheet "${info.name}" is missing from the file.`);
      return parseSheet(xml, info.name, sharedStrings);
    },
  };
}

// ---- Converting cells ----

export interface TextOptions {
  /** "shown": as Excel displays it (formats applied); "raw": full-precision numbers, no formatting. */
  values: "shown" | "raw";
  /** "iso": 2026-10-29 / 2026-10-29 14:05:00; "shown": the date as formatted in the workbook. */
  dates: "iso" | "shown";
}

type StyleKind = "general" | "date" | "elapsed" | "text" | "code" | "number";
const styleCache = new WeakMap<object, Map<number, { code: string; kind: StyleKind }>>();

/**
 * Formats for fixed-length codes, such as 00000 for ZIP codes or 000-000-0000
 * for phone numbers: two or more required digits, no decimals, percent,
 * exponent or thousands separators.
 */
function isCodeFormat(code: string): boolean {
  const first = code.split(";")[0].replace(/"[^"]*"/g, "").replace(/\\./g, "").replace(/\[[^\]]*\]/g, "");
  return (first.match(/0/g) ?? []).length >= 2 && !/[.%Ee,#?]/.test(first);
}

/** The number format and its kind for a style index, cached per workbook. */
function styleInfo(wb: Pick<Workbook, "formatOf">, styleIndex: number): { code: string; kind: StyleKind } {
  let cache = styleCache.get(wb.formatOf);
  if (!cache) {
    cache = new Map();
    styleCache.set(wb.formatOf, cache);
  }
  let info = cache.get(styleIndex);
  if (!info) {
    const code = wb.formatOf(styleIndex);
    const kind: StyleKind = /^general$/i.test(code.trim())
      ? "general"
      : isDateFormat(code)
        ? isElapsedFormat(code)
          ? "elapsed"
          : "date"
        : code.includes("@") && !/[0#?]/.test(code.replace(/"[^"]*"/g, ""))
          ? "text"
          : isCodeFormat(code)
            ? "code"
            : "number";
    info = { code, kind };
    cache.set(styleIndex, info);
  }
  return info;
}

/** A cell as text for CSV. */
export function cellText(cell: Cell | undefined, wb: Pick<Workbook, "formatOf" | "date1904">, options: TextOptions): string {
  if (!cell) return "";
  switch (cell.t) {
    case "s": {
      if (options.values === "raw") return cell.v;
      const info = styleInfo(wb, cell.s);
      return info.kind === "text" || info.code.includes("@") ? formatText(cell.v, info.code) : cell.v;
    }
    case "b":
      return cell.v ? "TRUE" : "FALSE";
    case "e":
    case "d":
      return cell.v;
    case "n": {
      const info = styleInfo(wb, cell.s);
      switch (info.kind) {
        case "general":
          return options.values === "raw" ? rawNumber(cell.v) : formatGeneral(cell.v);
        case "elapsed":
          return formatNumber(cell.v, info.code, wb.date1904);
        case "date":
          return options.dates === "iso" ? serialToISO(cell.v, info.code, wb.date1904) : formatNumber(cell.v, info.code, wb.date1904);
        default:
          return options.values === "raw" ? rawNumber(cell.v) : formatNumber(cell.v, info.code, wb.date1904);
      }
    }
  }
}

/** Full-precision number text without exponent notation for ordinary magnitudes. */
export function rawNumber(n: number): string {
  if (!Number.isFinite(n)) return formatGeneral(n);
  const s = String(n);
  if (!/e/i.test(s)) return s;
  return Math.abs(n) < 1e21 && Math.abs(n) >= 1e-6 ? n.toFixed(20).replace(/\.?0+$/, "") : s.toUpperCase();
}

/** The sheet as rows of text, with every row padded to the same number of columns. */
export function sheetToText(sheet: Sheet, wb: Pick<Workbook, "formatOf" | "date1904">, options: TextOptions): string[][] {
  return sheet.rows.map((row) => {
    const out = new Array<string>(sheet.columnCount);
    for (let c = 0; c < sheet.columnCount; c++) out[c] = cellText(row[c], wb, options);
    return out;
  });
}

export type JSONCellValue = string | number | boolean | null;

export interface JSONOptions {
  /** "typed": numbers, true/false and ISO dates; "shown": every value as the text Excel shows. */
  values: "typed" | "shown";
  dates: "iso" | "shown";
}

/**
 * A cell as a JSON value. In typed mode, numbers stay numbers unless their
 * format is a fixed-length code (ZIP codes, IDs, phone numbers), which is kept
 * as the shown text so the zeros are not lost.
 */
export function cellJSON(cell: Cell | undefined, wb: Pick<Workbook, "formatOf" | "date1904">, options: JSONOptions): JSONCellValue {
  if (!cell) return null;
  if (options.values === "shown") return cellText(cell, wb, { values: "shown", dates: options.dates });
  switch (cell.t) {
    case "s":
    case "e":
    case "d":
      return cell.v;
    case "b":
      return cell.v;
    case "n": {
      const info = styleInfo(wb, cell.s);
      if (info.kind === "date" || info.kind === "elapsed") return cellText(cell, wb, { values: "shown", dates: options.dates });
      // Codes such as ZIP codes stay text, so every value in the column has the same type and keeps its zeros.
      if (info.kind === "code") return formatNumber(cell.v, info.code, wb.date1904);
      return cell.v;
    }
  }
}
