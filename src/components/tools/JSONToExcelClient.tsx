"use client";

import React, { useId, useMemo, useState } from "react";
import { AlertCircle, Download, X } from "lucide-react";
import { jsonToSheets } from "@/lib/json-to-xlsx";
import { excelLimitProblem } from "@/lib/csv-to-xlsx";
import { autoWidths, createXlsx, type WriteCell } from "@/lib/xlsx-write";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { DataPreviewTable } from "@/components/DataPreviewTable";
import { CSVFileInput, buttonClass, downloadBlob, fileStem, primaryButtonClass, type LoadedFile } from "@/components/tools/csv-ui";
import { SelectField } from "@/components/tools/excel-ui";

const SAMPLE: LoadedFile = {
  name: "orders.json",
  text: JSON.stringify(
    [
      { orderId: "A-1001", customer: { name: "Ayesha Khan", city: "Lahore", postcode: "54000" }, items: 3, total: 29.97, paid: true, placed: "2024-01-31", tags: ["new", "web"] },
      { orderId: "A-1002", customer: { name: "Chen, Wei", city: "Karachi", postcode: "02134" }, items: 12, total: 54, paid: false, placed: "2024-02-29 14:05" },
      { orderId: "A-1003", customer: { name: "Liam O'Brien", city: "Islamabad" }, items: 1, total: 120.5, paid: true, placed: "2024-04-02", trackingNumber: "__BIG__" },
    ],
    null,
    2
    // A tracking number longer than JavaScript (and Excel) can hold exactly, written as raw JSON digits.
  ).replace('"__BIG__"', "123456789012345678901"),
};

const PREVIEW_ROWS = 100;
const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function cellText(cell: WriteCell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "object") {
    if ("formula" in cell) return String(cell.value);
    if (/^yyyy/.test(cell.format)) {
      // Show dates as the ISO text they came from.
      const ms = Math.round((cell.value - 25569) * 86400000);
      const iso = new Date(ms).toISOString().replace("T", " ");
      return cell.format.includes("ss") ? iso.slice(0, 19) : cell.format.includes("hh") ? iso.slice(0, 16) : iso.slice(0, 10);
    }
    return String(cell.value);
  }
  return typeof cell === "boolean" ? (cell ? "TRUE" : "FALSE") : String(cell);
}

export function JSONToExcelClient() {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [flatten, setFlatten] = useState(true);
  const [dates, setDates] = useState(true);
  const [sheetIndex, setSheetIndex] = useState(0);
  const ids = useId();

  const result = useMemo(() => (file ? jsonToSheets(file.text, { flatten, dates }) : null), [file, flatten, dates]);
  const limit = useMemo(() => {
    if (!result || !result.ok) return null;
    for (const s of result.sheets) {
      const problem = excelLimitProblem(s.rows.length, s.rows.reduce((n, r) => Math.max(n, r.length), 0));
      if (problem) return `${s.name}: ${problem}`;
    }
    return null;
  }, [result]);

  const download = () => {
    if (!file || !result || !result.ok || limit) return;
    const bytes = createXlsx(result.sheets.map((s) => ({ name: s.name, rows: s.rows, header: s.header, widths: autoWidths(s.rows.map((r) => r.map(cellText))) })));
    downloadBlob(new Blob([bytes as BlobPart], { type: XLSX_TYPE }), `${fileStem(file.name)}.xlsx`);
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <CSVFileInput
            onLoad={setFile}
            sample={SAMPLE}
            kind="JSON"
            accept=".json,.txt,application/json,text/plain"
            formatsHint=".json or .txt"
            pastePlaceholder={'[\n  { "name": "Ayesha", "city": "Lahore" },\n  { "name": "Chen", "city": "Karachi" }\n]'}
          />
        </div>
      </div>
    );
  }

  const sheet = result && result.ok ? result.sheets[Math.min(sheetIndex, result.sheets.length - 1)] : null;
  const width = sheet ? sheet.rows.reduce((n, r) => Math.max(n, r.length), 0) : 0;
  const textRows = sheet ? sheet.rows.map((r) => Array.from({ length: width }, (_, c) => cellText(r[c]))) : [];
  const headers = sheet ? (sheet.header ? textRows[0] ?? [] : Array.from({ length: width }, (_, i) => `Column ${i + 1}`)) : [];
  const body = sheet ? textRows.slice(sheet.header ? 1 : 0) : [];

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="min-w-0 truncate text-base font-semibold text-slate-900 dark:text-white" title={file.name}>
            {file.name}
          </p>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setSheetIndex(0);
            }}
            className={buttonClass}
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Open other JSON
          </button>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 dark:border-slate-800">
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} className="h-4 w-4 accent-brand-700" />
            Turn nested objects into columns (customer.city)
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={dates} onChange={(e) => setDates(e.target.checked)} className="h-4 w-4 accent-brand-700" />
            Store ISO dates (2024-01-31) as Excel dates
          </label>
        </div>

        {result && !result.ok && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{result.error}</p>
          </div>
        )}
        {limit && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
            {limit}
          </p>
        )}

        {result && result.ok && sheet && (
          <section aria-labelledby={`${ids}-result`} className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <h2 id={`${ids}-result`} aria-live="polite" className="text-base font-semibold text-slate-900 dark:text-white">
                  {result.sheets.length === 1
                    ? `${body.length.toLocaleString()} ${body.length === 1 ? "row" : "rows"} · ${width} ${width === 1 ? "column" : "columns"}`
                    : `${result.sheets.length} sheets`}
                </h2>
                {result.sheets.length > 1 && (
                  <SelectField label="Sheet" inline value={sheetIndex} onChange={(v) => setSheetIndex(Number(v))}>
                    {result.sheets.map((s, i) => (
                      <option key={i} value={i}>
                        {s.name}
                      </option>
                    ))}
                  </SelectField>
                )}
              </div>
              <button type="button" onClick={download} disabled={!!limit} className={primaryButtonClass}>
                <Download aria-hidden="true" className="h-4 w-4" />
                Download Excel file
              </button>
            </div>
            {result.notes.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
                {result.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            <DataPreviewTable headers={headers} rows={body.slice(0, PREVIEW_ROWS)} totalRowCount={body.length} />
          </section>
        )}
      </div>
    </div>
  );
}
