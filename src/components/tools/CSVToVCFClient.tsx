"use client";

import React, { useId, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, Download, Phone, Mail, X } from "lucide-react";
import { detectDelimiter, parseCSVRows } from "@/lib/csv-utils";
import { buildViewerTable } from "@/lib/csv-viewer";
import { contactsToVCF, guessMapping, rowsToContacts, type ColumnMapping, type ContactField } from "@/lib/vcard";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import {
  CSVFileInput,
  DELIMITER_NAMES,
  buttonClass,
  downloadBlob,
  fieldClass,
  fileStem,
  primaryButtonClass,
  type LoadedFile,
} from "@/components/tools/csv-ui";

const SAMPLE_CSV = [
  "Name,Mobile No.,WhatsApp,Email,Company,City",
  "Ayesha Khan,0300 1234567,0300 1234567,ayesha.khan@example.com,Khan Traders,Lahore",
  "Bilal Ahmed,0321-7654321 / 042 35761234,,bilal@example.com,,Lahore",
  "Sofia Rossi,+39 02 1234567,,sofia.rossi@example.com,Rossi Design,Milan",
  "Chen Wei,+86 10 6552 9988,,,Wei Imports,Beijing",
  "Hira Malik,0333 9876543,0333 9876543,,,Karachi",
  '"O\'Brien, Liam",+353 87 123 4567,,liam@example.com,Acme Inc.,Cork',
].join("\n");

const FIELDS: { key: ContactField; label: string }[] = [
  { key: "fullName", label: "Full name" },
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "phone1", label: "Phone 1" },
  { key: "phone2", label: "Phone 2" },
  { key: "phone3", label: "Phone 3" },
  { key: "email1", label: "Email 1" },
  { key: "email2", label: "Email 2" },
  { key: "organization", label: "Company" },
  { key: "title", label: "Job title" },
  { key: "address", label: "Address" },
  { key: "birthday", label: "Birthday" },
  { key: "note", label: "Note" },
];
const PREVIEW = 6;

