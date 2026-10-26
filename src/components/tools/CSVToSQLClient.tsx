"use client";

import React, { useEffect, useId, useMemo, useState, useTransition } from "react";
import { AlertCircle, Check, Copy, Download, X } from "lucide-react";
import { detectDelimiter, parseCSVRows } from "@/lib/csv-utils";
import { buildViewerTable } from "@/lib/csv-viewer";
import { buildSQL, cleanNames, DIALECTS, sqlType, tableNameFromFile, uniqueNames, type SQLDialect } from "@/lib/csv-sql";
import { formatBytes } from "@/lib/image-size";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import {
  CSVFileInput,
  DELIMITER_NAMES,
  DELIMITER_OPTIONS,
  buttonClass,
  downloadBlob,
  fieldClass,
  primaryButtonClass,
  type LoadedFile,
} from "@/components/tools/csv-ui";

const SAMPLE_CSV = [
  "Customer ID,Full Name,Email,Postcode,Balance,Active,Signed Up",
  "1001,Ayesha Khan,ayesha.khan@example.com,54000,1250.50,true,2024-01-31",
  "1002,Liam O'Brien,liam@example.com,02134,0,false,2024-02-29",
  "1003,Sofia Rossi,sofia.rossi@example.com,20121,89.99,true,2024-03-15",
  '1004,"Chen, Wei",,200000,,true,2024-04-02',
].join("\n");

/** Characters of SQL shown in the preview; the download always has everything. */
const PREVIEW_CHARS = 60_000;
/** Above this size the copy button is hidden, because pasting megabytes of SQL is impractical. */
const COPY_LIMIT = 2_000_000;
const BATCH_OPTIONS = [1, 50, 100, 500, 1000];
const UNSAFE_FILE_CHARS = new RegExp("[^\\p{L}\\p{N}_.-]+", "gu");

