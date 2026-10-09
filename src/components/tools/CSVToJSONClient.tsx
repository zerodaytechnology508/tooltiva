"use client";

import React, { useState, useEffect, useTransition } from "react";
import { csvToJSON, jsonToCSV } from "@/lib/json-utils";
import { analyzeCSV, CSVAnalysisResult } from "@/lib/csv-utils";
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
} from "lucide-react";

const SAMPLE_CSV = `id,name,role,department,active,salary
1,Sarah Connor,Lead Engineer,Infrastructure,true,95000
2,John Doe,Product Designer,UX & Design,true,84000
3,Alex Murphy,Security Officer,DevSecOps,false,78000`;

const SAMPLE_JSON = `[
  { "id": 1, "name": "Sarah Connor", "role": "Lead Engineer", "salary": 95000 },
  { "id": 2, "name": "John Doe", "role": "Product Designer", "salary": 84000 }
]`;

export function CSVToJSONClient() {
  const [direction, setDirection] = useState<"csv-to-json" | "json-to-csv">("csv-to-json");
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");

  // CSV to JSON options
  const [jsonFormat, setJsonFormat] = useState<"array-of-objects" | "2d-array" | "keyed-object">("array-of-objects");
  const [parseTypes, setParseTypes] = useState<boolean>(true);
  const [jsonIndent, setJsonIndent] = useState<number>(2);

  // JSON to CSV options
  const [csvDelimiter, setCsvDelimiter] = useState<string>(",");
  const [quoteAll, setQuoteAll] = useState<boolean>(false);

  const [warnings, setWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [csvAnalysis, setCsvAnalysis] = useState<CSVAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"result" | "table">("result");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!inputData || inputData.trim() === "") {
      setOutputData("");
      setWarnings([]);
      setCsvAnalysis(null);
      return;
    }

    startTransition(() => {
      if (direction === "csv-to-json") {
        const stats = analyzeCSV(inputData);
        setCsvAnalysis(stats);

        const res = csvToJSON(inputData, {
          format: jsonFormat,
          parseTypes,
          indent: jsonIndent,
        });

        setOutputData(res.jsonText);
        setWarnings(res.warnings);
      } else {
        const res = jsonToCSV(inputData, {
          delimiter: csvDelimiter,
          quotes: quoteAll,
        });

        setOutputData(res.csvText);
        setWarnings(res.warnings);

        if (res.csvText) {
          const stats = analyzeCSV(res.csvText, csvDelimiter);
          setCsvAnalysis(stats);
        } else {
          setCsvAnalysis(null);
        }
      }
    });
  }, [inputData, direction, jsonFormat, parseTypes, jsonIndent, csvDelimiter, quoteAll]);

  const toggleDirection = () => {
    const nextDir = direction === "csv-to-json" ? "json-to-csv" : "csv-to-json";
    setDirection(nextDir);
    // Swap content if valid output exists
    if (outputData && warnings.length === 0) {
      setInputData(outputData);
    } else {
      setInputData("");
    }
  };

  const loadSample = () => {
    if (direction === "csv-to-json") {
      setInputData(SAMPLE_CSV);
    } else {
      setInputData(SAMPLE_JSON);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setInputData(event.target?.result as string);
    };
    reader.readAsText(file);
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

    const blob = new Blob([outputData], { type: `${mimeType};charset=utf-8;` });
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
                Type Inference
              </label>
              <select
                value={parseTypes ? "true" : "false"}
                onChange={(e) => setParseTypes(e.target.value === "true")}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="true">Smart Types (Numbers & Booleans)</option>
                <option value="false">Preserve All as Strings</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                JSON Indentation
              </label>
              <select
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
                value={quoteAll ? "true" : "false"}
                onChange={(e) => setQuoteAll(e.target.value === "true")}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="false">RFC 4180 (Quote only when needed)</option>
                <option value="true">Quote All Fields</option>
              </select>
            </div>
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
                  onClick={() => setInputData("")}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
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

          {activeTab === "table" ? (
            <DataPreviewTable
              headers={csvAnalysis?.headers || []}
              rows={csvAnalysis?.sampleRows || []}
              totalRowCount={csvAnalysis?.rowCount || 0}
              warnings={warnings}
            />
          ) : (
            <textarea
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
