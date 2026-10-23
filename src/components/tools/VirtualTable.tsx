"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortState } from "@/lib/csv-viewer";

const ROW_HEIGHT = 36;
const OVERSCAN = 12;

/**
 * A table that renders only the rows in view, so files with hundreds of
 * thousands of rows stay responsive. The header stays visible while
 * scrolling, and the row-number column stays visible when scrolling sideways.
 */
export function VirtualTable({
  headers,
  rows,
  indices,
  widths,
  sort,
  onSort,
  height = 560,
  label,
}: {
  headers: string[];
  rows: string[][];
  /** Rows to show, in display order, as indices into `rows`. */
  indices: number[];
  widths: number[];
  sort: SortState | null;
  onSort: (column: number) => void;
  height?: number;
  label: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(height);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => setViewport(el.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Back to the top when the shown rows change (new search, sort or file).
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
    setScrollTop(0);
  }, [indices]);

  const onScroll = useCallback(() => {
    if (scroller.current) setScrollTop(scroller.current.scrollTop);
  }, []);

  const total = indices.length;
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(total, Math.ceil((scrollTop + viewport) / ROW_HEIGHT) + OVERSCAN);
  const numberWidth = Math.max(56, String(rows.length).length * 9 + 28);
  const tableWidth = numberWidth + widths.reduce((sum, w) => sum + w, 0);

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      tabIndex={0}
      role="region"
      aria-label={`${label}, scrollable`}
      className="relative overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      style={{ maxHeight: height }}
    >
      <table
        aria-label={label}
        aria-rowcount={total + 1}
        className="table-fixed border-separate border-spacing-0 text-sm"
        style={{ width: tableWidth }}
      >
        <colgroup>
          <col style={{ width: numberWidth }} />
          {widths.map((w, c) => (
            <col key={c} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr aria-rowindex={1}>
            <th
              scope="col"
              className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-slate-100 px-3 text-right font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              style={{ height: ROW_HEIGHT }}
            >
              #
            </th>
            {headers.map((name, c) => {
              const active = sort?.column === c;
              const ariaSort = active ? (sort!.direction === "asc" ? "ascending" : "descending") : "none";
              return (
                <th
                  key={c}
                  scope="col"
                  aria-sort={ariaSort}
                  className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-100 p-0 text-left font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  style={{ height: ROW_HEIGHT }}
                >
                  <button
                    type="button"
                    onClick={() => onSort(c)}
                    title={`${name} — sort`}
                    className="flex h-full w-full items-center justify-between gap-2 px-3 text-left hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <span className="truncate">{name}</span>
                    {active ? (
                      sort!.direction === "asc" ? (
                        <ArrowUp aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-400" />
                      ) : (
                        <ArrowDown aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-400" />
                      )
                    ) : (
                      <ArrowUpDown aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
                    )}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {first > 0 && (
            <tr aria-hidden="true">
              <td colSpan={headers.length + 1} style={{ height: first * ROW_HEIGHT, padding: 0 }} />
            </tr>
          )}
          {indices.slice(first, last).map((rowIndex, offset) => {
            const position = first + offset;
            const row = rows[rowIndex];
            return (
              <tr
                key={rowIndex}
                aria-rowindex={position + 2}
                className="odd:bg-white even:bg-slate-50 hover:bg-brand-50 dark:odd:bg-slate-900 dark:even:bg-slate-950 dark:hover:bg-slate-800"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-3 text-right font-mono text-xs font-normal text-slate-600 dark:border-slate-800 dark:text-slate-400"
                  style={{ height: ROW_HEIGHT }}
                >
                  {rowIndex + 1}
                </th>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    title={cell.length > 30 || cell.includes("\n") ? cell : undefined}
                    className="truncate whitespace-nowrap border-b border-r border-slate-200 px-3 text-slate-800 dark:border-slate-800 dark:text-slate-200"
                    style={{ height: ROW_HEIGHT, maxWidth: widths[c] }}
                  >
                    {cell.includes("\n") ? cell.replace(/\r?\n/g, " ↵ ") : cell}
                  </td>
                ))}
              </tr>
            );
          })}
          {last < total && (
            <tr aria-hidden="true">
              <td colSpan={headers.length + 1} style={{ height: (total - last) * ROW_HEIGHT, padding: 0 }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
