"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  analyzeCSV,
  convertCSVDelimiter,
  resolveDelimiter,
  withExcelBOM,
  CSVAnalysisResult,
} from "@/lib/csv-utils";
import { readTextFile } from "@/lib/file-text";
import { CSVSeparator } from "@/lib/types";
import { DataPreviewTable } from "@/components/DataPreviewTable";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import {
  Copy,
  Download,
  Check,
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const SAMPLE_CSV = `ID;Full Name;Department;Salary;Location
101;"Müller, Hans";Engineering;75000;Berlin
102;"Dubois, Claire";Product Management;82000;Paris
103;"Rossi, Marco";Data Analytics;71000;Milan
104;"Schmidt, Stefan";Security & DevSecOps;89000;Munich`;

export function CSVDelimiterConverterClient() {
  const [inputCSV, setInputCSV] = useState<string>("");
  const [inputDelimiter, setInputDelimiter] = useState<CSVSeparator>("auto");
  const [customInputDelim, setCustomInputDelim] = useState<string>("");
  const [targetDelimiter, setTargetDelimiter] = useState<"," | ";" | "\t" | "|" | ":" | "custom">(",");
  const [customTargetDelim, setCustomTargetDelim] = useState<string>("");
  const [quoteAllFields, setQuoteAllFields] = useState<boolean>(false);
  // On by default: protects people who open the downloaded CSV in a spreadsheet app.
  const [formulaSafe, setFormulaSafe] = useState<boolean>(true);
  const [notices, setNotices] = useState<string[]>([]);
  const [hasError, setHasError] = useState<boolean>(false);
  const [fileNotice, setFileNotice] = useState<string | null>(null);

  const [outputCSV, setOutputCSV] = useState<string>("");
  const [analysis, setAnalysis] = useState<CSVAnalysisResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"table" | "raw">("table");
  const [, startTransition] = useTransition();

  // Process and convert when inputs change
  useEffect(() => {
    if (!inputCSV || inputCSV.trim() === "") {
      setOutputCSV("");
      setAnalysis(null);
      setNotices([]);
      setHasError(false);
      return;
    }

    startTransition(() => {
      try {
        // Resolve the separator once so the preview and the conversion parse
        // the text identically.
        const source = resolveDelimiter(inputCSV, inputDelimiter, customInputDelim);
        if (source.error) {
          setAnalysis(null);
          setOutputCSV("");
          setNotices([`Source separator: ${source.error}`]);
          setHasError(true);
          return;
        }

        setAnalysis(analyzeCSV(inputCSV, source.delimiter));

        const result = convertCSVDelimiter(inputCSV, "custom", source.delimiter, {
          delimiter: targetDelimiter,
          customDelimiter: customTargetDelim,
          quoteChar: '"',
          quoteAllFields,
          escapeChar: '"',
          formulaSafe,
        });

        setOutputCSV(result.output);
        setNotices(result.warnings);
        setHasError(!result.ok);
      } catch (err: unknown) {
        console.error("Tooltiva conversion failed:", err);
        const message = err instanceof Error ? err.message : String(err);
        setAnalysis(null);
        setOutputCSV("");
        setNotices([`Conversion failed unexpectedly: ${message}. Your input was not changed.`]);
        setHasError(true);
      }
    });
  }, [inputCSV, inputDelimiter, customInputDelim, targetDelimiter, customTargetDelim, quoteAllFields, formulaSafe]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    // Reset so choosing the same file again still triggers a change event.
    input.value = "";
    if (!file) return;

    try {
      const { text, notice } = await readTextFile(file);
      setInputCSV(text);
      setFileNotice(notice ?? null);
    } catch (err: unknown) {
      console.error("Tooltiva could not read the file:", err);
      setFileNotice("The file could not be read. Please try again or paste its contents instead.");
    }
  };

  const loadSample = () => {
    setFileNotice(null);
    setInputCSV(SAMPLE_CSV);
    setInputDelimiter("auto");
    setTargetDelimiter(",");
  };

  const handleCopy = async () => {
    if (!outputCSV) return;
    try {
      await navigator.clipboard.writeText(outputCSV);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!outputCSV) return;
    // Adds a UTF-8 byte-order mark only when the CSV contains non-ASCII text,
    // so Excel shows accented, non-Latin and emoji characters correctly.
    const blob = new Blob([withExcelBOM(outputCSV)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `converted_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Privacy Notice Banner */}
      <PrivacyBadge />

      {/* Main Tool Card */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-6">
        {/* Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          {/* Source Delimiter Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Source Separator</span>
              {analysis && (
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300">
                  Detected: {analysis.detectedDelimiter === "\t" ? "Tab" : `"${analysis.detectedDelimiter}"`}
                </span>
              )}
            </label>
            <select
              aria-label="Source separator"
              value={inputDelimiter}
              onChange={(e) => setInputDelimiter(e.target.value as CSVSeparator)}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="auto">⚡ Auto Detect</option>
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value={"\t"}>Tab (\t)</option>
              <option value="|">Pipe (|)</option>
              <option value=":">Colon (:)</option>
              <option value="custom">Custom...</option>
            </select>
            {inputDelimiter === "custom" && (
              <input
                aria-label="Custom source separator"
                value={customInputDelim}
                onChange={(e) => setCustomInputDelim(e.target.value.slice(0, 1))}
                maxLength={1}
                placeholder="Enter one character"
                className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100"
              />
            )}
          </div>

          {/* Target Delimiter Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Target Separator
            </label>
            <select
              aria-label="Target separator"
              value={targetDelimiter}
              onChange={(e) => setTargetDelimiter(e.target.value as "," | ";" | "\t" | "|" | ":" | "custom")}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value={"\t"}>Tab (\t)</option>
              <option value="|">Pipe (|)</option>
              <option value=":">Colon (:)</option>
              <option value="custom">Custom...</option>
            </select>
            {targetDelimiter === "custom" && (
              <input
                aria-label="Custom target separator"
                value={customTargetDelim}
                onChange={(e) => setCustomTargetDelim(e.target.value.slice(0, 1))}
                maxLength={1}
                placeholder="Enter one character"
                className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100"
              />
            )}
          </div>

          {/* Quoting Behavior */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Field Quoting
            </label>
            <select
              aria-label="Field quoting"
              value={quoteAllFields ? "all" : "needed"}
              onChange={(e) => setQuoteAllFields(e.target.value === "all")}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="needed">RFC 4180 (Only when needed)</option>
              <option value="all">Quote All Fields</option>
            </select>
          </div>

          {/* Spreadsheet safety */}
          <div className="sm:col-span-2 lg:col-span-4 order-last">
            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formulaSafe}
                onChange={(e) => setFormulaSafe(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
              />
              <span>
                <span className="font-semibold">Spreadsheet-safe output</span>{" "}
                <span className="text-slate-600 dark:text-slate-400">
                  Cells that start with =, +, -, @, a tab or a carriage return (other than plain numbers such as -5) get a leading apostrophe so Excel, Sheets and Calc show them as text instead of running them as formulas.
                </span>
              </span>
            </label>
          </div>

          {/* Actions & Sample */}
          <div className="flex flex-col justify-end space-y-1.5">
            <button
              onClick={loadSample}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
              Load Semicolon Sample
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-700" />
              Input CSV / Delimited Text
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer text-sm font-medium text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Upload CSV
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {inputCSV && (
                <button
                  onClick={() => {
                    setInputCSV("");
                    setFileNotice(null);
                  }}
                  className="rounded text-sm font-medium text-slate-600 hover:text-rose-700 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            wrap="off"
            spellCheck={false}
            aria-label="Input CSV or delimited text"
            value={inputCSV}
            onChange={(e) => setInputCSV(e.target.value)}
            placeholder="Paste your CSV data here, drag and drop a file, or click 'Load Semicolon Sample'..."
            rows={7}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y"
          />
          {fileNotice && (
            <p role="status" className="text-sm text-amber-800 dark:text-amber-300">
              {fileNotice}
            </p>
          )}
        </div>

        {/* Output Controls & Views */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium">
              <button
                onClick={() => setActiveTab("table")}
                type="button"
                aria-pressed={activeTab === "table"}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "table"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Table Preview
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                type="button"
                aria-pressed={activeTab === "raw"}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "raw"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Raw Converted Output
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!outputCSV}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-brand-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Result"}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!outputCSV}
                title="Downloads a UTF-8 CSV. Files with non-English characters include a byte-order mark so Excel displays them correctly."
                className="px-3.5 py-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </button>
            </div>
          </div>

          {notices.length > 0 && (
            <div
              role={hasError ? "alert" : "status"}
              className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${
                hasError
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
              }`}
            >
              <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {notices.map((n, i) => (
                  <p key={i}>{n}</p>
                ))}
              </div>
            </div>
          )}

          {/* Active View Container */}
          {activeTab === "table" ? (
            <DataPreviewTable
              headers={analysis?.headers || []}
              rows={analysis?.sampleRows || []}
              totalRowCount={analysis?.rowCount || 0}
              warnings={analysis?.warnings || []}
            />
          ) : (
            <textarea
              wrap="off"
              spellCheck={false}
              aria-label="Converted CSV output"
              readOnly
              value={outputCSV}
              placeholder="Converted CSV output will appear here..."
              rows={9}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 font-mono text-sm text-slate-900 dark:text-slate-100 leading-relaxed resize-y focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
