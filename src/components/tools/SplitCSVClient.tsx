"use client";

import React, { useId, useMemo, useState, useTransition } from "react";
import { AlertCircle, Download, FileArchive, X } from "lucide-react";
import { detectDelimiter, isFormulaRisk, parseCSVRows, withExcelBOM } from "@/lib/csv-utils";
import { buildViewerTable } from "@/lib/csv-viewer";
import { MAX_PARTS, partToCSV, splitRows, type SplitMode, type SplitPart } from "@/lib/csv-split";
import { createZip } from "@/lib/zip";
import { PrivacyBadge } from "@/components/PrivacyBadge";
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

const REGIONS = ["North", "South", "East", "West"];
const SAMPLE_CSV = [
  "order_id,customer,region,product,amount",
  ...Array.from({ length: 24 }, (_, i) => {
    const products = ["USB-C Hub", "Wireless Mouse", "Laptop Stand", "Webcam 1080p", "Mechanical Keyboard", "Headset"];
    const names = ["Ayesha Khan", "Liam O'Brien", "Sofia Rossi", "Chen Wei", "Amara Okafor", "Lucas Martin", "Hira Malik", "Emma Johansson"];
    const customer = names[i % names.length];
    return `${2001 + i},${customer.includes("'") ? customer : `"${customer}"`},${REGIONS[(i * 7) % 4]},${products[i % products.length]},${(19.99 + ((i * 13) % 90)).toFixed(2)}`;
  }),
].join("\n");

type ModeKind = SplitMode["kind"];
const LIST_LIMIT = 200;

