"use client";

import React, { useId, useMemo, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Download, X } from "lucide-react";
import Papa from "papaparse";
import { detectDelimiter, isFormulaRisk, neutralizeFormulaCells, parseCSVRows, withExcelBOM } from "@/lib/csv-utils";
import { buildViewerTable } from "@/lib/csv-viewer";
import { findDuplicateRows } from "@/lib/csv-dedupe";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { DataPreviewTable } from "@/components/DataPreviewTable";
import {
  CSVFileInput,
  DELIMITER_NAMES,
  DELIMITER_OPTIONS,
  buttonClass,
  downloadBlob,
  fieldClass,
  fileStem,
  primaryButtonClass,
  type LoadedFile,
} from "@/components/tools/csv-ui";

const SAMPLE_CSV = [
  "customer_id,name,email,city",
  "1001,Ayesha Khan,ayesha.khan@example.com,Lahore",
  "1002,Liam O'Brien,liam@example.com,Cork",
  "1003,Sofia Rossi,sofia.rossi@example.com,Milan",
  "1001,Ayesha Khan,ayesha.khan@example.com,Lahore",
  "1004,Chen Wei,,Shanghai",
  "1005,Liam O'Brien,Liam@Example.com ,Dublin",
  "1006,Amara Okafor,amara@example.com,Lagos",
  "1007,Lucas Martin,,Lyon",
  "1003,Sofia Rossi,sofia.rossi@example.com,Milan",
].join("\n");

const PREVIEW_ROWS = 100;

