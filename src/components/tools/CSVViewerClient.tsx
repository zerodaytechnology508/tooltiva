"use client";

import React, { useCallback, useDeferredValue, useMemo, useState, useTransition } from "react";
import { AlertCircle, Check, Copy, Download, Search, X } from "lucide-react";
import { detectDelimiter, isFormulaRisk, parseCSVRows, withExcelBOM } from "@/lib/csv-utils";
import {
  buildViewerTable,
  columnWidths,
  exportView,
  viewIndices,
  type SortState,
  type ViewerTable,
} from "@/lib/csv-viewer";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { VirtualTable } from "@/components/tools/VirtualTable";
import {
  CSVFileInput,
  DELIMITER_NAMES,
  DELIMITER_OPTIONS,
  buttonClass as button,
  downloadBlob,
  fieldClass as field,
  fileStem,
  primaryButtonClass,
  type LoadedFile,
} from "@/components/tools/csv-ui";

const SAMPLE_CSV = `order_id,customer,country,product,quantity,unit_price,order_date,zip
1001,"Khan, Ayesha",Pakistan,USB-C Hub,2,24.99,2026-09-14,54000
1002,Liam O'Brien,Ireland,Wireless Mouse,1,18.50,2026-09-15,D02
1003,Sofia Rossi,Italy,Laptop Stand,3,32.00,2026-09-15,00184
1004,Chen Wei,China,USB-C Hub,1,24.99,2026-09-16,100000
1005,"Müller, Jonas",Germany,Mechanical Keyboard,1,89.90,2026-09-17,10115
1006,Amara Okafor,Nigeria,Webcam 1080p,2,45.00,2026-09-18,100001
1007,Lucas Martin,France,Laptop Stand,1,32.00,2026-09-18,75001
1008,Hira Malik,Pakistan,Wireless Mouse,4,18.50,2026-09-19,44000
1009,Emma Johansson,Sweden,Noise-Cancelling Headset,1,129.00,2026-09-20,11120
1010,Diego Fernández,Spain,USB-C Hub,2,24.99,2026-09-21,28013
1011,Yuki Tanaka,Japan,Mechanical Keyboard,1,89.90,2026-09-22,100-0001
1012,Noah Smith,United States,Webcam 1080p,1,45.00,2026-09-22,02108`;

/** Browsers cap element heights at roughly 15–30 million pixels; beyond this, ask the user to search. */
const MAX_SCROLL_ROWS = 400_000;

