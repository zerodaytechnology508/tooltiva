"use client";

import React, { useState, useEffect, useTransition } from "react";
import { repairJSON } from "@/lib/json-utils";
import { formatJSON, parseJSONDocument } from "@/lib/json-ast";
import type { JSONNode, JSONParseSuccess } from "@/lib/json-ast";
import { readTextFile } from "@/lib/file-text";
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
  // The lossless parse result: keeps exact number text and duplicate keys.
  const [parsed, setParsed] = useState<JSONParseSuccess | null>(null);
  const [fileNotice, setFileNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!inputJSON || inputJSON.trim() === "") {
      setValidation(null);
      setParsed(null);
      return;
    }

    startTransition(() => {
      const result = parseJSONDocument(inputJSON);
      if (result.ok) {
        setValidation({ isValid: true });
        setParsed(result);
      } else {
        setValidation({
          isValid: false,
          error: {
            message: result.message,
            line: result.line,
            column: result.column,
            snippet: result.snippet,
            pointer: result.pointer,
          },
        });
        setParsed(null);
      }
    });
  }, [inputJSON]);

  const handleFormat = (spaces: number) => {
    setIndent(spaces);
    if (!inputJSON || !parsed) return;
    // Re-indent from the lossless tree: numbers, strings and duplicate keys are
    // written exactly as they were, so only whitespace changes.
    setInputJSON(formatJSON(parsed.root, spaces));
  };

  const handleAutoFix = () => {
    if (!inputJSON) return;
    setOriginalBeforeRepair(inputJSON);

    const { repaired, logs } = repairJSON(inputJSON);
    setRepairs(logs);

    // Format after repair if the result is valid; otherwise show the repaired
    // text so the remaining error is reported with its exact position.
    const result = parseJSONDocument(repaired);
    setInputJSON(result.ok ? formatJSON(result.root, indent) : repaired);
  };

  const handleUndoRepair = () => {
    if (originalBeforeRepair) {
      setInputJSON(originalBeforeRepair);
      setOriginalBeforeRepair(null);
      setRepairs([]);
    }
  };

  const loadSample = (valid: boolean) => {
    setFileNotice(null);
    setRepairs([]);
    setOriginalBeforeRepair(null);
    setInputJSON(valid ? SAMPLE_VALID_JSON : SAMPLE_BROKEN_JSON);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    // Reset so choosing the same file again still triggers a change event.
    input.value = "";
    if (!file) return;

    try {
      const { text, notice } = await readTextFile(file);
      setInputJSON(text);
      setFileNotice(notice ?? null);
      setRepairs([]);
      setOriginalBeforeRepair(null);
    } catch (err: unknown) {
      console.error("Tooltiva could not read the file:", err);
      setFileNotice("The file could not be read. Please try again or paste its contents instead.");
    }
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

  // Tree view of the lossless parse: values are shown exactly as written.
  const renderTree = (node: JSONNode, keyName?: string, depth = 0): React.ReactNode => {
    const label = keyName !== undefined && (
      <span className="text-purple-600 dark:text-purple-400 font-semibold">{keyName}: </span>
    );

    if (node.type !== "object" && node.type !== "array") {
      const text =
        node.type === "null" ? "null" : node.type === "boolean" ? String(node.value) : node.raw;
      const tone =
        node.type === "string"
          ? "text-brand-700 dark:text-brand-400"
          : node.type === "number"
          ? "text-blue-600 dark:text-blue-400"
          : node.type === "boolean"
          ? "text-amber-600 dark:text-amber-400 font-semibold"
          : "text-slate-500 italic";
      return (
        <div style={{ paddingLeft: `${depth * 16}px` }} className="py-0.5 font-mono text-sm">
          {label}
          <span className={tone}>{text}</span>
        </div>
      );
    }

    const children =
      node.type === "array"
        ? node.items.map((item) => ({ key: undefined as string | undefined, value: item }))
        : node.entries.map((entry) => ({ key: entry.key, value: entry.value }));

    return (
      <div style={{ paddingLeft: `${depth * 16}px` }} className="py-0.5 font-mono text-sm">
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
          {label}
          <span className="font-bold text-slate-500">
            {node.type === "array" ? `Array [${children.length}]` : `Object {${children.length}}`}
          </span>
        </div>
        <div className="border-l border-slate-200 dark:border-slate-800 ml-2 pl-1 space-y-0.5">
          {children.map((child, i) => (
            <React.Fragment key={i}>{renderTree(child.value, child.key, depth + 1)}</React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Facts about valid input that JSON.parse-based tools would hide or change.
  const dataNotices: string[] = [];
  if (parsed && parsed.duplicateKeyCount > 0) {
    const examples = parsed.duplicateKeys
      .slice(0, 3)
      .map((d) => `"${d.key}" in ${d.path} (line ${d.line}, column ${d.column})`)
      .join(", ");
    dataNotices.push(
      `${parsed.duplicateKeyCount} duplicate key(s): ${examples}. JSON allows this, but most programs keep only the last value. Formatting here keeps every occurrence.`
    );
  }
  if (parsed && parsed.unsafeIntegerCount > 0) {
    dataNotices.push(
      `${parsed.unsafeIntegerCount} integer(s) are too large for JavaScript to store exactly (for example ${parsed.unsafeIntegers[0].raw} at ${parsed.unsafeIntegers[0].path}). Tooltiva keeps them exactly as written, but other tools may round them.`
    );
  }

  return (
    <div className="space-y-8">
      <PrivacyBadge />

      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-6">
        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          {/* Format Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Indent:
            </span>
            <button
              onClick={() => handleFormat(2)}
              type="button"
              aria-pressed={indent === 2}
              disabled={!validation?.isValid}
              className={`px-3 py-1.5 rounded-xl border text-sm font-semibold transition-colors ${
                indent === 2
                  ? "bg-white dark:bg-slate-900 border-brand-500 text-brand-700 dark:text-brand-400 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              2 Spaces
            </button>
            <button
              onClick={() => handleFormat(4)}
              type="button"
              aria-pressed={indent === 4}
              disabled={!validation?.isValid}
              className={`px-3 py-1.5 rounded-xl border text-sm font-semibold transition-colors ${
                indent === 4
                  ? "bg-white dark:bg-slate-900 border-brand-500 text-brand-700 dark:text-brand-400 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              4 Spaces
            </button>
            <button
              onClick={() => handleFormat(0)}
              type="button"
              aria-pressed={indent === 0}
              disabled={!validation?.isValid}
              className={`px-3 py-1.5 rounded-xl border text-sm font-semibold transition-colors ${
                indent === 0
                  ? "bg-white dark:bg-slate-900 border-brand-500 text-brand-700 dark:text-brand-400 shadow-sm"
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
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              Auto-Fix Syntax
            </button>
            <button
              onClick={() => loadSample(false)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Load Broken Sample
            </button>
            <button
              onClick={() => loadSample(true)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-brand-700" />
              Valid Sample
            </button>
          </div>
        </div>

        {/* Validation Status Banner */}
        {validation && (
          <div>
            {validation.isValid ? (
              <div className="p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/80 text-brand-900 dark:text-brand-200 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-brand-700 dark:text-brand-400" />
                  <span>Valid RFC 8259 JSON</span>
                </div>
                <div className="font-mono text-xs text-brand-700 dark:text-brand-300">
                  {inputJSON.length.toLocaleString()} characters • {(new Blob([inputJSON]).size / 1024).toFixed(2)} KB
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-sm space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-rose-950 dark:text-rose-100">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Syntax Error: {validation.error?.message}</span>
                </div>
                {validation.error?.line && (
                  <div className="pl-6 font-mono text-xs text-rose-800 dark:text-rose-300">
                    Location: Line {validation.error.line}, Column {validation.error.column}
                    {validation.error.snippet !== undefined && (
                      <pre className="mt-1 p-2 rounded bg-rose-100/60 dark:bg-rose-900/40 text-rose-950 dark:text-rose-100 overflow-x-auto whitespace-pre">
                        {validation.error.snippet}
                        {validation.error.pointer && `\n${validation.error.pointer}`}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {dataNotices.length > 0 && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm space-y-1"
          >
            {dataNotices.map((notice, i) => (
              <p key={i} className="flex items-start gap-2">
                <AlertCircle aria-hidden="true" className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>{notice}</span>
              </p>
            ))}
          </div>
        )}

        {/* Explicit Repairs Applied Audit Log */}
        {repairs.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-100">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                Repairs Applied ({repairs.reduce((a, b) => a + b.count, 0)} modifications):
              </span>
              {originalBeforeRepair && (
                <button
                  onClick={handleUndoRepair}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline"
                >
                  <Undo2 className="w-3 h-3" />
                  Undo Auto-Repair
                </button>
              )}
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-xs">
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
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-brand-700" />
                JSON Editor
              </label>

              {validation?.isValid && (
                <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                  <button
                    onClick={() => setViewMode("code")}
                    type="button"
                    aria-pressed={viewMode === "code"}
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
                    type="button"
                    aria-pressed={viewMode === "tree"}
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
              <label className="cursor-pointer text-sm font-medium text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1">
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
                    setFileNotice(null);
                    setRepairs([]);
                    setOriginalBeforeRepair(null);
                  }}
                  className="rounded text-sm font-medium text-slate-600 hover:text-rose-700 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {fileNotice && (
            <p role="status" className="text-sm text-amber-800 dark:text-amber-300">
              {fileNotice}
            </p>
          )}

          {viewMode === "code" || !validation?.isValid ? (
            <textarea
              wrap="off"
              spellCheck={false}
              aria-label="JSON editor"
              value={inputJSON}
              onChange={(e) => setInputJSON(e.target.value)}
              placeholder="Paste JSON here, drag and drop a file, or click 'Load Broken Sample'..."
              rows={14}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y"
            />
          ) : (
            <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 max-h-96 overflow-y-auto">
              {parsed ? renderTree(parsed.root) : <span className="text-sm text-slate-500">Empty tree</span>}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleCopy}
            disabled={!inputJSON}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-brand-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy JSON"}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!inputJSON}
            className="px-3.5 py-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
