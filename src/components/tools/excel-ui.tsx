"use client";

import React, { useCallback, useId, useRef, useState } from "react";
import { FileUp, Sparkles, X } from "lucide-react";
import { openXlsx, XlsxError, type Sheet, type Workbook } from "@/lib/xlsx-read";
import { createXlsx, dateToSerial } from "@/lib/xlsx-write";
import { buttonClass, fieldClass, primaryButtonClass } from "@/components/tools/csv-ui";

export const EXCEL_ACCEPT =
  ".xlsx,.xlsm,.xls,.xlsb,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.ms-excel";

/** A small workbook that shows what the converter keeps: leading zeros, dates, formats, formulas, two sheets. */
export function sampleWorkbook(): Uint8Array {
  return createXlsx([
    {
      name: "Customers",
      widths: [13, 22, 10, 12, 12, 10, 8],
      rows: [
        ["Customer ID", "Name", "Postcode", "Joined", "Balance", "Discount", "Active"],
        ["00123", "Ayesha Khan", { value: 54000, format: "00000" }, { value: dateToSerial(2024, 1, 31), format: "dd/mm/yyyy" }, { value: 1250.5, format: "#,##0.00" }, { value: 0.1, format: "0%" }, true],
        ["00124", "Chen, Wei", { value: 2134, format: "00000" }, { value: dateToSerial(2024, 2, 29), format: "dd/mm/yyyy" }, { value: -30, format: "#,##0.00" }, { value: 0, format: "0%" }, false],
        ["00125", 'Liam "Lee" O\'Brien', { value: 501, format: "00000" }, { value: dateToSerial(2024, 4, 2), format: "dd/mm/yyyy" }, { value: 98765.432, format: "#,##0.00" }, { value: 0.125, format: "0.0%" }, true],
        ["00126", "ہیرا ملک", { value: 75500, format: "00000" }, { value: dateToSerial(2024, 7, 15), format: "dd/mm/yyyy" }, { value: 0, format: "#,##0.00" }, { value: 0.05, format: "0%" }, true],
      ],
    },
    {
      name: "Orders",
      widths: [10, 13, 8, 10, 10],
      rows: [
        ["Order", "Customer ID", "Qty", "Price", "Total"],
        ["A-1001", "00123", 3, { value: 9.99, format: "0.00" }, { formula: "C2*D2", value: 29.97, format: "#,##0.00" }],
        ["A-1002", "00125", 12, { value: 4.5, format: "0.00" }, { formula: "C3*D3", value: 54, format: "#,##0.00" }],
        ["A-1003", "00124", 1, { value: 120, format: "0.00" }, { formula: "C4*D4", value: 120, format: "#,##0.00" }],
      ],
    },
  ]);
}

export interface OpenedWorkbook {
  name: string;
  size: number;
  workbook: Workbook;
}

/** Open a workbook file in the browser and pick a sheet. */
export function useExcelWorkbook() {
  const [opened, setOpened] = useState<OpenedWorkbook | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectSheet = useCallback(async (wb: Workbook, index: number) => {
    setSheetIndex(index);
    setBusy(true);
    try {
      setSheet(await wb.readSheet(index));
      setError(null);
    } catch (e) {
      setSheet(null);
      setError(e instanceof XlsxError ? e.message : "This sheet could not be read.");
    } finally {
      setBusy(false);
    }
  }, []);

  const openBytes = useCallback(
    async (name: string, bytes: Uint8Array) => {
      setBusy(true);
      setError(null);
      try {
        const workbook = await openXlsx(bytes);
        setOpened({ name, size: bytes.length, workbook });
        // Start on the first visible worksheet.
        const first = workbook.sheets.findIndex((s) => s.isWorksheet && !s.hidden);
        await selectSheet(workbook, first >= 0 ? first : 0);
      } catch (e) {
        setOpened(null);
        setSheet(null);
        setError(e instanceof XlsxError ? e.message : "The workbook could not be read. If it opens in Excel, save it again as .xlsx and try once more.");
        setBusy(false);
      }
    },
    [selectSheet]
  );

  const openFile = useCallback(
    async (file: File) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await openBytes(file.name, bytes);
    },
    [openBytes]
  );

  const reset = useCallback(() => {
    setOpened(null);
    setSheet(null);
    setError(null);
    setSheetIndex(0);
  }, []);

  return { opened, sheet, sheetIndex, error, busy, openFile, openBytes, selectSheet, reset };
}