export function CSVViewerClient() {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [delimiterChoice, setDelimiterChoice] = useState("auto");
  const [hasHeader, setHasHeader] = useState(true);
  const [query, setQuery] = useState("");
  const [searchColumn, setSearchColumn] = useState<number | "all">("all");
  const [sort, setSort] = useState<SortState | null>(null);
  const [formulaSafe, setFormulaSafe] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Parse once per file, delimiter and header choice.
  const parsed = useMemo(() => {
    if (!file) return null;
    const delimiter = delimiterChoice === "auto" ? detectDelimiter(file.text) : delimiterChoice;
    const result = parseCSVRows(file.text, delimiter);
    if (result.fatalError) {
      const error = result.fatalError.replace("Nothing was converted.", "The table can be shown once the file is fixed.");
      return { delimiter, error, table: null as ViewerTable | null, skipped: 0 };
    }
    if (result.rows.length === 0) return { delimiter, error: "The file has no rows to show.", table: null, skipped: 0 };
    return { delimiter, error: null, table: buildViewerTable(result.rows, hasHeader), skipped: result.skippedBlankLines };
  }, [file, delimiterChoice, hasHeader]);

  const table = parsed?.table ?? null;
  const deferredQuery = useDeferredValue(query);
  const indices = useMemo(
    () => (table ? viewIndices(table.rows, deferredQuery, searchColumn, sort) : []),
    [table, deferredQuery, searchColumn, sort]
  );
  const widths = useMemo(() => (table ? columnWidths(table) : []), [table]);
  const shown = indices.length > MAX_SCROLL_ROWS ? indices.slice(0, MAX_SCROLL_ROWS) : indices;

  const load = useCallback((next: LoadedFile) => {
    startTransition(() => {
      setFile(next);
      setQuery("");
      setSearchColumn("all");
      setSort(null);
      setReadError(null);
    });
  }, []);

  const reset = () => {
    setFile(null);
    setQuery("");
    setSort(null);
    setReadError(null);
  };

  const cycleSort = (column: number) => {
    startTransition(() =>
      setSort((current) => {
        if (!current || current.column !== column) return { column, direction: "asc" };
        if (current.direction === "asc") return { column, direction: "desc" };
        return null;
      })
    );
  };

  const exported = () =>
    table && parsed
      ? exportView(table, indices, {
          delimiter: parsed.delimiter,
          formulaSafe,
          includeHeader: hasHeader,
        })
      : null;

  const handleDownload = () => {
    const result = exported();
    if (!result || !file) return;
    downloadBlob(new Blob([withExcelBOM(result.csvText)], { type: "text/csv;charset=utf-8;" }), `${fileStem(file.name)}-view.csv`);
  };

  const handleCopy = async () => {
    const result = exported();
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.csvText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setReadError("Copying failed. Your browser may block clipboard access; use Download instead.");
    }
  };

  // Formula-like cells in the whole file, counted once per table (not per search).
  const formulaCount = useMemo(() => {
    if (!table) return 0;
    let count = 0;
    for (const row of table.rows) for (const cell of row) if (isFormulaRisk(cell)) count++;
    return count;
  }, [table]);
  const notice =
    formulaCount > 0
      ? `${formulaCount.toLocaleString()} cell(s) start with =, +, -, @, a tab or a carriage return and could run as formulas in a spreadsheet app. ${
          formulaSafe
            ? "Spreadsheet-safe export is on, so copied and downloaded views prefix them with an apostrophe."
            : "Turn on Spreadsheet-safe export to neutralize them in copied and downloaded views."
        } The table above always shows the original values.`
      : null;

  // ---- Empty state: open, drop or paste a file ----
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

  // ---- Loaded: toolbar, messages and table ----
  const totalRows = table?.rows.length ?? 0;
  const delimiterName = parsed ? DELIMITER_NAMES[parsed.delimiter] ?? `"${parsed.delimiter}"` : "";
  const messages: string[] = [];
  if (file.notice) messages.push(file.notice);
  if (table && table.raggedCount > 0) {
    messages.push(
      `${table.raggedCount.toLocaleString()} row(s) have a different number of fields than the header (for example row ${table.raggedRows.join(", ")}); missing cells are shown empty.`
    );
  }
  if (parsed && parsed.skipped > 0) messages.push(`${parsed.skipped.toLocaleString()} blank line(s) were skipped.`);
  if (indices.length > MAX_SCROLL_ROWS) {
    messages.push(
      `Showing the first ${MAX_SCROLL_ROWS.toLocaleString()} of ${indices.length.toLocaleString()} matching rows. Search or sort to reach the rest; export includes every matching row.`
    );
  }
  if (notice) messages.push(notice);

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-white" title={file.name}>
              {file.name}
            </p>
            {table && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {totalRows.toLocaleString()} {totalRows === 1 ? "row" : "rows"} × {table.headers.length.toLocaleString()}{" "}
                {table.headers.length === 1 ? "column" : "columns"} · {delimiterName}-separated
              </p>
            )}
          </div>
          <button type="button" onClick={reset} className={button}>
            <X aria-hidden="true" className="h-4 w-4" />
            Open another file
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search rows</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rows"
                disabled={!table}
                className={`${field} w-full pl-9`}
              />
            </label>
            <label className="sr-only" htmlFor="viewer-search-column">
              Search in
            </label>
            <select
              id="viewer-search-column"
              value={String(searchColumn)}
              onChange={(e) => setSearchColumn(e.target.value === "all" ? "all" : Number(e.target.value))}
              disabled={!table}
              className={`${field} max-w-[11rem]`}
            >
              <option value="all">All columns</option>
              {table?.headers.map((h, c) => (
                <option key={c} value={c}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="whitespace-nowrap font-medium">Separator</span>
            <select value={delimiterChoice} onChange={(e) => setDelimiterChoice(e.target.value)} className={`${field} flex-1`}>
              {DELIMITER_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="h-4 w-4 accent-brand-700"
            />
            First row is the header
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formulaSafe}
              onChange={(e) => setFormulaSafe(e.target.checked)}
              className="h-4 w-4 accent-brand-700"
            />
            Spreadsheet-safe export
          </label>
        </div>

        {parsed?.error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{parsed.error}</p>
          </div>
        )}
        {messages.length > 0 && (
          <div role="status" className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            {messages.map((m) => (
              <p key={m}>{m}</p>
            ))}
          </div>
        )}
        {readError && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
            {readError}
          </p>
        )}

        {table && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-sm text-slate-700 dark:text-slate-300">
                {deferredQuery.trim()
                  ? `${indices.length.toLocaleString()} of ${totalRows.toLocaleString()} rows match`
                  : `${totalRows.toLocaleString()} rows`}
                {sort ? ` · sorted by ${table.headers[sort.column]} (${sort.direction === "asc" ? "ascending" : "descending"})` : ""}
                {isPending || deferredQuery !== query ? " · updating…" : ""}
              </p>
              <div className="flex gap-2 whitespace-nowrap">
                <button type="button" onClick={handleCopy} title="Copy the rows shown as CSV text" disabled={indices.length === 0} className={button}>
                  {copied ? (
                    <Check aria-hidden="true" className="h-4 w-4 text-brand-700" />
                  ) : (
                    <Copy aria-hidden="true" className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={indices.length === 0}
                  title="Download the rows shown (search and sort applied) as a CSV file"
                  className={primaryButtonClass}
                >
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download CSV
                </button>
              </div>
            </div>

            {indices.length === 0 ? (
              <p className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                No rows match &ldquo;{deferredQuery.trim()}&rdquo;.
              </p>
            ) : (
              <VirtualTable
                headers={table.headers}
                rows={table.rows}
                indices={shown}
                widths={widths}
                sort={sort}
                onSort={cycleSort}
                label={`Contents of ${file.name}`}
              />
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Click a column name to sort (ascending, descending, then original order). Row numbers refer to the
              row&apos;s position in the file. Hover over a shortened value to see all of it, or use Download to open the full data.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
