"use client";

import React, { useId, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { AlertCircle, Download, X } from "lucide-react";
import { isFormulaRisk, neutralizeFormulaCells, withExcelBOM } from "@/lib/csv-utils";
import { contactsToTable, parseVCF } from "@/lib/vcard";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { DataPreviewTable } from "@/components/DataPreviewTable";
import {
  CSVFileInput,
  buttonClass,
  downloadBlob,
  fieldClass,
  fileStem,
  primaryButtonClass,
  type LoadedFile,
} from "@/components/tools/csv-ui";

const SAMPLE_VCF = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "N:Khan;Ayesha;;;",
  "FN:Ayesha Khan",
  "ORG:Khan Traders",
  "TEL;TYPE=CELL:+92 300 1234567",
  "TEL;TYPE=WORK:+92 42 35761234",
  "EMAIL;TYPE=INTERNET:ayesha.khan@example.com",
  "ADR;TYPE=WORK:;;12 Mall Road;Lahore;Punjab;54000;Pakistan",
  "END:VCARD",
  "BEGIN:VCARD",
  "VERSION:3.0",
  "N:O'Brien;Liam;;Dr.;",
  "FN:Dr. Liam O'Brien",
  "item1.TEL:+353 87 123 4567",
  "item1.X-ABLabel:_$!<Mobile>!$_",
  "EMAIL;TYPE=INTERNET,WORK:liam@acme.example",
  "NOTE:Met at the trade fair\\, booth 4.",
  "END:VCARD",
  "BEGIN:VCARD",
  "VERSION:2.1",
  "N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D9=85=D9=84=DA=A9;=DB=81=DB=8C=D8=B1=D8=A7;;;",
  "FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=DB=81=DB=8C=D8=B1=D8=A7=20=D9=85=D9=84=DA=A9",
  "TEL;CELL:0333 9876543",
  "END:VCARD",
  "BEGIN:VCARD",
  "VERSION:4.0",
  "FN:Sofia Rossi",
  "TEL;VALUE=uri;TYPE=\"voice,work\":tel:+39-02-1234567",
  "EMAIL:sofia.rossi@example.com",
  "BDAY:1990-04-12",
  "END:VCARD",
].join("\r\n");

const DELIMITERS = [
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab" },
];
const PREVIEW_ROWS = 100;

export function VCFToCSVClient() {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [delimiter, setDelimiter] = useState(",");
  const [formulaSafe, setFormulaSafe] = useState(true);
  const [, startTransition] = useTransition();
  const ids = useId();

  const parsed = useMemo(() => (file ? parseVCF(file.text) : null), [file]);
  const table = useMemo(() => (parsed && parsed.contacts.length > 0 ? contactsToTable(parsed.contacts) : null), [parsed]);
  const formulaCount = useMemo(() => {
    if (!table) return 0;
    let n = 0;
    for (const row of table.rows) for (const cell of row) if (isFormulaRisk(cell)) n++;
    return n;
  }, [table]);

  const load = (next: LoadedFile) => startTransition(() => setFile(next));

  const download = () => {
    if (!table || !file) return;
    const rows = neutralizeFormulaCells([table.headers, ...table.rows], formulaSafe).rows;
    const csv = Papa.unparse(rows, { delimiter });
    downloadBlob(new Blob([withExcelBOM(csv)], { type: "text/csv;charset=utf-8;" }), `${fileStem(file.name)}.csv`);
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <CSVFileInput
            onLoad={load}
            sample={{ name: "sample-contacts.vcf", text: SAMPLE_VCF }}
            kind="VCF"
            accept=".vcf,.vcard,text/vcard,text/x-vcard,text/directory,text/plain"
            formatsHint=".vcf or .vcard, one or many contacts"
            pastePlaceholder={"BEGIN:VCARD\nVERSION:3.0\nFN:Ayesha Khan\nTEL:+92 300 1234567\nEND:VCARD"}
          />
        </div>
      </div>
    );
  }

  const count = parsed?.contacts.length ?? 0;

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="min-w-0 truncate text-base font-semibold text-slate-900 dark:text-white" title={file.name}>
            {file.name}
          </p>
          <button type="button" onClick={() => setFile(null)} className={buttonClass}>
            <X aria-hidden="true" className="h-4 w-4" />
            Open another file
          </button>
        </div>

        {file.notice && (
          <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            {file.notice}
          </p>
        )}

        {parsed && count === 0 && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {parsed.notVCard
                ? "This is not a VCF file: no contact starts with BEGIN:VCARD. If it is a spreadsheet of contacts, use the CSV to VCF converter instead."
                : "The file has no contacts with a name, phone number, email or company."}
            </p>
          </div>
        )}

        {table && parsed && (
          <section aria-labelledby={`${ids}-result`} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${ids}-result`} aria-live="polite" className="text-base font-semibold text-slate-900 dark:text-white">
                {count.toLocaleString()} {count === 1 ? "contact" : "contacts"} · {table.headers.length} columns
              </h2>
              <button type="button" onClick={download} className={primaryButtonClass}>
                <Download aria-hidden="true" className="h-4 w-4" />
                Download CSV
              </button>
            </div>
            {parsed.skippedEmpty > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {parsed.skippedEmpty.toLocaleString()} empty {parsed.skippedEmpty === 1 ? "card was" : "cards were"} skipped.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">Separator</span>
                <select value={delimiter} onChange={(e) => setDelimiter(e.target.value)} className={fieldClass}>
                  {DELIMITERS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={formulaSafe} onChange={(e) => setFormulaSafe(e.target.checked)} className="h-4 w-4 accent-brand-700" />
                Spreadsheet-safe output
              </label>
            </div>
            {formulaCount > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {formulaCount.toLocaleString()} {formulaCount === 1 ? "value starts" : "values start"} with + or - and spaces,
                such as +92 300 1234567. {formulaSafe
                  ? "Spreadsheet-safe output adds an apostrophe so Excel shows them as text instead of trying to calculate them."
                  : "Excel may try to calculate them as formulas; turn on spreadsheet-safe output for Excel."}
              </p>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Opening the CSV in Excel? Excel can show long phone numbers such as +923001234567 as 9.23E+11. Import it
              with Data &gt; From Text/CSV and set the phone columns to Text, as shown in{" "}
              <Link href="/guides/excel-leading-zeros-csv/" className="font-medium text-brand-700 underline dark:text-brand-400">
                this guide
              </Link>
              .
            </p>
            <DataPreviewTable headers={table.headers} rows={table.rows.slice(0, PREVIEW_ROWS)} totalRowCount={table.rows.length} />
          </section>
        )}
      </div>
    </div>
  );
}
