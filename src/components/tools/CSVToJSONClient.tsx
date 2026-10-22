"use client";

import React, { Component, useState, useEffect, useTransition } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { csvToJSON, jsonToCSV } from "@/lib/json-utils";
import { analyzeCSV, detectDelimiter, withExcelBOM, CSVAnalysisResult } from "@/lib/csv-utils";
import { readTextFile } from "@/lib/file-text";
import { DataPreviewTable } from "@/components/DataPreviewTable";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import {
  ArrowLeftRight,
  Copy,
  Download,
  Check,
  Upload,
  Sparkles,
  FileText,
  Code2,
  AlertCircle,
} from "lucide-react";

const SAMPLE_CSV = `id,name,role,department,active,salary
1,Sarah Connor,Lead Engineer,Infrastructure,true,95000
2,John Doe,Product Designer,UX & Design,true,84000
3,Alex Murphy,Security Officer,DevSecOps,false,78000`;

const SAMPLE_JSON = `[
  { "id": 1, "name": "Sarah Connor", "role": "Lead Engineer", "salary": 95000 },
  { "id": 2, "name": "John Doe", "role": "Product Designer", "salary": 84000 }
]`;

type ConversionDirection = "csv-to-json" | "json-to-csv";

function CSVToJSONTool({
  initialDirection = "csv-to-json",
}: {
  initialDirection?: ConversionDirection;
}) {
  const [direction, setDirection] = useState<ConversionDirection>(initialDirection);
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");

  // CSV to JSON options
  const [jsonFormat, setJsonFormat] = useState<"array-of-objects" | "2d-array" | "keyed-object">("array-of-objects");
  // Off by default so values such as 00123, 1e5 or empty cells are never changed.
  const [parseTypes, setParseTypes] = useState<boolean>(false);
  const [jsonIndent, setJsonIndent] = useState<number>(2);

  // JSON to CSV options
  const [csvDelimiter, setCsvDelimiter] = useState<string>(",");
  const [quoteAll, setQuoteAll] = useState<boolean>(false);
  // On by default: protects people who open the downloaded CSV in a spreadsheet app.
  const [formulaSafe, setFormulaSafe] = useState<boolean>(true);
  const [fileNotice, setFileNotice] = useState<string | null>(null);

  const [warnings, setWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [csvAnalysis, setCsvAnalysis] = useState<CSVAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"result" | "table">("result");
  const [, startTransition] = useTransition();

  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!inputData || inputData.trim() === "") {
      setOutputData("");
      setWarnings([]);
      setHasError(false);
      setCsvAnalysis(null);
      return;
    }

    startTransition(() => {
      try {
        if (direction === "csv-to-json") {
          // Detect the separator once so the preview and the conversion agree.
          const delimiter = detectDelimiter(inputData);
          const stats = analyzeCSV(inputData, delimiter);
          setCsvAnalysis(stats);

          const res = csvToJSON(inputData, {
            delimiter,
            format: jsonFormat,
            parseTypes,
            indent: jsonIndent,
          });

          setOutputData(res.jsonText);
          setWarnings(res.warnings);
          setHasError(!res.ok);
        } else {
          const res = jsonToCSV(inputData, {
            delimiter: csvDelimiter,
            quotes: quoteAll,
            formulaSafe,
          });

          setOutputData(res.csvText);
          setWarnings(res.warnings);
          setHasError(!res.ok);

          if (res.csvText) {
            const stats = analyzeCSV(res.csvText, csvDelimiter, { hasHeader: res.hasHeader });
            setCsvAnalysis(stats);
          } else {
            setCsvAnalysis(null);
          }
        }
      } catch (err: unknown) {
        // Keep the tool usable and tell the user, but still surface the
        // underlying error in the console for debugging.
        console.error("Tooltiva conversion failed:", err);
        const message = err instanceof Error ? err.message : String(err);
        setOutputData("");
        setCsvAnalysis(null);
        setHasError(true);
        setWarnings([`Conversion failed unexpectedly: ${message}. Your input was not changed.`]);
      }
    });
  }, [inputData, direction, jsonFormat, parseTypes, jsonIndent, csvDelimiter, quoteAll, formulaSafe]);

  const toggleDirection = () => {
    const nextDir = direction === "csv-to-json" ? "json-to-csv" : "csv-to-json";
    setDirection(nextDir);
    // Swap content if valid output exists. JSON-to-CSV notices (for example
    // "null values were written as empty cells") do not block the swap.
    const outputIsSwappable =
      direction === "json-to-csv" ? !hasError : warnings.length === 0;
    if (outputData && outputIsSwappable) {
      setInputData(outputData);
    } else {
      setInputData("");
    }
  };

  const loadSample = () => {
    setFileNotice(null);
    if (direction === "csv-to-json") {
      setInputData(SAMPLE_CSV);
    } else {
      setInputData(SAMPLE_JSON);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    // Reset so choosing the same file again still triggers a change event.
    input.value = "";
    if (!file) return;

    try {
      const { text, notice } = await readTextFile(file);
      setInputData(text);
      setFileNotice(notice ?? null);
    } catch (err: unknown) {
      console.error("Tooltiva could not read the file:", err);
      setFileNotice("The file could not be read. Please try again or paste its contents instead.");
    }
  };

  const handleCopy = async () => {
    if (!outputData) return;
    try {
      await navigator.clipboard.writeText(outputData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!outputData) return;
    const isJson = direction === "csv-to-json";
    const mimeType = isJson ? "application/json" : "text/csv";
    const ext = isJson ? "json" : "csv";

    // CSV downloads get a UTF-8 byte-order mark only when they contain
    // non-ASCII text, so Excel shows accented, non-Latin and emoji characters.
    const content = isJson ? outputData : withExcelBOM(outputData);
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `converted_data_${Date.now()}.${ext}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <PrivacyBadge />

      <div className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-sm space-y-6">
        {/* Mode Switcher Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conversion Mode:
            </span>
            <div className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setDirection("csv-to-json")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  direction === "csv-to-json"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                CSV ➔ JSON
              </button>
              <button
                onClick={() => setDirection("json-to-csv")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  direction === "json-to-csv"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                JSON ➔ CSV
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDirection}
              className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Swap Direction
            </button>
            <button
              onClick={loadSample}
              className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Load Sample
            </button>
          </div>
        </div>

        {/* Options Row */}
        {direction === "csv-to-json" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                JSON Structure Format
              </label>
              <select
                aria-label="JSON structure format"
                value={jsonFormat}
                onChange={(e) => setJsonFormat(e.target.value as "array-of-objects" | "2d-array" | "keyed-object")}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="array-of-objects">Array of Objects ([{`{...}`}])</option>
                <option value="2d-array">2D Array ([[], []])</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Value Types
              </label>
              <select
                aria-label="Value types"
                value={parseTypes ? "true" : "false"}
                onChange={(e) => setParseTypes(e.target.value === "true")}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="false">Keep values as text (recommended)</option>
                <option value="true">Convert exact numbers &amp; true/false</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                JSON Indentation
              </label>
              <select
                aria-label="JSON indentation"
                value={jsonIndent}
                onChange={(e) => setJsonIndent(parseInt(e.target.value, 10))}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={2}>2 Spaces (Pretty)</option>
                <option value={4}>4 Spaces (Standard)</option>
                <option value={0}>Minified (Compact)</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Output CSV Delimiter
              </label>
              <select
                aria-label="Output CSV delimiter"
                value={csvDelimiter}
                onChange={(e) => setCsvDelimiter(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value={"\t"}>Tab (\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Quoting Mode
              </label>
              <select
                aria-label="Quoting mode"
                value={quoteAll ? "true" : "false"}
                onChange={(e) => setQuoteAll(e.target.value === "true")}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="false">RFC 4180 (Quote only when needed)</option>
                <option value="true">Quote All Fields</option>
              </select>
            </div>

            <label className="sm:col-span-2 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
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
        )}

        {/* Input Text Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              {direction === "csv-to-json" ? (
                <>
                  <FileText className="w-4 h-4 text-emerald-500" />
                  Source CSV Input
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4 text-indigo-500" />
                  Source JSON Input
                </>
              )}
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Upload {direction === "csv-to-json" ? "CSV" : "JSON"}
                <input
                  type="file"
                  accept={direction === "csv-to-json" ? ".csv,.tsv,.txt" : ".json,.txt"}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {inputData && (
                <button
                  onClick={() => {
                    setInputData("");
                    setFileNotice(null);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            aria-label={direction === "csv-to-json" ? "Source CSV input" : "Source JSON input"}
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder={
              direction === "csv-to-json"
                ? "Paste CSV rows here or click 'Load Sample'..."
                : "Paste JSON array or dictionary here..."
            }
            rows={7}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y"
          />
          {fileNotice && (
            <p role="status" className="text-xs text-amber-800 dark:text-amber-300">
              {fileNotice}
            </p>
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab("result")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "result"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {direction === "csv-to-json" ? "JSON Result" : "CSV Result"}
              </button>
              <button
                onClick={() => setActiveTab("table")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "table"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Table Preview
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!outputData}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Result"}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!outputData}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {direction === "csv-to-json" ? ".JSON" : ".CSV"}</span>
              </button>
            </div>
          </div>

          {warnings.length > 0 && (hasError || activeTab === "result") && (
            <div
              role={hasError ? "alert" : "status"}
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                hasError
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
              }`}
            >
              <AlertCircle
                aria-hidden="true"
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  hasError ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                }`}
              />
              <div className="space-y-1">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {activeTab === "table" ? (
            <DataPreviewTable
              headers={csvAnalysis?.headers || []}
              rows={csvAnalysis?.sampleRows || []}
              totalRowCount={csvAnalysis?.rowCount || 0}
              warnings={warnings}
            />
          ) : (
            <textarea
              aria-label={direction === "csv-to-json" ? "Converted JSON output" : "Converted CSV output"}
              readOnly
              value={outputData}
              placeholder="Converted output will appear here..."
              rows={9}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 font-mono text-xs text-slate-900 dark:text-slate-100 leading-relaxed resize-y focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps the converter so an unexpected render or effect error shows a
 * recoverable message instead of blanking the whole page. The error is still
 * logged to the console so it is not hidden from debugging.
 */
class ToolErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; resetKey: number }
> {
  state = { failed: false, resetKey: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Tooltiva converter crashed:", error, info.componentStack);
  }

  private reset = () => {
    this.setState((prev) => ({ failed: false, resetKey: prev.resetKey + 1 }));
  };

  render() {
    if (this.state.failed) {
      return (
        <div
          role="alert"
          className="border border-rose-200 dark:border-rose-800/60 rounded-3xl bg-rose-50 dark:bg-rose-950/40 p-6 space-y-3 text-sm text-rose-900 dark:text-rose-200"
        >
          <p className="font-semibold">The converter hit an unexpected error.</p>
          <p>
            Your data was not uploaded anywhere. Reset the converter to start again, and please
            check the input format if the problem repeats.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs font-semibold text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-slate-800 transition-colors"
          >
            Reset converter
          </button>
        </div>
      );
    }
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}

export function CSVToJSONClient(props: { initialDirection?: ConversionDirection }) {
  return (
    <ToolErrorBoundary>
      <CSVToJSONTool {...props} />
    </ToolErrorBoundary>
  );
}
