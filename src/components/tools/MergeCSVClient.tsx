"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Download, FilePlus2, Trash2, X } from "lucide-react";
import { detectDelimiter, isFormulaRisk, parseCSVRows, withExcelBOM } from "@/lib/csv-utils";
import { mergeCSVTables, mergedToCSV } from "@/lib/csv-merge";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { DataPreviewTable } from "@/components/DataPreviewTable";
import {
  CSV_ACCEPT,
  CSVFileInput,
  DELIMITER_NAMES,
  buttonClass,
  downloadBlob,
  fieldClass,
  primaryButtonClass,
  readCSVFiles,
  type LoadedFile,
} from "@/components/tools/csv-ui";

const SAMPLES: LoadedFile[] = [
  {
    name: "orders-january.csv",
    text: 'order_id,customer,city,amount\n1001,Ayesha Khan,Lahore,25.50\n1002,"O\'Brien, Liam",Cork,40.00\n1003,Sofia Rossi,Milan,12.75\n',
  },
  {
    name: "orders-february.csv",
    text: "Customer;Order_ID;Amount;City;Discount\nChen Wei;1004;99.90;Shanghai;10%\nAmara Okafor;1005;15.00;Lagos;\n",
  },
  {
    name: "orders-march.csv",
    text: "order_id\tcustomer\tamount\n1006\tLucas Martin\t60.00\n1007\tHira Malik\t8.25\n",
  },
];

const OUTPUT_DELIMITERS = [
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe (|)" },
];
const PREVIEW_ROWS = 100;

interface MergeFile extends LoadedFile {
  id: number;
}

