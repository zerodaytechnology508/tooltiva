"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";

export function PrivacyBadge() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-3.5 transition-all text-xs text-emerald-900 dark:text-emerald-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-emerald-950 dark:text-emerald-100 mr-1.5">
              Local Tool Processing:
            </span>
            <span>Your files and text are processed in your browser and are not sent to a processing server or included in analytics.</span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:underline shrink-0 text-xs px-2 py-1 rounded"
        >
          <span>{isOpen ? "Hide Verification" : "Verify Yourself"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-2 text-emerald-900/90 dark:text-emerald-200/90 text-xs leading-relaxed">
          <p className="font-semibold text-emerald-950 dark:text-emerald-100">
            Verify Tooltiva&apos;s local-processing behavior in under 15 seconds:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Press <kbd className="px-1.5 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900 font-mono text-[11px]">F12</kbd> (or right-click → <span className="font-medium">Inspect</span>) in your browser.</li>
            <li>Click on the <span className="font-medium">Network</span> tab and clear all existing logs.</li>
            <li>Paste your data or upload a file and run the conversion.</li>
            <li>Tool conversions do not send your input or file contents. If you accepted optional analytics, separate general site-usage requests may appear.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
