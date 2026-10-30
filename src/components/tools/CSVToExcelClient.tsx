"use client";

import React, { useId, useMemo, useState } from "react";
import { AlertCircle, Download, Plus, Trash2, X } from "lucide-react";
import { detectDelimiter, parseCSVRows } from "@/lib/csv-utils";
import { csvRowsToCells, excelLimitProblem, type ColumnKind } from "@/lib/csv-to-xlsx";
import { autoWidths, createXlsx } from "@/lib/xlsx-write";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { DataPreviewTable } from "@/components/DataPreviewTable";
import { CSVFileInput, DELIMITER_NAMES, buttonClass, downloadBlob, fileStem, primaryButtonClass, readCSVFiles, type LoadedFile } from "@/components/tools/csv-ui";
import { SelectField } from "@/components/tools/excel-ui";

const SAMPLE: LoadedFile = {
  name: "customers.csv",
  text: [
    "Customer ID,Name,Postcode,Phone,Joined,Balance,Discount",
    "00123,Ayesha Khan,54000,923001234567,2024-01-31,1250.50,10%",
    '00124,"Chen, Wei",02134,+92 300 7654321,2024-02-29,-30.00,0%',
    "00125,Liam O'Brien,00501,923211234567,2024-04-02,98765.43,12.5%",
    "00126,ہیرا ملک,75500,923451234567,2024-07-15,0.00,5%",
  ].join("\n"),
};

const KIND_LABEL: Record<ColumnKind, string> = {
  number: "Number",
  date: "Date",
  datetime: "Date and time",
  text: "Text, exactly as written",
};
const PREVIEW_ROWS = 100;
const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function CSVToExcelClient() {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [header, setHeader] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [dates, setDates] = useState(true);
  const [selected, setSelected] = useState(0);
  const [addError, setAddError] = useState<string | null>(null);
  const ids = useId();

  const add = (file: LoadedFile) => setFiles((current) => [...current, file]);

  const parsed = useMemo(
    () =>
      files.map((file) => {
        const delimiter = detectDelimiter(file.text);
        const result = parseCSVRows(file.text, delimiter);
        const columns = result.rows.reduce((n, r) => Math.max(n, r.length), 0);
        const error = result.fatalError
          ? result.fatalError.replace("Nothing was converted.", "This file is left out until it is fixed.")
          : result.rows.length === 0
            ? "This file is empty and is left out."
            : excelLimitProblem(result.rows.length, columns);
        return { file, delimiter, rows: result.rows, columns, error };
      }),
    [files]
  );
  const usable = parsed.filter((p) => !p.error);
  const current = parsed[Math.min(selected, parsed.length - 1)];
  const built = useMemo(
    () => (current && !current.error ? csvRowsToCells(current.rows, header, { numbers, dates }) : null),
    [current, header, numbers, dates]
  );

  const download = () => {
    if (usable.length === 0) return;
    const sheets = usable.map((p) => {
      const { rows } = csvRowsToCells(p.rows, header, { numbers, dates });
      return { name: fileStem(p.file.name), rows, header, widths: autoWidths(p.rows) };
    });
    const bytes = createXlsx(sheets);
    const name = usable.length === 1 ? `${fileStem(usable[0].file.name)}.xlsx` : "csv-files.xlsx";
    downloadBlob(new Blob([bytes as BlobPart], { type: XLSX_TYPE }), name);
  };

  if (files.length === 0) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <CSVFileInput onLoad={add} sample={SAMPLE} multiple />
        </div>
      </div>
    );
  }

  const headers = current ? Array.from({ length: current.columns }, (_, i) => (header && current.rows[0]?.[i]) || `Column ${i + 1}`) : [];

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {files.length} {files.length === 1 ? "file" : "files"}
              {files.length > 1 ? `, one sheet each` : ""}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Add more CSV files to put them on separate sheets of the same workbook.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className={`${buttonClass} cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-700`}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add CSV files
              <input
                type="file"
                multiple
                accept=".csv,.tsv,.txt,text/csv,text/plain"
                className="sr-only"
                onChange={async (e) => {
                  const picked = e.target.files ? Array.from(e.target.files) : [];
                  e.target.value = "";
                  const { loaded, errors } = await readCSVFiles(picked);
                  setAddError(errors.length ? errors.join(" ") : null);
                  loaded.forEach(add);
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setSelected(0);
              }}
              className={buttonClass}
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Start over
            </button>
          </div>
        </div>
        {addError && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
            {addError}
          </p>
        )}

        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {parsed.map((p, i) => (
            <li key={`${p.file.name}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-white" title={p.file.name}>
                  {p.file.name}
                </p>
                {p.error ? (
                  <p className="flex items-start gap-1.5 text-rose-700 dark:text-rose-300">
                    <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    {p.error}
                  </p>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400">
                    {p.rows.length.toLocaleString()} rows × {p.columns} columns · {DELIMITER_NAMES[p.delimiter] ?? "custom"}-separated
                    {p.file.notice ? ` · ${p.file.notice}` : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setFiles((list) => list.filter((_, j) => j !== i));
                  setSelected(0);
                }}
                className={buttonClass}
                aria-label={`Remove ${p.file.name}`}
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 dark:border-slate-800">
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} className="h-4 w-4 accent-brand-700" />
            First row is the header (bold, stays visible when scrolling, with filter buttons)
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={numbers} onChange={(e) => setNumbers(e.target.checked)} className="h-4 w-4 accent-brand-700" />
            Store plain number columns as numbers (codes with leading zeros and long IDs stay text)
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={dates} onChange={(e) => setDates(e.target.checked)} className="h-4 w-4 accent-brand-700" />
            Store ISO date columns (2024-01-31) as Excel dates
          </label>
        </div>

        {current && (
          <section aria-labelledby={`${ids}-preview`} className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <h2 id={`${ids}-preview`} className="text-base font-semibold text-slate-900 dark:text-white">
                  Columns in Excel
                </h2>
                {parsed.length > 1 && (
                  <SelectField label="File" inline value={selected} onChange={(v) => setSelected(Number(v))}>
                    {parsed.map((p, i) => (
                      <option key={i} value={i}>
                        {p.file.name}
                      </option>
                    ))}
                  </SelectField>
                )}
              </div>
              <button type="button" onClick={download} disabled={usable.length === 0} className={primaryButtonClass}>
                <Download aria-hidden="true" className="h-4 w-4" />
                Download Excel file
              </button>
            </div>
            {built && (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label="Column types">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-semibold">Column</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Stored as</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {built.kinds.map((kind, c) => (
                        <tr key={c}>
                          <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{headers[c]}</td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{KIND_LABEL[kind]}</td>
                          <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                            {current.rows.slice(header ? 1 : 0).find((r) => r[c])?.[c] ?? ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <DataPreviewTable headers={headers} rows={current.rows.slice(header ? 1 : 0, (header ? 1 : 0) + PREVIEW_ROWS)} totalRowCount={current.rows.length - (header ? 1 : 0)} />
              </>
            )}
            {current.error && <p className="text-sm text-rose-700 dark:text-rose-300">{current.error}</p>}
          </section>
        )}
      </div>
    </div>
  );
}