export function CSVToSQLClient() {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [delimiterChoice, setDelimiterChoice] = useState("auto");
  const [hasHeader, setHasHeader] = useState(true);
  const [dialect, setDialect] = useState<SQLDialect>("mysql");
  const [table, setTable] = useState("my_table");
  const [batch, setBatch] = useState(100);
  const [createTable, setCreateTable] = useState(true);
  const [clean, setClean] = useState(true);
  const [detectTypes, setDetectTypes] = useState(true);
  const [emptyAsNull, setEmptyAsNull] = useState(true);
  const [transaction, setTransaction] = useState(false);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
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
  const data = parsed?.table ?? null;

  useEffect(() => {
    setExcluded([]);
  }, [data]);

  const columnNames = useMemo(() => {
    if (!data) return [];
    return clean ? cleanNames(data.headers, dialect) : uniqueNames(data.headers.map((h) => h.trim() || "column"));
  }, [data, clean, dialect]);

  const include = useMemo(
    () => (data ? data.headers.map((_, i) => i).filter((i) => !excluded.includes(i)) : []),
    [data, excluded]
  );
  const tableName = (clean && dialect === "oracle" ? table.toUpperCase() : table).trim() || "my_table";

  const result = useMemo(() => {
    if (!data || include.length === 0) return null;
    return buildSQL(data.rows, {
      dialect,
      table: tableName,
      columns: columnNames,
      include,
      rowsPerStatement: batch,
      createTable,
      emptyAsNull,
      transaction,
      detectTypes,
    });
  }, [data, include, dialect, tableName, columnNames, batch, createTable, emptyAsNull, transaction, detectTypes]);

  const preview = useMemo(() => {
    if (!result) return "";
    let out = "";
    for (const chunk of result.chunks) {
      if (out.length + chunk.length > PREVIEW_CHARS) {
        out += chunk.slice(0, Math.max(0, PREVIEW_CHARS - out.length));
        return out + "\n-- … preview shortened; Download .sql has the complete script.";
      }
      out += chunk;
    }
    return out;
  }, [result]);

  const load = (next: LoadedFile) =>
    startTransition(() => {
      setFile(next);
      setTable(tableNameFromFile(next.name.startsWith("pasted.") ? "my_table" : next.name));
    });

  const maxBatch = DIALECTS.find((d) => d.value === dialect)!.maxRowsPerStatement;

  const download = () => {
    if (!result) return;
    downloadBlob(new Blob(result.chunks, { type: "application/sql;charset=utf-8" }), `${tableName.replace(UNSAFE_FILE_CHARS, "_") || "data"}.sql`);
  };
  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.chunks.join(""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <CSVFileInput
            onLoad={load}
            sample={{ name: "customers.csv", text: SAMPLE_CSV }}
            pastePlaceholder={"id,name,city\n1,Ayesha,Lahore\n\nCells copied from Excel or Google Sheets work too."}
          />
        </div>
      </div>
    );
  }

  const checkbox = "h-4 w-4 accent-brand-700";
  const label = "flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300";
  const total = data?.rows.length ?? 0;

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-white" title={file.name}>
              {file.name}
            </p>
            {data && parsed && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {total.toLocaleString()} data {total === 1 ? "row" : "rows"} × {data.headers.length.toLocaleString()}{" "}
                {data.headers.length === 1 ? "column" : "columns"} · {DELIMITER_NAMES[parsed.delimiter] ?? `"${parsed.delimiter}"`}-separated
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

        {data && (
          <div className="grid gap-6 border-t border-slate-200 pt-5 md:grid-cols-2 dark:border-slate-800">
            <div className="space-y-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                Database
                <select value={dialect} onChange={(e) => setDialect(e.target.value as SQLDialect)} className={fieldClass}>
                  {DIALECTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                Table name
                <input
                  type="text"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  className={`${fieldClass} font-mono`}
                  aria-describedby={`${ids}-table-hint`}
                />
                <span id={`${ids}-table-hint`} className="text-sm font-normal text-slate-600 dark:text-slate-400">
                  Use schema.table, such as sales.orders, to name a schema.
                </span>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                Rows per INSERT statement
                <select value={Math.min(batch, maxBatch)} onChange={(e) => setBatch(Number(e.target.value))} className={fieldClass}>
                  {BATCH_OPTIONS.filter((n) => n <= maxBatch).map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? "1 (one INSERT per row)" : n.toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset className="space-y-1">
              <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Options</legend>
              <label className={label}>
                <input type="checkbox" checked={createTable} onChange={(e) => setCreateTable(e.target.checked)} className={checkbox} />
                Add a CREATE TABLE statement
              </label>
              <label className={label}>
                <input type="checkbox" checked={clean} onChange={(e) => setClean(e.target.checked)} className={checkbox} />
                Clean column names (Full Name → {dialect === "oracle" ? "FULL_NAME" : "full_name"})
              </label>
              <label className={label}>
                <input type="checkbox" checked={detectTypes} onChange={(e) => setDetectTypes(e.target.checked)} className={checkbox} />
                Detect numbers, true/false and dates
              </label>
              <label className={label}>
                <input type="checkbox" checked={emptyAsNull} onChange={(e) => setEmptyAsNull(e.target.checked)} className={checkbox} />
                Write empty cells as NULL
              </label>
              <label className={label}>
                <input type="checkbox" checked={transaction} onChange={(e) => setTransaction(e.target.checked)} className={checkbox} />
                Wrap in a transaction
              </label>
            </fieldset>
          </div>
        )}

        {data && result && (
          <details className="rounded-xl border border-slate-200 dark:border-slate-700">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Columns and types ({include.length} of {data.headers.length} included)
            </summary>
            <div className="overflow-x-auto px-4 pb-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                    <th scope="col" className="py-2 pr-3 font-semibold">Include</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">CSV column</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">SQL name</th>
                    <th scope="col" className="py-2 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.headers.map((h, i) => {
                    const on = !excluded.includes(i);
                    const info = on ? result.columns[include.indexOf(i)] : null;
                    return (
                      <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        <td className="py-1.5 pr-3">
                          <input
                            type="checkbox"
                            checked={on}
                            aria-label={`Include ${h}`}
                            onChange={() => setExcluded((cur) => (on ? [...cur, i] : cur.filter((x) => x !== i)))}
                            className={checkbox}
                          />
                        </td>
                        <td className="max-w-[12rem] truncate py-1.5 pr-3 text-slate-800 dark:text-slate-200">{h}</td>
                        <td className="py-1.5 pr-3 font-mono text-slate-800 dark:text-slate-200">{columnNames[i]}</td>
                        <td className="py-1.5 font-mono text-slate-600 dark:text-slate-400">{info ? sqlType(info, dialect) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {data && include.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-400">Include at least one column.</p>}

        {result && (
          <section aria-labelledby={`${ids}-result`} className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id={`${ids}-result`} className="text-base font-semibold text-slate-900 dark:text-white">
                  SQL script
                </h2>
                <p aria-live="polite" className="text-sm text-slate-600 dark:text-slate-400">
                  {result.rows.toLocaleString()} {result.rows === 1 ? "row" : "rows"} in {result.statements.toLocaleString()} INSERT{" "}
                  {result.statements === 1 ? "statement" : "statements"} · about {formatBytes(result.bytes)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.bytes <= COPY_LIMIT && (
                  <button type="button" onClick={copy} className={buttonClass}>
                    {copied ? <Check aria-hidden="true" className="h-4 w-4 text-brand-700 dark:text-brand-400" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy SQL"}
                  </button>
                )}
                <button type="button" onClick={download} className={primaryButtonClass}>
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download .sql
                </button>
              </div>
            </div>
            <textarea
              readOnly
              wrap="off"
              spellCheck={false}
              aria-label="Generated SQL"
              value={preview}
              rows={16}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </section>
        )}
      </div>
    </div>
  );
}
