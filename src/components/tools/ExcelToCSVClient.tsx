"use client";

import React, { useId, useMemo, useState } from "react";
import Papa from "papaparse";
import { Check, Copy, Download, FileArchive } from "lucide-react";
import { withExcelBOM } from "@/lib/csv-utils";
import { columnLetters, sheetToText, type TextOptions } from "@/lib/xlsx-read";
import { createZip } from "@/lib/zip";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { DataPreviewTable } from "@/components/DataPreviewTable";
import { buttonClass, downloadBlob, primaryButtonClass } from "@/components/tools/csv-ui";
import { ExcelFileInput, SelectField, WorkbookHeader, outputName, sampleWorkbook, useExcelWorkbook } from "@/components/tools/excel-ui";

const SEPARATORS = [
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe (|)" },
];
const PREVIEW_ROWS = 100;

export function ExcelToCSVClient() {
  const { opened, sheet, sheetIndex, error, busy, openFile, openBytes, selectSheet, reset } = useExcelWorkbook();
  const [separator, setSeparator] = useState(",");
  const [values, setValues] = useState<TextOptions["values"]>("shown");
  const [dates, setDates] = useState<TextOptions["dates"]>("iso");
  const [bom, setBom] = useState(true);
  const [copied, setCopied] = useState(false);
  const [zipping, setZipping] = useState(false);
  const ids = useId();

  const options: TextOptions = { values, dates };
  const table = useMemo(
    () => (opened && sheet ? sheetToText(sheet, opened.workbook, { values, dates }) : null),
    [opened, sheet, values, dates]
  );
  const toCSV = (rows: string[][]) => {
    const text = Papa.unparse(rows, { delimiter: separator, newline: "\r\n" });
    return bom ? withExcelBOM(text) : text;
  };

  const worksheetCount = opened ? opened.workbook.sheets.filter((s) => s.isWorksheet).length : 0;

  const download = () => {
    if (!opened || !sheet || !table) return;
    const name = outputName(opened.name, worksheetCount > 1 ? sheet.name : null, separator === "\t" ? "tsv" : "csv");
    downloadBlob(new Blob([toCSV(table)], { type: "text/csv;charset=utf-8" }), name);
  };

  const copy = async () => {
    if (!table) return;
    try {
      await navigator.clipboard.writeText(Papa.unparse(table, { delimiter: separator, newline: "\r\n" }));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const downloadAll = async () => {
    if (!opened) return;
    setZipping(true);
    try {
      const enc = new TextEncoder();
      const used = new Set<string>();
      const entries = [];
      for (let i = 0; i < opened.workbook.sheets.length; i++) {
        const info = opened.workbook.sheets[i];
        if (!info.isWorksheet) continue;
        const s = await opened.workbook.readSheet(i);
        let name = outputName(info.name, null, separator === "\t" ? "tsv" : "csv");
        for (let n = 2; used.has(name.toLowerCase()); n++) name = name.replace(/(\.\w+)$/, ` (${n})$1`);
        used.add(name.toLowerCase());
        entries.push({ name, data: enc.encode(toCSV(sheetToText(s, opened.workbook, options))) });
      }
      const zip = createZip(entries);
      downloadBlob(new Blob([zip as BlobPart], { type: "application/zip" }), outputName(opened.name, null, "zip"));
    } finally {
      setZipping(false);
    }
  };

  if (!opened) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <ExcelFileInput onFile={openFile} onSample={() => openBytes("sample-customers.xlsx", sampleWorkbook())} error={error} busy={busy} />
        </div>
      </div>
    );
  }

  const headers = table && table.length ? Array.from({ length: sheet?.columnCount ?? 0 }, (_, i) => columnLetters(i)) : [];

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <WorkbookHeader opened={opened} sheet={sheet} sheetIndex={sheetIndex} onSelect={(i) => selectSheet(opened.workbook, i)} onReset={reset} busy={busy} />

        <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
          <SelectField label="Separator" value={separator} onChange={(v) => setSeparator(v)}>
            {SEPARATORS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </SelectField>
          <SelectField label="Numbers" value={values} onChange={(v) => setValues(v as TextOptions["values"])}>
            <option value="shown">As shown in Excel (02134, 1,250.50, 10%)</option>
            <option value="raw">Unformatted, full precision (2134, 1250.5, 0.1)</option>
          </SelectField>
          <SelectField label="Dates" value={dates} onChange={(v) => setDates(v as TextOptions["dates"])}>
            <option value="iso">ISO, year first (2024-01-31)</option>
            <option value="shown">As formatted in the workbook</option>
          </SelectField>
          <label className="flex min-h-10 items-center gap-2 self-end text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={bom} onChange={(e) => setBom(e.target.checked)} className="h-4 w-4 accent-brand-700" />
            UTF-8 for Excel (keeps accents and non-English text)
          </label>
        </div>

        {sheet && table && (
          <section aria-labelledby={`${ids}-result`} className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${ids}-result`} aria-live="polite" className="text-base font-semibold text-slate-900 dark:text-white">
                {sheet.name}: {table.length.toLocaleString()} {table.length === 1 ? "row" : "rows"} · {sheet.columnCount} {sheet.columnCount === 1 ? "column" : "columns"}
              </h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copy} disabled={table.length === 0} className={buttonClass}>
                  {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                {worksheetCount > 1 && (
                  <button type="button" onClick={downloadAll} disabled={zipping} className={buttonClass}>
                    <FileArchive aria-hidden="true" className="h-4 w-4" />
                    {zipping ? "Preparing…" : `All ${worksheetCount} sheets (ZIP)`}
                  </button>
                )}
                <button type="button" onClick={download} disabled={table.length === 0} className={primaryButtonClass}>
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download CSV
                </button>
              </div>
            </div>
            {table.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">This sheet is empty. Choose another sheet.</p>
            ) : (
              <DataPreviewTable headers={headers} rows={table.slice(0, PREVIEW_ROWS)} totalRowCount={table.length} />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
