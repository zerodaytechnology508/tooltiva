"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  detectDelimiter,
  analyzeCSV,
  convertCSVDelimiter,
  CSVAnalysisResult,
} from "@/lib/csv-utils";
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
      return;
    }

    startTransition(() => {
      const detected = inputDelimiter === "auto"
        ? detectDelimiter(inputCSV)
        : inputDelimiter === "custom"
        ? customInputDelim || ","
        : inputDelimiter;

      const stats = analyzeCSV(inputCSV, detected);
      setAnalysis(stats);

      const result = convertCSVDelimiter(
        inputCSV,
        inputDelimiter,
        customInputDelim,
        {
          delimiter: targetDelimiter,
          customDelimiter: customTargetDelim,
          quoteChar: '"',
          quoteAllFields,
          escapeChar: '"',
        }
      );

      setOutputCSV(result.output);
    });
  }, [inputCSV, inputDelimiter, customInputDelim, targetDelimiter, customTargetDelim, quoteAllFields]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputCSV(content);
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
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
    const blob = new Blob([outputCSV], { type: "text/csv;charset=utf-8;" });
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
      <div className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-sm space-y-6">
        {/* Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          {/* Source Delimiter Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Source Separator</span>
              {analysis && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300">
                  Detected: {analysis.detectedDelimiter === "\t" ? "Tab" : `"${analysis.detectedDelimiter}"`}
                </span>
              )}
            </label>
            <select
              aria-label="Source separator"
              value={inputDelimiter}
              onChange={(e) => setInputDelimiter(e.target.value as CSVSeparator)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100"
              />
            )}
          </div>

          {/* Target Delimiter Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Separator
            </label>
            <select
              aria-label="Target separator"
              value={targetDelimiter}
              onChange={(e) => setTargetDelimiter(e.target.value as "," | ";" | "\t" | "|" | ":" | "custom")}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100"
              />
            )}
          </div>

          {/* Quoting Behavior */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Field Quoting
            </label>
            <select
              aria-label="Field quoting"
              value={quoteAllFields ? "all" : "needed"}
              onChange={(e) => setQuoteAllFields(e.target.value === "all")}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="needed">RFC 4180 (Only when needed)</option>
              <option value="all">Quote All Fields</option>
            </select>
          </div>

          {/* Actions & Sample */}
          <div className="flex flex-col justify-end space-y-1.5">
            <button
              onClick={loadSample}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Load Semicolon Sample
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-500" />
              Input CSV / Delimited Text
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Upload CSV File
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {inputCSV && (
                <button
                  onClick={() => setInputCSV("")}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            aria-label="Input CSV or delimited text"
            value={inputCSV}
            onChange={(e) => setInputCSV(e.target.value)}
            placeholder="Paste your CSV data here, drag and drop a file, or click 'Load Semicolon Sample'..."
            rows={7}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y"
          />
        </div>

        {/* Output Controls & Views */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
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
              <button
                onClick={() => setActiveTab("raw")}
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
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Result"}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!outputCSV}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </button>
            </div>
          </div>

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
              aria-label="Converted CSV output"
              readOnly
              value={outputCSV}
              placeholder="Converted CSV output will appear here..."
              rows={9}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 font-mono text-xs text-slate-900 dark:text-slate-100 leading-relaxed resize-y focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