export function SplitCSVClient() {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [delimiterChoice, setDelimiterChoice] = useState("auto");
  const [hasHeader, setHasHeader] = useState(true);
  const [repeatHeader, setRepeatHeader] = useState(true);
  const [modeKind, setModeKind] = useState<ModeKind>("rows");
  const [rowsPerFile, setRowsPerFile] = useState("1000");
  const [fileCount, setFileCount] = useState("2");
  const [column, setColumn] = useState(0);
  const [formulaSafe, setFormulaSafe] = useState(true);
  const [zipping, setZipping] = useState(false);
  const [, startTransition] = useTransition();
  const ids = useId();

  const parsed = useMemo(() => {
    if (!file) return null;
    const delimiter = delimiterChoice === "auto" ? detectDelimiter(file.text) : delimiterChoice;
    const result = parseCSVRows(file.text, delimiter);
    if (result.fatalError) {
      return { delimiter, error: result.fatalError.replace("Nothing was converted.", "Fix the file and open it again."), table: null };
    }
    if (result.rows.length === 0) return { delimiter, error: "The file has no rows to split.", table: null };
    return { delimiter, error: null, table: buildViewerTable(result.rows, hasHeader) };
  }, [file, delimiterChoice, hasHeader]);
  const table = parsed?.table ?? null;

  const mode: SplitMode = useMemo(() => {
    if (modeKind === "rows") return { kind: "rows", rowsPerFile: Number(rowsPerFile) };
    if (modeKind === "files") return { kind: "files", fileCount: Number(fileCount) };
    return { kind: "column", column };
  }, [modeKind, rowsPerFile, fileCount, column]);

  const split = useMemo(
    () => (table && file ? splitRows(table.rows, mode, fileStem(file.name)) : null),
    [table, file, mode]
  );

  const header = table && hasHeader && repeatHeader ? table.headers : null;
  const formulaCount = useMemo(() => {
    if (!table) return 0;
    let count = 0;
    for (const row of table.rows) for (const cell of row) if (isFormulaRisk(cell)) count++;
    return count;
  }, [table]);

  const load = (next: LoadedFile) =>
    startTransition(() => {
      setFile(next);
      setColumn(0);
    });

  const csvBlobText = (part: SplitPart) =>
    withExcelBOM(partToCSV(part, header, { delimiter: parsed!.delimiter, formulaSafe }).csvText);

  const downloadPart = (part: SplitPart) =>
    downloadBlob(new Blob([csvBlobText(part)], { type: "text/csv;charset=utf-8;" }), part.name);

  const downloadZip = () => {
    if (!split || !file) return;
    setZipping(true);
    // Let the button show its busy state before the (synchronous) archive build.
    setTimeout(() => {
      try {
        const encoder = new TextEncoder();
        const zip = createZip(split.parts.map((part) => ({ name: part.name, data: encoder.encode(csvBlobText(part)) })));
        downloadBlob(new Blob([zip as BlobPart], { type: "application/zip" }), `${fileStem(file.name)}-split.zip`);
      } finally {
        setZipping(false);
      }
    }, 30);
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <CSVFileInput onLoad={load} sample={{ name: "sample-orders.csv", text: SAMPLE_CSV }} />
        </div>
      </div>
    );
  }

  const totalRows = table?.rows.length ?? 0;
  const delimiterName = parsed ? DELIMITER_NAMES[parsed.delimiter] ?? `"${parsed.delimiter}"` : "";
  const parts = split?.parts ?? [];
  const radio = "h-4 w-4 accent-brand-700";
  const optionRow = (kind: ModeKind) =>
    `flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
      modeKind === kind ? "border-brand-600 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-950/30" : "border-slate-200 dark:border-slate-800"
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
            {table && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {totalRows.toLocaleString()} data {totalRows === 1 ? "row" : "rows"} × {table.headers.length.toLocaleString()}{" "}
                {table.headers.length === 1 ? "column" : "columns"} · {delimiterName}-separated
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
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className={radio} />
            First row is the header
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hasHeader && repeatHeader}
              disabled={!hasHeader}
              onChange={(e) => setRepeatHeader(e.target.checked)}
              className={radio}
            />
            Repeat the header in every file
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={formulaSafe} onChange={(e) => setFormulaSafe(e.target.checked)} className={radio} />
            Spreadsheet-safe output
          </label>
        </div>

        {table && (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">How to split</legend>
            <div className={optionRow("rows")}>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                <input type="radio" name={`${ids}-mode`} checked={modeKind === "rows"} onChange={() => setModeKind("rows")} className={radio} />
                Every
              </label>
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                aria-label="Rows per file"
                value={rowsPerFile}
                onFocus={() => setModeKind("rows")}
                onChange={(e) => {
                  setModeKind("rows");
                  setRowsPerFile(e.target.value);
                }}
                className={`${fieldClass} w-32`}
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">rows per file</span>
            </div>
            <div className={optionRow("files")}>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                <input type="radio" name={`${ids}-mode`} checked={modeKind === "files"} onChange={() => setModeKind("files")} className={radio} />
                Into
              </label>
              <input
                type="number"
                min={2}
                step={1}
                inputMode="numeric"
                aria-label="Number of files"
                value={fileCount}
                onFocus={() => setModeKind("files")}
                onChange={(e) => {
                  setModeKind("files");
                  setFileCount(e.target.value);
                }}
                className={`${fieldClass} w-24`}
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">files of equal size</span>
            </div>
            <div className={optionRow("column")}>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                <input type="radio" name={`${ids}-mode`} checked={modeKind === "column"} onChange={() => setModeKind("column")} className={radio} />
                One file per value of
              </label>
              <select
                aria-label="Column to split by"
                value={column}
                onFocus={() => setModeKind("column")}
                onChange={(e) => {
                  setModeKind("column");
                  setColumn(Number(e.target.value));
                }}
                className={`${fieldClass} max-w-[16rem]`}
              >
                {table.headers.map((h, c) => (
                  <option key={c} value={c}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
        )}

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
        {split?.error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
            {split.error}
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

        {parts.length > 0 && (
          <section aria-labelledby={`${ids}-result`} className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${ids}-result`} className="text-base font-semibold text-slate-900 dark:text-white" aria-live="polite">
                {parts.length.toLocaleString()} {parts.length === 1 ? "file" : "files"} ·{" "}
                {totalRows.toLocaleString()} rows{header ? ", header in each file" : ""}
              </h2>
              <button type="button" onClick={downloadZip} disabled={zipping} className={primaryButtonClass}>
                <FileArchive aria-hidden="true" className="h-4 w-4" />
                {zipping ? "Preparing ZIP…" : "Download all (.zip)"}
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">File</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Rows</th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      <span className="sr-only">Download</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parts.slice(0, LIST_LIMIT).map((part) => (
                    <tr key={part.name} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="max-w-[22rem] truncate px-3 py-2 font-mono text-slate-900 dark:text-slate-100" title={part.name}>
                        {part.name}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {part.rows.length.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => downloadPart(part)}
                          aria-label={`Download ${part.name}`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-slate-800"
                        >
                          <Download aria-hidden="true" className="h-4 w-4" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parts.length > LIST_LIMIT && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing the first {LIST_LIMIT} files. The ZIP contains all {parts.length.toLocaleString()} (up to{" "}
                {MAX_PARTS.toLocaleString()} per split).
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
