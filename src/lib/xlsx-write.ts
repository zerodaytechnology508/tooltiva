/**
 * Write a minimal, valid .xlsx workbook without a library: strings are stored
 * inline, numbers and dates get number formats, and the package is zipped with
 * the shared ZIP writer. Opens in Excel, Google Sheets, Numbers and LibreOffice.
 */
import { createZip } from "./zip";
import { columnLetters } from "./xlsx-read";

export type WriteCell =
  | string
  | number
  | boolean
  | null
  | undefined
  /** A number shown with an Excel number format, e.g. { value: 2134, format: "00000" }. */
  | { value: number; format: string }
  /** A formula with its calculated value, so readers that do not recalculate still see the result. */
  | { formula: string; value: number | string; format?: string };

export interface WriteSheet {
  name: string;
  rows: WriteCell[][];
  /** Column widths in characters. */
  widths?: number[];
}

const BUILTIN_IDS: Record<string, number> = {
  General: 0, "0": 1, "0.00": 2, "#,##0": 3, "#,##0.00": 4, "0%": 9, "0.00%": 10, "0.00E+00": 11,
  "m/d/yyyy": 14, "d-mmm-yy": 15, "d-mmm": 16, "mmm-yy": 17, "h:mm AM/PM": 18, "h:mm:ss AM/PM": 19,
  "h:mm": 20, "h:mm:ss": 21, "m/d/yyyy h:mm": 22, "@": 49,
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Characters XML 1.0 cannot carry are written with Excel's _xHHHH_ escape.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, (c) => `_x${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}_`);
}

/** Excel limits sheet names to 31 characters without : \ / ? * [ ]. */
export function safeSheetName(name: string, taken: Set<string>): string {
  const base = name.replace(/[:\\/?*[\]]/g, " ").replace(/\s{2,}/g, " ").replace(/^'+|'+$/g, "").trim().slice(0, 31) || "Sheet";
  let candidate = base;
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
    const suffix = ` (${n})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  taken.add(candidate.toLowerCase());
  return candidate;
}

/** Build the workbook as .xlsx bytes. */
export function createXlsx(sheets: WriteSheet[]): Uint8Array {
  const formats: string[] = []; // custom format codes, ids from 164
  const xfs: number[] = [0]; // numFmtId per cellXfs entry; index 0 is the default style
  const styleFor = (format: string | undefined): number => {
    if (!format || format === "General") return 0;
    let id = BUILTIN_IDS[format];
    if (id === undefined) {
      let i = formats.indexOf(format);
      if (i < 0) i = formats.push(format) - 1;
      id = 164 + i;
    }
    let s = xfs.indexOf(id);
    if (s < 0) s = xfs.push(id) - 1;
    return s;
  };

  const taken = new Set<string>();
  const names = sheets.map((s) => safeSheetName(s.name, taken));
  const sheetXml = sheets.map((sheet) => {
    const rowsXml: string[] = [];
    sheet.rows.forEach((row, r) => {
      const cells: string[] = [];
      row.forEach((cell, c) => {
        if (cell === null || cell === undefined || cell === "") return;
        const ref = `${columnLetters(c)}${r + 1}`;
        if (typeof cell === "string") {
          const space = /^\s|\s$|\n/.test(cell) ? ' xml:space="preserve"' : "";
          cells.push(`<c r="${ref}" t="inlineStr"><is><t${space}>${escapeXml(cell)}</t></is></c>`);
        } else if (typeof cell === "number") {
          if (Number.isFinite(cell)) cells.push(`<c r="${ref}"><v>${cell}</v></c>`);
        } else if (typeof cell === "boolean") {
          cells.push(`<c r="${ref}" t="b"><v>${cell ? 1 : 0}</v></c>`);
        } else if ("formula" in cell) {
          const s = styleFor(cell.format);
          const style = s ? ` s="${s}"` : "";
          const f = `<f>${escapeXml(cell.formula.replace(/^=/, ""))}</f>`;
          if (typeof cell.value === "number") cells.push(`<c r="${ref}"${style}>${f}<v>${cell.value}</v></c>`);
          else cells.push(`<c r="${ref}"${style} t="str">${f}<v>${escapeXml(cell.value)}</v></c>`);
        } else {
          const s = styleFor(cell.format);
          cells.push(`<c r="${ref}"${s ? ` s="${s}"` : ""}><v>${cell.value}</v></c>`);
        }
      });
      if (cells.length) rowsXml.push(`<row r="${r + 1}">${cells.join("")}</row>`);
    });
    const cols = sheet.widths?.length
      ? `<cols>${sheet.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
      : "";
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      `${cols}<sheetData>${rowsXml.join("")}</sheetData></worksheet>`
    );
  });

  const styles =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    (formats.length
      ? `<numFmts count="${formats.length}">${formats.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${escapeXml(f)}"/>`).join("")}</numFmts>`
      : "") +
    '<fonts count="1"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    `<cellXfs count="${xfs.length}">${xfs
      .map((id) => `<xf numFmtId="${id}" fontId="0" fillId="0" borderId="0" xfId="0"${id ? ' applyNumberFormat="1"' : ""}/>`)
      .join("")}</cellXfs>` +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    "</styleSheet>";

  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets>${names.map((n, i) => `<sheet name="${escapeXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`;

  const workbookRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    names.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
    `<Relationship Id="rId${names.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    "</Relationships>";

  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    "</Relationships>";

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    names.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    "</Types>";

  const enc = new TextEncoder();
  return createZip([
    { name: "[Content_Types].xml", data: enc.encode(contentTypes) },
    { name: "_rels/.rels", data: enc.encode(rootRels) },
    { name: "xl/workbook.xml", data: enc.encode(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: enc.encode(workbookRels) },
    { name: "xl/styles.xml", data: enc.encode(styles) },
    ...sheetXml.map((xml, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: enc.encode(xml) })),
  ]);
}

/** Excel date serial (1900 system) for a calendar date and optional time, in UTC. */
export function dateToSerial(year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0): number {
  const days = (Date.UTC(year, month - 1, day) - Date.UTC(1899, 11, 30)) / 86400000;
  return days + (hours * 3600 + minutes * 60 + seconds) / 86400;
}
