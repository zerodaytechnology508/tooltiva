"use client";

import React, { useEffect, useId, useMemo, useState, useTransition } from "react";
import { AlertCircle, ArrowLeftRight, CheckCircle2, Download, FileText, X } from "lucide-react";
import Papa from "papaparse";
import { detectDelimiter, neutralizeFormulaCells, parseCSVRows, withExcelBOM } from "@/lib/csv-utils";
import { buildViewerTable } from "@/lib/csv-viewer";
import {
  buildCellChangesCSV,
  buildReportCSV,
  compareCSV,
  matchColumns,
  rowValues,
  STATUS_LABELS,
  suggestKeyColumn,
  type CompareRow,
  type CompareTable,
  type RowMatching,
  type RowStatus,
} from "@/lib/csv-compare";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import {
  CSVFileInput,
  DELIMITER_NAMES,
  buttonClass,
  downloadBlob,
  fileStem,
  primaryButtonClass,
  type LoadedFile,
} from "@/components/tools/csv-ui";

const SAMPLE_OLD: LoadedFile = {
  name: "products-september.csv",
  text: [
    "sku,product,price,stock",
    "A100,Wireless Mouse,24.99,120",
    "A101,USB-C Cable 1m,9.99,300",
    "A102,Laptop Stand,39.00,45",
    "A103,HDMI Adapter,14.50,80",
    "A104,Webcam 1080p,49.99,25",
  ].join("\n"),
};
const SAMPLE_NEW: LoadedFile = {
  name: "products-october.csv",
  text: [
    "sku,product,price,stock,supplier",
    "A100,Wireless Mouse,24.99,95,Lahore Traders",
    "A101,USB-C Cable 1m,8.99,300,Lahore Traders",
    "A103,HDMI Adapter,14.5,80,Metro Supply",
    "A104,Webcam 1080p HD,49.99,25,Metro Supply",
    "A105,Mechanical Keyboard,69.00,40,Metro Supply",
  ].join("\n"),
};

const PREVIEW_ROWS = 300;

type Filter = "differences" | RowStatus | "all";

interface ParsedFile {
  delimiter: string;
  error: string | null;
  table: CompareTable | null;
}

function parseFile(file: LoadedFile | null, hasHeader: boolean): ParsedFile | null {
  if (!file) return null;
  const delimiter = detectDelimiter(file.text);
  const result = parseCSVRows(file.text, delimiter);
  if (result.fatalError) {
    return { delimiter, error: result.fatalError.replace("Nothing was converted.", "Fix the file and open it again."), table: null };
  }
  if (result.rows.length === 0) return { delimiter, error: "The file has no rows.", table: null };
  const table = buildViewerTable(result.rows, hasHeader);
  return { delimiter, error: null, table: { headers: table.headers, rows: table.rows } };
}

const STATUS_STYLES: Record<RowStatus, { row: string; badge: string }> = {
  same: { row: "", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  changed: {
    row: "bg-amber-50/60 dark:bg-amber-950/20",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100",
  },
  added: {
    row: "bg-emerald-50/70 dark:bg-emerald-950/25",
    badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100",
  },
  removed: {
    row: "bg-rose-50/70 dark:bg-rose-950/25",
    badge: "bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-100",
  },
};

function FileSlot({
  label,
  hint,
  file,
  parsed,
  onLoad,
  onClear,
  sample,
}: {
  label: string;
  hint: string;
  file: LoadedFile | null;
  parsed: ParsedFile | null;
  onLoad: (f: LoadedFile) => void;
  onClear: () => void;
  sample: LoadedFile[];
}) {
  return (
    <div className="min-w-0 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{label}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{hint}</p>
      </div>
      {!file ? (
        <CSVFileInput onLoad={onLoad} sample={sample} />
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <FileText aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white" title={file.name}>
                  {file.name}
                </p>
                {parsed?.table && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {parsed.table.rows.length.toLocaleString()} {parsed.table.rows.length === 1 ? "row" : "rows"} ×{" "}
                    {parsed.table.headers.length.toLocaleString()} {parsed.table.headers.length === 1 ? "column" : "columns"} ·{" "}
                    {DELIMITER_NAMES[parsed.delimiter] ?? `"${parsed.delimiter}"`}-separated
                  </p>
                )}
              </div>
            </div>
            <button type="button" onClick={onClear} className={buttonClass} aria-label={`Replace ${file.name}`}>
              <X aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Replace</span>
            </button>
          </div>
          {parsed?.error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-rose-800 dark:text-rose-300">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {parsed.error}
            </p>
          )}
          {file.notice && <p className="text-sm text-amber-900 dark:text-amber-200">{file.notice}</p>}
        </div>
      )}
    </div>
  );
}