export function ExcelFileInput({
  onFile,
  onSample,
  error,
  busy,
}: {
  onFile: (file: File) => void;
  onSample: () => void;
  error: string | null;
  busy: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging ? "border-brand-600 bg-brand-50 dark:bg-brand-950/40" : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
        }`}
      >
        <FileUp aria-hidden="true" className="h-8 w-8 text-brand-700 dark:text-brand-400" />
        <p className="text-base font-semibold text-slate-900 dark:text-white">Drop an Excel file here</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">.xlsx or .xlsm — the file stays on your device</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className={primaryButtonClass}>
            <FileUp aria-hidden="true" className="h-4 w-4" />
            Open Excel file
          </button>
          <button type="button" disabled={busy} onClick={onSample} className={buttonClass}>
            <Sparkles aria-hidden="true" className="h-4 w-4 text-brand-700 dark:text-brand-400" />
            Load sample
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept={EXCEL_ACCEPT}
          className="sr-only"
          aria-label="Choose an Excel file"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />
      </div>
      {busy && (
        <p role="status" className="text-sm text-slate-600 dark:text-slate-400">
          Reading the workbook…
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}

/** File name, sheet choice and notes about the sheet. */
export function WorkbookHeader({
  opened,
  sheet,
  sheetIndex,
  onSelect,
  onReset,
  busy,
}: {
  opened: OpenedWorkbook;
  sheet: Sheet | null;
  sheetIndex: number;
  onSelect: (index: number) => void;
  onReset: () => void;
  busy: boolean;
}) {
  const { workbook } = opened;
  const notes: string[] = [];
  if (sheet) {
    if (sheet.formulaCount > 0) {
      notes.push(
        `${sheet.formulaCount.toLocaleString()} ${sheet.formulaCount === 1 ? "formula gives" : "formulas give"} the result last calculated in Excel.`
      );
    }
    if (sheet.formulasWithoutValue > 0) {
      notes.push(
        `${sheet.formulasWithoutValue.toLocaleString()} ${sheet.formulasWithoutValue === 1 ? "formula has" : "formulas have"} no saved result and ${sheet.formulasWithoutValue === 1 ? "is" : "are"} left empty. Open the file in Excel, save it, and convert it again.`
      );
    }
    if (sheet.mergedRanges > 0) notes.push("Merged cells keep their value in the first cell only, as in Excel's own CSV export.");
    if (sheet.rows.length > 0 && (sheet.firstRow > 1 || sheet.firstColumn > 1)) {
      notes.push(`The data starts at cell ${columnName(sheet.firstColumn)}${sheet.firstRow}; empty rows and columns before it are left out.`);
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900 dark:text-white" title={opened.name}>
            {opened.name}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {workbook.sheets.length} {workbook.sheets.length === 1 ? "sheet" : "sheets"} · {formatBytes(opened.size)}
          </p>
        </div>
        <button type="button" onClick={onReset} className={buttonClass}>
          <X aria-hidden="true" className="h-4 w-4" />
          Open another file
        </button>
      </div>
      {workbook.sheets.length > 1 && (
        <SelectField label="Sheet" inline value={sheetIndex} disabled={busy} onChange={(v) => onSelect(Number(v))}>
          {workbook.sheets.map((s, i) => (
            <option key={i} value={i} disabled={!s.isWorksheet}>
              {s.name}
              {s.hidden ? " (hidden)" : ""}
              {!s.isWorksheet ? " (chart)" : ""}
            </option>
          ))}
        </SelectField>
      )}
      {notes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function columnName(n: number): string {
  let s = "";
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Name for a downloaded file: workbook name plus sheet name, without characters file systems reject. */
export function outputName(workbookName: string, sheetName: string | null, extension: string): string {
  const stem = workbookName.replace(/\.(xlsx|xlsm|xls|xlsb|ods)$/i, "");
  const part = sheetName ? `-${sheetName}` : "";
  return `${stem}${part}`.replace(/[\\/:*?"<>|]+/g, "_").trim() + `.${extension}`;
}

/** A labelled dropdown whose accessible name is just the label text. */
export function SelectField({
  label,
  value,
  onChange,
  disabled,
  children,
  inline = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  inline?: boolean;
}) {
  const id = useId();
  return (
    <div className={inline ? "flex flex-wrap items-center gap-2 text-sm" : "flex flex-col gap-1.5 text-sm"}>
      <label htmlFor={id} className="font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {children}
      </select>
    </div>
  );
}
