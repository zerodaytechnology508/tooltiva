"use client";

import React, { useId, useState } from "react";
import { ChevronDown, Lock } from "lucide-react";

export function PrivacyBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3 text-sm text-slate-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-slate-300">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="flex items-start gap-2.5 leading-6">
          <Lock aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-400" />
          <span>
            <span className="font-semibold text-slate-900 dark:text-white">Processed in your browser.</span> Your files
            and text are never uploaded or included in analytics.
          </span>
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-md pl-6 font-medium text-brand-800 hover:underline sm:self-auto sm:pl-0 dark:text-brand-300"
        >
          How to check
          <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div id={panelId} hidden={!isOpen} className="mt-3 border-t border-brand-200 pt-3 leading-6 dark:border-brand-900">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Open your browser&apos;s developer tools (<kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-xs dark:border-slate-600 dark:bg-slate-800">F12</kbd>{" "}
            or right-click → Inspect) and choose the Network tab.
          </li>
          <li>Clear the list, then paste your data or upload a file and run the tool.</li>
          <li>
            No request carries your input or file contents. If you allowed optional analytics, separate page-visit
            requests may appear.
          </li>
        </ol>
      </div>
    </div>
  );
}