export function CSVToVCFClient() {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [useCountryCode, setUseCountryCode] = useState(false);
  const [countryCode, setCountryCode] = useState("+92");
  const [, startTransition] = useTransition();
  const ids = useId();

  const parsed = useMemo(() => {
    if (!file) return null;
    const delimiter = detectDelimiter(file.text);
    const result = parseCSVRows(file.text, delimiter);
    if (result.fatalError) {
      return { delimiter, error: result.fatalError.replace("Nothing was converted.", "Fix the file and open it again."), table: null };
    }
    if (result.rows.length === 0) return { delimiter, error: "The file has no rows.", table: null };
    return { delimiter, error: null, table: buildViewerTable(result.rows, hasHeader) };
  }, [file, hasHeader]);
  const table = parsed?.table ?? null;

  // The mapping is guessed whenever the table changes; the user can then adjust it.
  const guessed = useMemo(() => (table ? guessMapping(table.headers, table.rows) : null), [table]);
  const activeMapping = mapping ?? guessed;

  const result = useMemo(() => {
    if (!table || !activeMapping) return null;
    return rowsToContacts(table.rows, activeMapping, { countryCode: useCountryCode ? countryCode : "" });
  }, [table, activeMapping, useCountryCode, countryCode]);

  const load = (next: LoadedFile) =>
    startTransition(() => {
      setFile(next);
      setMapping(null);
    });

  const setField = (key: ContactField, value: string) =>
    setMapping({ ...(activeMapping as ColumnMapping), [key]: value === "" ? null : Number(value) });

  const download = () => {
    if (!result || !file) return;
    downloadBlob(new Blob([contactsToVCF(result.contacts)], { type: "text/vcard;charset=utf-8" }), `${fileStem(file.name)}.vcf`);
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <CSVFileInput
            onLoad={load}
            sample={{ name: "sample-contacts.csv", text: SAMPLE_CSV }}
            pastePlaceholder={"Name,Phone,Email\nAyesha Khan,0300 1234567,ayesha@example.com"}
          />
        </div>
      </div>
    );
  }

  const noPhoneOrName =
    activeMapping &&
    activeMapping.fullName === null &&
    activeMapping.firstName === null &&
    activeMapping.lastName === null &&
    activeMapping.phone1 === null &&
    activeMapping.email1 === null;
  const contacts = result?.contacts ?? [];

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-white" title={file.name}>
              {file.name}
            </p>
            {table && parsed && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {table.rows.length.toLocaleString()} {table.rows.length === 1 ? "row" : "rows"} ×{" "}
                {table.headers.length.toLocaleString()} columns · {DELIMITER_NAMES[parsed.delimiter] ?? `"${parsed.delimiter}"`}
                -separated
              </p>
            )}
          </div>
          <button type="button" onClick={() => setFile(null)} className={buttonClass}>
            <X aria-hidden="true" className="h-4 w-4" />
            Open another file
          </button>
        </div>

        {parsed?.error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{parsed.error}</p>
          </div>
        )}
        {file.notice && (
          <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            {file.notice}
          </p>
        )}

        {table && activeMapping && (
          <>
            <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => {
                  setHasHeader(e.target.checked);
                  setMapping(null);
                }}
                className="h-4 w-4 accent-brand-700"
              />
              First row has column names
            </label>

            <fieldset className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <legend className="text-sm font-semibold text-slate-900 dark:text-white">Columns to use</legend>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Matched from your column names. Change any that are wrong.
              </p>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {FIELDS.map((f) => (
                  <label key={f.key} className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="w-24 shrink-0 font-medium">{f.label}</span>
                    <select
                      value={activeMapping[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className={`${fieldClass} min-w-0 flex-1`}
                    >
                      <option value="">Not used</option>
                      {table.headers.map((h, c) => (
                        <option key={c} value={c}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={useCountryCode}
                  onChange={(e) => setUseCountryCode(e.target.checked)}
                  className="h-4 w-4 accent-brand-700"
                />
                Add country code to local numbers
              </label>
              <input
                type="text"
                inputMode="tel"
                aria-label="Country code"
                value={countryCode}
                disabled={!useCountryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={`${fieldClass} w-24 disabled:opacity-50`}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                e.g. 0300 1234567 becomes +923001234567, which WhatsApp needs
              </span>
            </div>
          </>
        )}

        {noPhoneOrName && (
          <p className="text-sm text-slate-600 dark:text-slate-400">Choose at least a name, phone or email column.</p>
        )}

        {result && !noPhoneOrName && (
          <section aria-labelledby={`${ids}-result`} className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${ids}-result`} aria-live="polite" className="text-base font-semibold text-slate-900 dark:text-white">
                {contacts.length.toLocaleString()} {contacts.length === 1 ? "contact" : "contacts"} ready
              </h2>
              <button type="button" onClick={download} disabled={contacts.length === 0} className={primaryButtonClass}>
                <Download aria-hidden="true" className="h-4 w-4" />
                Download VCF
              </button>
            </div>
            {result.skippedEmpty > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {result.skippedEmpty.toLocaleString()} empty {result.skippedEmpty === 1 ? "row was" : "rows were"} skipped.
              </p>
            )}
            {result.damagedPhones > 0 && (
              <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                {result.damagedPhones.toLocaleString()} phone {result.damagedPhones === 1 ? "number looks" : "numbers look"} like
                9.23001E+11: Excel changed {result.damagedPhones === 1 ? "it" : "them"} to scientific notation and the last digits are
                lost. Fix the column in the original sheet first; see{" "}
                <Link href="/guides/excel-leading-zeros-csv/" className="font-semibold underline">
                  how to stop Excel changing numbers
                </Link>
                .
              </p>
            )}
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.slice(0, PREVIEW).map((c, i) => (
                <li key={i} className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{c.fullName || c.organization || "No name"}</p>
                  {c.organization && c.fullName && (
                    <p className="truncate text-sm text-slate-600 dark:text-slate-400">{c.organization}</p>
                  )}
                  {c.phones.map((p) => (
                    <p key={p.value} className="mt-1 flex items-center gap-1.5 truncate font-mono text-sm text-slate-800 dark:text-slate-200">
                      <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                      {p.value}
                    </p>
                  ))}
                  {c.emails.map((e) => (
                    <p key={e.value} className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-800 dark:text-slate-200">
                      <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                      {e.value}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
            {contacts.length > PREVIEW && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing {PREVIEW} of {contacts.length.toLocaleString()} contacts. All are in the downloaded file.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