/** "orders.csv", then "orders (2).csv", ... so each file has a distinct name. */
function distinctName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) return name;
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let n = 2; ; n++) {
    const candidate = `${stem} (${n})${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export function MergeCSVClient() {
  const [files, setFiles] = useState<MergeFile[]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [matchBy, setMatchBy] = useState<"name" | "position">("name");
  const [sourceColumn, setSourceColumn] = useState(false);
  const [outDelimiter, setOutDelimiter] = useState(",");
  const [formulaSafe, setFormulaSafe] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);
  const nextId = useRef(1);
  const addInput = useRef<HTMLInputElement>(null);
  const ids = useId();

  const addFile = (file: LoadedFile) =>
    setFiles((current) => {
      const name = distinctName(file.name, new Set(current.map((f) => f.name)));
      return [...current, { ...file, name, id: nextId.current++ }];
    });

  const addPicked = async (picked: File[]) => {
    const { loaded, errors } = await readCSVFiles(picked);
    setReadError(errors.length ? errors.join(" ") : null);
    loaded.forEach(addFile);
  };

  const move = (index: number, by: -1 | 1) =>
    setFiles((current) => {
      const next = current.slice();
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });

  const parsed = useMemo(
    () =>
      files.map((file) => {
        const delimiter = detectDelimiter(file.text);
        const result = parseCSVRows(file.text, delimiter);
        const error = result.fatalError
          ? result.fatalError.replace("Nothing was converted.", "This file is left out until it is fixed.")
          : result.rows.length === 0
            ? "This file is empty and is left out."
            : null;
        return { file, delimiter, rows: result.rows, error };
      }),
    [files]
  );
  const usable = useMemo(() => parsed.filter((p) => !p.error), [parsed]);

  const merged = useMemo(() => {
    if (usable.length === 0) return null;
    return mergeCSVTables(
      usable.map((p) => ({ name: p.file.name, rows: p.rows })),
      { hasHeader, matchBy: hasHeader ? matchBy : "position", sourceColumn }
    );
  }, [usable, hasHeader, matchBy, sourceColumn]);

  const formulaCount = useMemo(() => {
    if (!merged) return 0;
    let count = 0;
    for (const row of merged.rows) for (const cell of row) if (isFormulaRisk(cell)) count++;
    return count;
  }, [merged]);

  const download = () => {
    if (!merged) return;
    const { csvText } = mergedToCSV(merged, { delimiter: outDelimiter, formulaSafe, includeHeader: hasHeader });
    downloadBlob(new Blob([withExcelBOM(csvText)], { type: "text/csv;charset=utf-8;" }), "merged.csv");
  };

  if (files.length === 0) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <CSVFileInput multiple onLoad={addFile} sample={SAMPLES} />
        </div>
      </div>
    );
  }

  const checkbox = "h-4 w-4 accent-brand-700";
  const iconButton =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white";
  const differing = merged?.files.filter(
    (f) => f.newColumns.length > 0 || f.missingColumns.length > 0 || f.columnCountDiffers
  ) ?? [];

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <section aria-labelledby={`${ids}-files`} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id={`${ids}-files`} className="text-base font-semibold text-slate-900 dark:text-white">
              Files to merge, in order ({files.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addInput.current?.click()} className={buttonClass}>
                <FilePlus2 aria-hidden="true" className="h-4 w-4" />
                Add files
              </button>
              <button type="button" onClick={() => setFiles([])} className={buttonClass}>
                <X aria-hidden="true" className="h-4 w-4" />
                Clear all
              </button>
            </div>
            <input
              ref={addInput}
              type="file"
              multiple
              accept={CSV_ACCEPT}
              className="sr-only"
              aria-label="Add CSV files"
              tabIndex={-1}
              onChange={(e) => {
                const picked = e.target.files ? Array.from(e.target.files) : [];
                e.target.value = "";
                addPicked(picked);
              }}
            />
          </div>
          <ol className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {parsed.map(({ file, delimiter, rows, error }, index) => {
              const dataRows = Math.max(0, rows.length - (hasHeader ? 1 : 0));
              return (
                <li key={file.id} className="flex flex-wrap items-start gap-3 px-3 py-2.5">
                  <span className="mt-1 w-6 shrink-0 text-right text-sm tabular-nums text-slate-500 dark:text-slate-400">{index + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm text-slate-900 dark:text-slate-100" title={file.name}>
                      {file.name}
                    </p>
                    {error ? (
                      <p className="mt-0.5 text-sm text-rose-700 dark:text-rose-300">{error}</p>
                    ) : (
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                        {dataRows.toLocaleString()} {dataRows === 1 ? "row" : "rows"} · {(rows[0]?.length ?? 0).toLocaleString()}{" "}
                        columns · {DELIMITER_NAMES[delimiter] ?? `"${delimiter}"`}-separated
                      </p>
                    )}
                    {file.notice && <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300">{file.notice}</p>}
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${file.name} up`}
                      className={iconButton}
                    >
                      <ArrowUp aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === files.length - 1}
                      aria-label={`Move ${file.name} down`}
                      className={iconButton}
                    >
                      <ArrowDown aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiles((current) => current.filter((f) => f.id !== file.id))}
                      aria-label={`Remove ${file.name}`}
                      className={iconButton}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          {readError && (
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              {readError}
            </p>
          )}
          {usable.length === 1 && (
            <p className="text-sm text-slate-600 dark:text-slate-400">Add at least one more file to merge.</p>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className={checkbox} />
            Files have a header row
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">Match columns</span>
            <select
              value={hasHeader ? matchBy : "position"}
              disabled={!hasHeader}
              onChange={(e) => setMatchBy(e.target.value as "name" | "position")}
              className={fieldClass}
            >
              <option value="name">By column name</option>
              <option value="position">By position</option>
            </select>
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={sourceColumn} onChange={(e) => setSourceColumn(e.target.checked)} className={checkbox} />
            Add a column with the file name
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">Output separator</span>
            <select value={outDelimiter} onChange={(e) => setOutDelimiter(e.target.value)} className={fieldClass}>
              {OUTPUT_DELIMITERS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={formulaSafe} onChange={(e) => setFormulaSafe(e.target.checked)} className={checkbox} />
            Spreadsheet-safe output
          </label>
        </div>

        {merged && usable.length >= 2 && (
          <section aria-labelledby={`${ids}-result`} className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${ids}-result`} aria-live="polite" className="text-base font-semibold text-slate-900 dark:text-white">
                Merged: {merged.rows.length.toLocaleString()} rows × {merged.headers.length.toLocaleString()} columns from{" "}
                {usable.length} files
              </h2>
              <button type="button" onClick={download} className={primaryButtonClass}>
                <Download aria-hidden="true" className="h-4 w-4" />
                Download merged CSV
              </button>
            </div>

            {differing.length > 0 && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-100">
                <p className="font-semibold">The files do not all have the same columns:</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {differing.map((f) => (
                    <li key={f.name}>
                      <span className="font-mono">{f.name}</span>
                      {f.newColumns.length > 0 && <> adds {f.newColumns.map((c) => `“${c}”`).join(", ")}</>}
                      {f.newColumns.length > 0 && f.missingColumns.length > 0 && ";"}
                      {f.missingColumns.length > 0 && (
                        <> has no {f.missingColumns.map((c) => `“${c}”`).join(", ")} (left empty)</>
                      )}
                      {f.columnCountDiffers && (
                        <>
                          {" "}
                          has {f.columnCountDiffers.actual} columns instead of {f.columnCountDiffers.expected}. Check
                          that the columns are in the same order, or match them by name.
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {formulaCount > 0 && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                {formulaCount.toLocaleString()} cell(s) start with =, +, -, @, a tab or a carriage return.{" "}
                {formulaSafe
                  ? "Spreadsheet-safe output adds an apostrophe so spreadsheet apps show them as text."
                  : "They are written unchanged and could run as formulas in a spreadsheet app."}
              </p>
            )}

            <DataPreviewTable
              headers={merged.headers}
              rows={merged.rows.slice(0, PREVIEW_ROWS)}
              totalRowCount={merged.rows.length}
            />
          </section>
        )}

        {parsed.some((p) => p.error) && (
          <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            Files with a problem are listed above and left out of the merge.
          </p>
        )}
      </div>
    </div>
  );
}
