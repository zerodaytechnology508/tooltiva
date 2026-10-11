"use client";

import React, { useState, useEffect, useTransition } from "react";
import { validateJSON, repairJSON } from "@/lib/json-utils";
import type { JSONValidationResult, JSONRepairLog } from "@/lib/types";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import {
  Code2,
  Copy,
  Download,
  Check,
  Wrench,
  AlertCircle,
  Sparkles,
  Upload,
  CheckCircle2,
  Undo2,
  Minimize2,
  ListTree,
} from "lucide-react";

const SAMPLE_VALID_JSON = `{
  "platform": "Tooltiva",
  "domain": "tooltiva.net",
  "version": 1.0,
  "privacyFirst": true,
  "supportedTools": [
    "CSV Delimiter Converter",
    "CSV to JSON Converter",
    "JSON Formatter"
  ],
  "metrics": {
    "serverUploads": 0,
    "clientExecutionPercent": 100
  }
}`;

const SAMPLE_BROKEN_JSON = `{
  // Developer notes and comments
  platform: 'Tooltiva',
  domain: 'tooltiva.net',
  features: ['Zero Server Uploads', 'Client-Side Speed',],
  unquoted_key: 'single-quoted value',
}`;

export function JSONFormatterClient() {
  const [inputJSON, setInputJSON] = useState<string>("");
  const [indent, setIndent] = useState<number>(2);
  const [validation, setValidation] = useState<JSONValidationResult | null>(null);
  const [repairs, setRepairs] = useState<JSONRepairLog[]>([]);
  const [originalBeforeRepair, setOriginalBeforeRepair] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"code" | "tree">("code");
  const [parsedObject, setParsedObject] = useState<unknown>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!inputJSON || inputJSON.trim() === "") {
      setValidation(null);
      setParsedObject(null);
      return;
    }

    startTransition(() => {
      const result = validateJSON(inputJSON);
      setValidation(result);

      if (result.isValid) {
        try {
          const parsed = JSON.parse(inputJSON);
          setParsedObject(parsed);
        } catch {
          setParsedObject(null);
        }
      } else {
        setParsedObject(null);
      }
    });
  }, [inputJSON]);

  const handleFormat = (spaces: number) => {
    setIndent(spaces);
    if (!inputJSON || !validation?.isValid) return;

    try {
      const parsed = JSON.parse(inputJSON);
      const formatted = JSON.stringify(parsed, null, spaces === 0 ? undefined : spaces);
      setInputJSON(formatted);
    } catch {
      // Ignored
    }
  };

  const handleAutoFix = () => {
    if (!inputJSON) return;
    setOriginalBeforeRepair(inputJSON);

    const { repaired, logs } = repairJSON(inputJSON);
    setRepairs(logs);

    // Format after repair if valid
    try {
      const parsed = JSON.parse(repaired);
      const formatted = JSON.stringify(parsed, null, indent === 0 ? undefined : indent);
      setInputJSON(formatted);
    } catch {
      setInputJSON(repaired);
    }
  };

  const handleUndoRepair = () => {
    if (originalBeforeRepair) {
      setInputJSON(originalBeforeRepair);
      setOriginalBeforeRepair(null);
      setRepairs([]);
    }
  };

  const loadSample = (valid: boolean) => {
    setRepairs([]);
    setOriginalBeforeRepair(null);
    setInputJSON(valid ? SAMPLE_VALID_JSON : SAMPLE_BROKEN_JSON);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setInputJSON(event.target?.result as string);
      setRepairs([]);
      setOriginalBeforeRepair(null);
    };
    reader.readAsText(file);
  };

  const handleCopy = async () => {
    if (!inputJSON) return;
    try {
      await navigator.clipboard.writeText(inputJSON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!inputJSON) return;
    const blob = new Blob([inputJSON], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `formatted_data_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simple nested interactive tree node
  const renderTree = (data: unknown, keyName?: string, depth = 0): React.ReactNode => {
    if (data === null) {
      return (
        <div style={{ paddingLeft: `${depth * 16}px` }} className="py-0.5 font-mono text-xs">
          {keyName && <span className="text-purple-600 dark:text-purple-400 font-semibold">{keyName}: </span>}
          <span className="text-slate-400 italic">null</span>
        </div>
      );
    }

    if (typeof data !== "object") {
      const isString = typeof data === "string";
      const isNum = typeof data === "number";
      const isBool = typeof data === "boolean";

      return (
        <div style={{ paddingLeft: `${depth * 16}px` }} className="py-0.5 font-mono text-xs">
          {keyName && <span className="text-purple-600 dark:text-purple-400 font-semibold">{keyName}: </span>}
          <span
            className={
              isString
                ? "text-emerald-600 dark:text-emerald-400"
                : isNum
                ? "text-blue-600 dark:text-blue-400"
                : isBool
                ? "text-amber-600 dark:text-amber-400 font-semibold"
                : "text-slate-700 dark:text-slate-300"
            }
          >
            {isString ? `"${data}"` : String(data)}
          </span>
        </div>
      );
    }

    const isArray = Array.isArray(data);
    const entries = isArray ? data.map((v, i) => [String(i), v]) : Object.entries(data);

    return (
      <div style={{ paddingLeft: `${depth * 16}px` }} className="py-0.5 font-mono text-xs">
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
          {keyName && <span className="text-purple-600 dark:text-purple-400 font-semibold">{keyName}: </span>}
          <span className="font-bold text-slate-500">
          {isArray ? `Array [${(data as unknown[]).length}]` : `Object {${entries.length}}`}
          </span>
        </div>
        <div className="border-l border-slate-200 dark:border-slate-800 ml-2 pl-1 space-y-0.5">
          {entries.map(([k, v]) => (
            <React.Fragment key={k}>{renderTree(v, isArray ? undefined : k, depth + 1)}</React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PrivacyBadge />

      <div className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-sm space-y-6">
        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          {/* Format Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Indent:
            </span>
            <button
              onClick={() => handleFormat(2)}
              disabled={!validation?.isValid}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                indent === 2
                  ? "bg-white dark:bg-slate-900 border-brand-500 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              2 Spaces
            </button>
            <button
              onClick={() => handleFormat(4)}
              disabled={!validation?.isValid}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                indent === 4
                  ? "bg-white dark:bg-slate-900 border-brand-500 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              4 Spaces
            </button>
            <button
              onClick={() => handleFormat(0)}
              disabled={!validation?.isValid}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                indent === 0
                  ? "bg-white dark:bg-slate-900 border-brand-500 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              } disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1`}
            >
              <Minimize2 className="w-3 h-3" />
              Minify
            </button>
          </div>

          {/* Sample Buttons & Auto-Fix */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoFix}
              disabled={!inputJSON || validation?.isValid}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              Auto-Fix Syntax
            </button>
            <button
              onClick={() => loadSample(false)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Load Broken Sample
            </button>
            <button
              onClick={() => loadSample(true)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-brand-500" />
              Valid Sample
            </button>
          </div>
        </div>

        {/* Validation Status Banner */}
        {validation && (
          <div>
            {validation.isValid ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Valid RFC 8259 JSON</span>
                </div>
                <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                  {inputJSON.length.toLocaleString()} characters • {(new Blob([inputJSON]).size / 1024).toFixed(2)} KB
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-rose-950 dark:text-rose-100">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Syntax Error: {validation.error?.message}</span>
                </div>
                {validation.error?.line && (
                  <div className="pl-6 font-mono text-[11px] text-rose-800 dark:text-rose-300">
                    Location: Line {validation.error.line}, Column {validation.error.column}
                    {validation.error.snippet && (
                      <div className="mt-1 p-2 rounded bg-rose-100/60 dark:bg-rose-900/40 text-rose-950 dark:text-rose-100 overflow-x-auto">
                        {validation.error.snippet}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Explicit Repairs Applied Audit Log */}
        {repairs.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-100">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                Repairs Applied ({repairs.reduce((a, b) => a + b.count, 0)} modifications):
              </span>
              {originalBeforeRepair && (
                <button
                  onClick={handleUndoRepair}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:underline"
                >
                  <Undo2 className="w-3 h-3" />
                  Undo Auto-Repair
                </button>
              )}
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
              {repairs.map((r, i) => (
                <li key={i}>
                  <strong className="capitalize">{r.rule.replace(/-/g, " ")}:</strong> {r.description} ({r.count}x)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Input / Editor Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-500" />
                JSON Editor
              </label>

              {validation?.isValid && (
                <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                  <button
                    onClick={() => setViewMode("code")}
                    className={`px-2 py-0.5 rounded ${
                      viewMode === "code"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Raw Text
                  </button>
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                      viewMode === "tree"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <ListTree className="w-3 h-3" />
                    Tree View
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Upload .JSON
                <input
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {inputJSON && (
                <button
                  onClick={() => {
                    setInputJSON("");
                    setRepairs([]);
                    setOriginalBeforeRepair(null);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {viewMode === "code" || !validation?.isValid ? (
            <textarea
              aria-label="JSON editor"
              value={inputJSON}
              onChange={(e) => setInputJSON(e.target.value)}
              placeholder="Paste JSON here, drag and drop a file, or click 'Load Broken Sample'..."
              rows={14}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y"
            />
          ) : (
            <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 max-h-96 overflow-y-auto">
              {parsedObject ? renderTree(parsedObject) : <span className="text-xs text-slate-400">Empty tree</span>}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleCopy}
            disabled={!inputJSON}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy JSON"}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!inputJSON}
            className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