export function CompareCSVClient() {
  const [fileA, setFileA] = useState<LoadedFile | null>(null);
  const [fileB, setFileB] = useState<LoadedFile | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [matching, setMatching] = useState<RowMatching>("key");
  const [keys, setKeys] = useState<number[]>([]);
  const [ignored, setIgnored] = useState<number[]>([]);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [trimSpaces, setTrimSpaces] = useState(true);
  const [numericEquality, setNumericEquality] = useState(false);
  const [formulaSafe, setFormulaSafe] = useState(true);
  const [filter, setFilter] = useState<Filter>("differences");
  const [, startTransition] = useTransition();
  const ids = useId();

  const parsedA = useMemo(() => parseFile(fileA, hasHeader), [fileA, hasHeader]);
  const parsedB = useMemo(() => parseFile(fileB, hasHeader), [fileB, hasHeader]);
  const tableA = parsedA?.table ?? null;
  const tableB = parsedB?.table ?? null;

  const columns = useMemo(
    () => (tableA && tableB ? matchColumns(tableA, tableB, hasHeader) : []),
    [tableA, tableB, hasHeader]
  );
  const shared = columns.map((c, i) => ({ c, i })).filter(({ c }) => c.a >= 0 && c.b >= 0);

  // When both files are open (or the header setting changes), suggest a key column.
  useEffect(() => {
    if (!tableA || !tableB) return;
    const cols = matchColumns(tableA, tableB, hasHeader);
    const suggestion = suggestKeyColumn(tableA, tableB, cols);
    setKeys(suggestion === null ? [] : [suggestion]);
    setMatching(suggestion === null ? "content" : "key");
    setIgnored([]);
    setFilter("differences");
  }, [tableA, tableB, hasHeader]);

  const needsKey = matching === "key" && keys.length === 0;

  const result = useMemo(() => {
    if (!tableA || !tableB || needsKey) return null;
    return compareCSV(tableA, tableB, {
      matchColumnsByName: hasHeader,
      rowMatching: matching,
      keyColumns: keys.filter((k) => k < columns.length),
      ignoredColumns: ignored,
      ignoreCase,
      trimSpaces,
      numericEquality,
    });
  }, [tableA, tableB, hasHeader, matching, keys, ignored, ignoreCase, trimSpaces, numericEquality, needsKey, columns.length]);

  const load = (slot: "a" | "b") => (f: LoadedFile) =>
    startTransition(() => {
      // "Load sample" loads both sample files into their own slots.
      if (f === SAMPLE_OLD) setFileA(f);
      else if (f === SAMPLE_NEW) setFileB(f);
      else (slot === "a" ? setFileA : setFileB)(f);
    });

  const swap = () =>
    startTransition(() => {
      setFileA(fileB);
      setFileB(fileA);
    });

  const visible: CompareRow[] = useMemo(() => {
    if (!result) return [];
    if (filter === "all") return result.rows;
    if (filter === "differences") return result.rows.filter((r) => r.status !== "same");
    return result.rows.filter((r) => r.status === filter);
  }, [result, filter]);

  const delimiter = parsedB?.delimiter ?? ",";
  const stemA = fileA ? fileStem(fileA.name) : "file1";
  const stemB = fileB ? fileStem(fileB.name) : "file2";

  const saveCSV = (text: string, name: string) =>
    downloadBlob(new Blob([withExcelBOM(text)], { type: "text/csv;charset=utf-8;" }), name);

  const downloadReport = () => {
    if (!result || !tableA || !tableB) return;
    saveCSV(buildReportCSV(tableA, tableB, result, { delimiter, formulaSafe, includeSame: false }), `${stemB}-vs-${stemA}-differences.csv`);
  };
  const downloadCellChanges = () => {
    if (!result || !tableA || !tableB) return;
    saveCSV(
      buildCellChangesCSV(tableA, tableB, result, { delimiter, formulaSafe, keyColumns: matching === "key" ? keys : [] }),
      `${stemB}-vs-${stemA}-changed-cells.csv`
    );
  };
  /** Added rows as they are in file 2, or removed rows as they are in file 1, with that file's header. */
  const downloadRows = (status: "added" | "removed") => {
    if (!result || !tableA || !tableB) return;
    const source = status === "added" ? tableB : tableA;
    const body = result.rows
      .filter((r) => r.status === status)
      .map((r) => source.rows[(status === "added" ? r.b : r.a)!]);
    const out = hasHeader ? [source.headers, ...body] : body;
    const text = Papa.unparse(neutralizeFormulaCells(out, formulaSafe).rows, {
      delimiter: (status === "added" ? parsedB : parsedA)?.delimiter ?? ",",
    });
    saveCSV(text, status === "added" ? `${stemB}-only-in-file-2.csv` : `${stemA}-only-in-file-1.csv`);
  };

  const checkbox = "h-4 w-4 accent-brand-700";
  const label = "flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300";
  const chip = (on: boolean) =>
    `flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-sm ${
      on
        ? "border-brand-600 bg-brand-50 text-brand-900 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-100"
        : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
    }`;
  const tab = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-semibold ${
      active
        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
    }`;

  const onlyA = columns.filter((c) => c.b < 0).map((c) => c.name);
  const onlyB = columns.filter((c) => c.a < 0).map((c) => c.name);
  const differences = result ? result.counts.changed + result.counts.added + result.counts.removed : 0;
  const changedSet = (row: CompareRow) => new Set(row.changed ?? []);

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 lg:grid-cols-2">
          <FileSlot
            label="File 1: original"
            hint="The older or reference version."
            file={fileA}
            parsed={parsedA}
            onLoad={load("a")}
            onClear={() => setFileA(null)}
            sample={[SAMPLE_OLD, SAMPLE_NEW]}
          />
          <FileSlot
            label="File 2: changed"
            hint="The newer version to compare against file 1."
            file={fileB}
            parsed={parsedB}
            onLoad={load("b")}
            onClear={() => setFileB(null)}
            sample={[SAMPLE_OLD, SAMPLE_NEW]}
          />
        </div>

        {(fileA || fileB) && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className={label}>
              <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className={checkbox} />
              First row is the header
            </label>
            {fileA && fileB && (
              <button type="button" onClick={swap} className={buttonClass}>
                <ArrowLeftRight aria-hidden="true" className="h-4 w-4" />
                Swap files
              </button>
            )}
          </div>
        )}

        {tableA && tableB && (
          <div className="grid gap-6 border-t border-slate-200 pt-5 md:grid-cols-2 dark:border-slate-800">
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Match rows by</legend>
              <label className={label}>
                <input type="radio" name={`${ids}-match`} checked={matching === "key"} onChange={() => setMatching("key")} className={checkbox} />
                A key column, such as an ID, email or SKU
              </label>
              {matching === "key" && (
                <div role="group" aria-label="Key columns" className="ml-6 flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                  {shared.map(({ c, i }) => {
                    const on = keys.includes(i);
                    return (
                      <label key={i} className={chip(on)}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setKeys((cur) => (on ? cur.filter((x) => x !== i) : [...cur, i]))}
                          className={checkbox}
                        />
                        <span className="max-w-[12rem] truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <label className={label}>
                <input
                  type="radio"
                  name={`${ids}-match`}
                  checked={matching === "content"}
                  onChange={() => setMatching("content")}
                  className={checkbox}
                />
                Whole rows, in any order
              </label>
              <label className={label}>
                <input
                  type="radio"
                  name={`${ids}-match`}
                  checked={matching === "position"}
                  onChange={() => setMatching("position")}
                  className={checkbox}
                />
                Row position (row 1 with row 1)
              </label>
              {shared.length > 1 && (
                <details className="rounded-lg border border-slate-200 dark:border-slate-700">
                  <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Columns to leave out{ignored.length > 0 ? ` (${ignored.length})` : ""}
                  </summary>
                  <div role="group" aria-label="Columns to leave out of the comparison" className="flex max-h-48 flex-wrap gap-2 overflow-y-auto p-2">
                    {shared.map(({ c, i }) => {
                      const on = ignored.includes(i);
                      return (
                        <label key={i} className={chip(on)}>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => setIgnored((cur) => (on ? cur.filter((x) => x !== i) : [...cur, i]))}
                            className={checkbox}
                          />
                          <span className="max-w-[12rem] truncate">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </details>
              )}
            </fieldset>

            <fieldset className="space-y-1">
              <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Treat as the same</legend>
              <label className={label}>
                <input type="checkbox" checked={trimSpaces} onChange={(e) => setTrimSpaces(e.target.checked)} className={checkbox} />
                Values with extra spaces before or after
              </label>
              <label className={label}>
                <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} className={checkbox} />
                Upper and lower case (Lahore = LAHORE)
              </label>
              <label className={label}>
                <input type="checkbox" checked={numericEquality} onChange={(e) => setNumericEquality(e.target.checked)} className={checkbox} />
                Equal numbers (14.50 = 14.5)
              </label>
              <label className={`${label} pt-2`}>
                <input type="checkbox" checked={formulaSafe} onChange={(e) => setFormulaSafe(e.target.checked)} className={checkbox} />
                Spreadsheet-safe downloads
              </label>
            </fieldset>
          </div>
        )}

        {tableA && tableB && hasHeader && (onlyA.length > 0 || onlyB.length > 0) && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            {onlyB.length > 0 && (
              <>
                Only in file 2: <strong>{onlyB.join(", ")}</strong>.{" "}
              </>
            )}
            {onlyA.length > 0 && (
              <>
                Only in file 1: <strong>{onlyA.join(", ")}</strong>.{" "}
              </>
            )}
            Columns that are in one file only are shown but not compared.
          </p>
        )}

        {needsKey && tableA && tableB && (
          <p className="text-sm text-slate-600 dark:text-slate-400">Select at least one key column, or match whole rows instead.</p>
        )}

        {result && tableA && tableB && (
          <section aria-labelledby={`${ids}-result`} className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${ids}-result`} aria-live="polite" className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                {differences === 0 ? (
                  <>
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-700 dark:text-brand-400" />
                    No differences found
                  </>
                ) : (
                  <>
                    {differences.toLocaleString()} {differences === 1 ? "row differs" : "rows differ"}
                  </>
                )}
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.counts.changed > 0 && matching !== "content" && (
                  <button type="button" onClick={downloadCellChanges} className={buttonClass}>
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Changed cells
                  </button>
                )}
                {differences > 0 && (
                  <button type="button" onClick={downloadReport} className={primaryButtonClass}>
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Download differences
                  </button>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["changed", "Changed", `${result.changedCells.toLocaleString()} ${result.changedCells === 1 ? "cell" : "cells"}`],
                  ["added", "Only in file 2", "added"],
                  ["removed", "Only in file 1", "removed"],
                  ["same", "Unchanged", "identical"],
                ] as [RowStatus, string, string][]
              )
                .filter(([s]) => !(s === "changed" && matching === "content"))
                .map(([s, name, sub]) => (
                  <div key={s} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <dt className="text-sm text-slate-600 dark:text-slate-400">{name}</dt>
                    <dd className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                      {result.counts[s].toLocaleString()}
                      <span className="ml-1.5 text-sm font-normal text-slate-500 dark:text-slate-400">{sub}</span>
                    </dd>
                  </div>
                ))}
            </dl>

            {matching === "key" && (result.duplicateKeys.a > 0 || result.duplicateKeys.b > 0) && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                Some key values appear more than once ({result.duplicateKeys.a.toLocaleString()} in file 1,{" "}
                {result.duplicateKeys.b.toLocaleString()} in file 2), for example {result.duplicateKeys.examples.map((e) => `"${e}"`).join(", ")}.
                Rows with the same key are paired in file order. Add another key column, such as a date, to make each row unique.
              </p>
            )}
            {matching === "key" && (result.emptyKeys.a > 0 || result.emptyKeys.b > 0) && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                {(result.emptyKeys.a + result.emptyKeys.b).toLocaleString()} {result.emptyKeys.a + result.emptyKeys.b === 1 ? "row has" : "rows have"} an
                empty key, so {result.emptyKeys.a + result.emptyKeys.b === 1 ? "it is" : "they are"} listed as only in one file.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Rows to show" className="inline-flex flex-wrap rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {(
                  [
                    ["differences", "Differences"],
                    ["changed", "Changed"],
                    ["added", "Added"],
                    ["removed", "Removed"],
                    ["same", "Unchanged"],
                    ["all", "All rows"],
                  ] as [Filter, string][]
                )
                  .filter(([f]) => !(f === "changed" && matching === "content"))
                  .map(([f, name]) => (
                    <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={tab(filter === f)}>
                      {name}
                    </button>
                  ))}
              </div>
              {(filter === "added" || filter === "removed") && result.counts[filter] > 0 && (
                <button type="button" onClick={() => downloadRows(filter)} className={buttonClass}>
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download these rows
                </button>
              )}
            </div>

            {visible.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                No rows in this view.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <div
                  className="relative max-h-[32rem] overflow-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                  tabIndex={0}
                  role="region"
                  aria-label="Comparison result, scrollable"
                >
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th scope="col" className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                          Change
                        </th>
                        <th scope="col" className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                          Row
                        </th>
                        {result.columns.map((col, i) => (
                          <th
                            key={i}
                            scope="col"
                            className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 font-semibold text-slate-700 last:border-r-0 dark:border-slate-700 dark:text-slate-200"
                          >
                            {col.name}
                            {(col.a < 0 || col.b < 0 || ignored.includes(i)) && (
                              <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">
                                ({col.a < 0 ? "file 2 only" : col.b < 0 ? "file 1 only" : "not compared"})
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {visible.slice(0, PREVIEW_ROWS).map((row, r) => {
                        const values = rowValues(tableA, tableB, result.columns, row);
                        const changed = changedSet(row);
                        return (
                          <tr key={r} className={`border-b border-slate-100 dark:border-slate-800 ${STATUS_STYLES[row.status].row}`}>
                            <td className="border-r border-slate-100 px-3 py-2 font-sans dark:border-slate-800">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[row.status].badge}`}>
                                {STATUS_LABELS[row.status]}
                              </span>
                            </td>
                            <td className="whitespace-nowrap border-r border-slate-100 px-3 py-2 font-sans text-slate-600 dark:border-slate-800 dark:text-slate-400">
                              {row.a !== undefined && row.b !== undefined
                                ? row.a === row.b
                                  ? row.a + 1
                                  : `${row.a + 1} → ${row.b + 1}`
                                : row.a !== undefined
                                  ? `${row.a + 1} (file 1)`
                                  : `${row.b! + 1} (file 2)`}
                            </td>
                            {result.columns.map((col, c) => {
                              const isChanged = changed.has(c);
                              const old = isChanged && row.a !== undefined ? tableA.rows[row.a][col.a] ?? "" : "";
                              return (
                                <td
                                  key={c}
                                  className={`max-w-xs border-r border-slate-100 px-3 py-2 align-top text-slate-800 last:border-r-0 dark:border-slate-800 dark:text-slate-200 ${
                                    isChanged ? "bg-amber-100/80 dark:bg-amber-900/40" : ""
                                  }`}
                                >
                                  {isChanged ? (
                                    <span className="block">
                                      <span className="block break-words font-semibold">{values[c] === "" ? <em className="font-sans font-normal">(empty)</em> : values[c]}</span>
                                      <span className="block break-words text-xs text-slate-600 line-through dark:text-slate-400">
                                        <span className="sr-only">was </span>
                                        {old === "" ? "(empty)" : old}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="block truncate" title={values[c]}>
                                      {values[c]}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {visible.length > PREVIEW_ROWS && (
                  <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    Showing the first {PREVIEW_ROWS.toLocaleString()} of {visible.length.toLocaleString()} rows. Download differences
                    includes every added, removed and changed row.
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
