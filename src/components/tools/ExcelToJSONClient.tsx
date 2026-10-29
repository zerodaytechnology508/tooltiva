"use client";

import React, { useEffect, useId, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { sheetToJSONValue, type SheetJSONOptions } from "@/lib/excel-json";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { buttonClass, downloadBlob, primaryButtonClass } from "@/components/tools/csv-ui";
import { ExcelFileInput, SelectField, WorkbookHeader, formatBytes, outputName, sampleWorkbook, useExcelWorkbook } from "@/components/tools/excel-ui";

const PREVIEW_CHARS = 20000;

export function ExcelToJSONClient() {
  const { opened, sheet, sheetIndex, error, busy, openFile, openBytes, selectSheet, reset } = useExcelWorkbook();
  const [header, setHeader] = useState(true);
  const [shape, setShape] = useState<SheetJSONOptions["shape"]>("objects");
  const [values, setValues] = useState<SheetJSONOptions["values"]>("typed");
  const [dates, setDates] = useState<SheetJSONOptions["dates"]>("iso");
  const [empty, setEmpty] = useState<SheetJSONOptions["empty"]>("null");
  const [indent, setIndent] = useState(2);
  const [scope, setScope] = useState<"sheet" | "all">("sheet");
  const [json, setJson] = useState<string>("");
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const ids = useId();

  // Build the JSON whenever the sheet or an option changes. "All sheets" reads every worksheet.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!opened || !sheet) {
        setJson("");
        return;
      }
      const options: SheetJSONOptions = { header, shape, values, dates, empty };
      if (scope === "sheet") {
        const value = sheetToJSONValue(sheet, opened.workbook, options);
        if (!cancelled) {
          setCount(value.length);
          setJson(JSON.stringify(value, null, indent || undefined));
        }
        return;
      }
      const all: Record<string, unknown[]> = {};
      let total = 0;
      for (let i = 0; i < opened.workbook.sheets.length; i++) {
        const info = opened.workbook.sheets[i];
        if (!info.isWorksheet) continue;
        const value = sheetToJSONValue(i === sheetIndex ? sheet : await opened.workbook.readSheet(i), opened.workbook, options);
        all[info.name] = value;
        total += value.length;
      }
      if (!cancelled) {
        setCount(total);
        setJson(JSON.stringify(all, null, indent || undefined));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opened, sheet, sheetIndex, header, shape, values, dates, empty, indent, scope]);

  const worksheetCount = opened ? opened.workbook.sheets.filter((s) => s.isWorksheet).length : 0;

  const download = () => {
    if (!opened || !sheet) return;
    const name = outputName(opened.name, scope === "sheet" && worksheetCount > 1 ? sheet.name : null, "json");
    downloadBlob(new Blob([json], { type: "application/json;charset=utf-8" }), name);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
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

  const unit = shape === "objects" ? (count === 1 ? "object" : "objects") : count === 1 ? "row" : "rows";

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <WorkbookHeader opened={opened} sheet={sheet} sheetIndex={sheetIndex} onSelect={(i) => selectSheet(opened.workbook, i)} onReset={reset} busy={busy} />

        <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
          <SelectField label="JSON shape" value={shape} onChange={(v) => setShape(v as SheetJSONOptions["shape"])}>
            <option value="objects">Array of objects (one per row)</option>
            <option value="arrays">Array of arrays (rows of values)</option>
          </SelectField>
          <SelectField label="Values" value={values} onChange={(v) => setValues(v as SheetJSONOptions["values"])}>
            <option value="typed">Numbers, true/false and dates as JSON values</option>
            <option value="shown">Text exactly as shown in Excel</option>
          </SelectField>
          <SelectField label="Dates" value={dates} onChange={(v) => setDates(v as SheetJSONOptions["dates"])}>
            <option value="iso">ISO, year first (2024-01-31)</option>
            <option value="shown">As formatted in the workbook</option>
          </SelectField>
          <SelectField label="Empty cells" value={empty} disabled={shape === "arrays"} onChange={(v) => setEmpty(v as SheetJSONOptions["empty"])}>
            <option value="null">Write null</option>
            <option value="omit">Leave the key out</option>
          </SelectField>
          <SelectField label="Format" value={indent} onChange={(v) => setIndent(Number(v))}>
            <option value={2}>Indented (2 spaces)</option>
            <option value={4}>Indented (4 spaces)</option>
            <option value={0}>Minified (one line)</option>
          </SelectField>
          <div className="flex flex-col gap-2 self-end">
            <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={header} disabled={shape === "arrays"} onChange={(e) => setHeader(e.target.checked)} className="h-4 w-4 accent-brand-700" />
              First row is the header (keys)
            </label>
            {worksheetCount > 1 && (
              <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={scope === "all"} onChange={(e) => setScope(e.target.checked ? "all" : "sheet")} className="h-4 w-4 accent-brand-700" />
                All {worksheetCount} sheets in one file, keyed by sheet name
              </label>
            )}
          </div>
        </div>

        {sheet && (
          <section aria-labelledby={`${ids}-result`} className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${ids}-result`} aria-live="polite" className="text-base font-semibold text-slate-900 dark:text-white">
                {scope === "all" ? "All sheets" : sheet.name}: {count.toLocaleString()} {unit} · {formatBytes(new TextEncoder().encode(json).length)}
              </h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copy} disabled={!json} className={buttonClass}>
                  {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
                <button type="button" onClick={download} disabled={!json} className={primaryButtonClass}>
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download .json
                </button>
              </div>
            </div>
            <pre
              tabIndex={0}
              aria-label="JSON output"
              className="max-h-[32rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {json.length > PREVIEW_CHARS ? `${json.slice(0, PREVIEW_CHARS)}\n…` : json}
            </pre>
            {json.length > PREVIEW_CHARS && (
              <p className="text-sm text-slate-600 dark:text-slate-400">The preview shows the start of the JSON. Copy or download it to get all of it.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