export function RemoveDuplicatesClient() {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [delimiterChoice, setDelimiterChoice] = useState("auto");
  const [hasHeader, setHasHeader] = useState(true);
  const [compare, setCompare] = useState<"all" | "columns">("all");
  const [selected, setSelected] = useState<number[]>([]);
  const [keep, setKeep] = useState<"first" | "last">("first");
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [trimSpaces, setTrimSpaces] = useState(true);
  const [keepEmpty, setKeepEmpty] = useState(true);
  const [formulaSafe, setFormulaSafe] = useState(true);
  const [view, setView] = useState<"kept" | "removed">("kept");
  const [, startTransition] = useTransition();
  const ids = useId();

  const parsed = useMemo(() => {
    if (!file) return null;
    const delimiter = delimiterChoice === "auto" ? detectDelimiter(file.text) : delimiterChoice;
    const result = parseCSVRows(file.text, delimiter);
    if (result.fatalError) {
      return { delimiter, error: result.fatalError.replace("Nothing was converted.", "Fix the file and open it again."), table: null };
    }
    if (result.rows.length === 0) return { delimiter, error: "The file has no rows.", table: null };
    return { delimiter, error: null, table: buildViewerTable(result.rows, hasHeader) };
  }, [file, delimiterChoice, hasHeader]);
  const table = parsed?.table ?? null;

  const needsColumns = compare === "columns" && selected.length === 0;

  const result = useMemo(() => {
    if (!table || needsColumns) return null;
    const columns = compare === "all" ? "all" : selected.filter((c) => c < table.headers.length);
    return findDuplicateRows(table.rows, { columns, keep, ignoreCase, trimSpaces, keepEmpty });
  }, [table, compare, selected, keep, ignoreCase, trimSpaces, keepEmpty, needsColumns]);

  const formulaCount = useMemo(() => {
    if (!table) return 0;
    let count = 0;
    for (const row of table.rows) for (const cell of row) if (isFormulaRisk(cell)) count++;
    return count;
  }, [table]);

  const load = (next: LoadedFile) =>
    startTransition(() => {
      setFile(next);
      setSelected([]);
      setView("kept");
    });

  const download = (indices: number[], suffix: string) => {
    if (!table || !parsed || !file) return;
    const body = indices.map((i) => table.rows[i]);
    const out = hasHeader ? [table.headers, ...body] : body;
    const csvText = Papa.unparse(neutralizeFormulaCells(out, formulaSafe).rows, { delimiter: parsed.delimiter });
    downloadBlob(new Blob([withExcelBOM(csvText)], { type: "text/csv;charset=utf-8;" }), `${fileStem(file.name)}-${suffix}.csv`);
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <CSVFileInput onLoad={load} sample={{ name: "sample-customers.csv", text: SAMPLE_CSV }} />
        </div>
      </div>
    );
  }

  const checkbox = "h-4 w-4 accent-brand-700";
  const label = "flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300";
  const total = table?.rows.length ?? 0;
  const shown = result ? (view === "kept" ? result.kept : result.removed) : [];
  const tab = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-semibold ${
      active
        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
    }`;

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-white" title={file.name}>
              {file.name}
            </p>
            {table && parsed && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {total.toLocaleString()} data {total === 1 ? "row" : "rows"} × {table.headers.length.toLocaleString()}{" "}
                {table.headers.length === 1 ? "column" : "columns"} ·{" "}
                {DELIMITER_NAMES[parsed.delimiter] ?? `"${parsed.delimiter}"`}-separated
              </p>
            )}
          </div>
          <button type="button" onClick={() => setFile(null)} className={buttonClass}>
            <X aria-hidden="true" className="h-4 w-4" />
            Open another file
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">Separator</span>
            <select value={delimiterChoice} onChange={(e) => setDelimiterChoice(e.target.value)} className={fieldClass}>
              {DELIMITER_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className={checkbox} />
            First row is the header
          </label>
        </div>

        {parsed?.error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{parsed.error}</p>
          </div>
        )}
        {file.notice && (
          <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            {file.notice}
          </p>
        )}

        {table && (
          <div className="grid gap-5 border-t border-slate-200 pt-5 md:grid-cols-2 dark:border-slate-800">
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Rows are duplicates when</legend>
              <label className={label}>
                <input type="radio" name={`${ids}-compare`} checked={compare === "all"} onChange={() => setCompare("all")} className={checkbox} />
                Every column matches
              </label>
              <label className={label}>
                <input
                  type="radio"
                  name={`${ids}-compare`}
                  checked={compare === "columns"}
                  onChange={() => setCompare("columns")}
                  className={checkbox}
                />
                The selected columns match
              </label>
              {compare === "columns" && (
                <div
                  role="group"
                  aria-label="Columns to compare"
                  className="ml-6 flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                >
                  {table.headers.map((h, c) => {
                    const on = selected.includes(c);
                    return (
                      <label
                        key={c}
                        className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-sm ${
                          on
                            ? "border-brand-600 bg-brand-50 text-brand-900 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-100"
                            : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setSelected((cur) => (on ? cur.filter((x) => x !== c) : [...cur, c].sort((a, b) => a - b)))}
                          className={checkbox}
                        />
                        <span className="max-w-[12rem] truncate">{h}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <fieldset className="space-y-1">
              <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Options</legend>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">Keep the</span>
                <select value={keep} onChange={(e) => setKeep(e.target.value as "first" | "last")} className={fieldClass}>
                  <option value="first">first occurrence</option>
                  <option value="last">last occurrence</option>
                </select>
              </label>
              <label className={label}>
                <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} className={checkbox} />
                Ignore upper and lower case
              </label>
              <label className={label}>
                <input type="checkbox" checked={trimSpaces} onChange={(e) => setTrimSpaces(e.target.checked)} className={checkbox} />
                Ignore spaces before and after values
              </label>
              <label className={label}>
                <input type="checkbox" checked={keepEmpty} onChange={(e) => setKeepEmpty(e.target.checked)} className={checkbox} />
                Keep rows where the compared values are empty
              </label>
              <label className={label}>
                <input type="checkbox" checked={formulaSafe} onChange={(e) => setFormulaSafe(e.target.checked)} className={checkbox} />
                Spreadsheet-safe output
              </label>
            </fieldset>
          </div>
        )}

        {needsColumns && (
          <p className="text-sm text-slate-600 dark:text-slate-400">Select at least one column to compare.</p>
        )}

        {result && (
          <section aria-labelledby={`${ids}-result`} className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${ids}-result`} aria-live="polite" className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                {result.removed.length === 0 ? (
                  <>
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-700 dark:text-brand-400" />
                    No duplicate rows found
                  </>
                ) : (
                  <>
                    {result.removed.length.toLocaleString()} duplicate {result.removed.length === 1 ? "row" : "rows"} removed ·{" "}
                    {result.kept.length.toLocaleString()} kept
                  </>
                )}
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.removed.length > 0 && (
                  <button type="button" onClick={() => download(result.removed, "duplicates")} className={buttonClass}>
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Removed rows
                  </button>
                )}
                <button type="button" onClick={() => download(result.kept, "deduplicated")} className={primaryButtonClass}>
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download cleaned CSV
                </button>
              </div>
            </div>
            {result.duplicateGroups > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {result.duplicateGroups.toLocaleString()} {result.duplicateGroups === 1 ? "value appears" : "values appear"} more
                than once. The {keep} row of each is kept, and the rows stay in their original order.
              </p>
            )}
            {formulaCount > 0 && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                {formulaCount.toLocaleString()} cell(s) start with =, +, -, @, a tab or a carriage return.{" "}
                {formulaSafe
                  ? "Spreadsheet-safe output adds an apostrophe so spreadsheet apps show them as text."
                  : "They are written unchanged and could run as formulas in a spreadsheet app."}
              </p>
            )}
            {result.removed.length > 0 && (
              <div role="group" aria-label="Rows to preview" className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                <button type="button" aria-pressed={view === "kept"} onClick={() => setView("kept")} className={tab(view === "kept")}>
                  Kept rows
                </button>
                <button type="button" aria-pressed={view === "removed"} onClick={() => setView("removed")} className={tab(view === "removed")}>
                  Removed rows
                </button>
              </div>
            )}
            <DataPreviewTable
              headers={table!.headers}
              rows={shown.slice(0, PREVIEW_ROWS).map((i) => table!.rows[i])}
              totalRowCount={shown.length}
            />
          </section>
        )}
      </div>
    </div>
  );
}
