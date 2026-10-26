import React from "react";
import { Table, AlertCircle } from "lucide-react";

interface DataPreviewTableProps {
  headers: string[];
  rows: string[][];
  totalRowCount: number;
  warnings?: string[];
}

export function DataPreviewTable({
  headers,
  rows,
  totalRowCount,
  warnings = [],
}: DataPreviewTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
        <Table className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm font-medium">No tabular data to preview yet.</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Paste data or upload a file to preview structured rows and columns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
            Table Preview
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-xs">
            {totalRowCount.toLocaleString()} {totalRowCount === 1 ? "row" : "rows"} × {headers.length} cols
          </span>
          {rows.length < totalRowCount && (
            <span className="text-slate-500 dark:text-slate-400 italic text-xs">
              (showing first {rows.length} rows)
            </span>
          )}
        </div>
      </div>

      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            {warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Responsive Table Container */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto max-h-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600" tabIndex={0} role="region" aria-label="Table preview, scrollable">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-mono font-semibold text-slate-500 dark:text-slate-400 w-12 text-center border-r border-slate-200 dark:border-slate-800">
                  #
                </th>
                {headers.map((head, idx) => (
                  <th
                    key={idx}
                    className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                  >
                    {head || `Col ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-center border-r border-slate-100 dark:border-slate-800 select-none bg-slate-50/50 dark:bg-slate-850">
                    {rIdx + 1}
                  </td>
                  {headers.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate border-r border-slate-100 dark:border-slate-800 last:border-r-0"
                      title={row[cIdx] || ""}
                    >
                      {row[cIdx] !== undefined ? row[cIdx] : (
                        <span className="text-slate-500 dark:text-slate-400 italic">null</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
