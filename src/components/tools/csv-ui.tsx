"use client";

import React, { useRef, useState } from "react";
import { FileUp, Sparkles } from "lucide-react";
import { readTextFile } from "@/lib/file-text";

/** Shared building blocks for the CSV file tools (viewer, split, merge, ...). */

export interface LoadedFile {
  name: string;
  text: string;
  /** Set when the file was not UTF-8 and a fallback encoding was used. */
  notice?: string;
}

export const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700";
export const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-500 dark:text-slate-950 dark:hover:bg-brand-400";
export const fieldClass =
  "min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

export const DELIMITER_OPTIONS = [
  { value: "auto", label: "Detect automatically" },
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe (|)" },
];

export const DELIMITER_NAMES: Record<string, string> = {
  ",": "comma",
  ";": "semicolon",
  "\t": "tab",
  "|": "pipe",
  ":": "colon",
};

/** File name without its extension, e.g. "orders" for "orders.csv". */
export function fileStem(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "data";
}

/** Save a Blob as a download with the given file name. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read picked or dropped files as text. Files that cannot be read are reported, not thrown. */
export async function readCSVFiles(files: FileList | File[]): Promise<{ loaded: LoadedFile[]; errors: string[] }> {
  const loaded: LoadedFile[] = [];
  const errors: string[] = [];
  for (const file of Array.from(files)) {
    try {
      const { text, notice } = await readTextFile(file);
      loaded.push({ name: file.name, text, notice });
    } catch (err) {
      console.error("Tooltiva could not read the file:", err);
      errors.push(`"${file.name}" could not be read. Try again, or paste its contents instead.`);
    }
  }
  return { loaded, errors };
}

export const CSV_ACCEPT = ".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain";

/**
 * Drop zone, file picker, sample loader and paste box. Calls `onLoad` with the
 * decoded text; the file never leaves the browser.
 */
export function CSVFileInput({
  onLoad,
  sample,
  multiple = false,
  pastePlaceholder = "id,name,city\n1,Ayesha,Lahore",
}: {
  /** Called once per file (several times when `multiple` is set). */
  onLoad: (file: LoadedFile) => void;
  sample: LoadedFile | LoadedFile[];
  multiple?: boolean;
  pastePlaceholder?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const openFiles = async (picked: FileList | File[] | null | undefined) => {
    if (!picked || picked.length === 0) return;
    const { loaded, errors } = await readCSVFiles(multiple ? Array.from(picked) : [picked[0]]);
    setError(errors.length ? errors.join(" ") : null);
    loaded.forEach(onLoad);
  };
  const noun = multiple ? "CSV files" : "a CSV file";

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          openFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging
            ? "border-brand-600 bg-brand-50 dark:bg-brand-950/40"
            : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
        }`}
      >
        <FileUp aria-hidden="true" className="h-8 w-8 text-brand-700 dark:text-brand-400" />
        <p className="text-base font-semibold text-slate-900 dark:text-white">Drop {noun} here</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">.csv, .tsv or .txt — {multiple ? "files stay" : "the file stays"} on your device</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => fileInput.current?.click()} className={primaryButtonClass}>
            <FileUp aria-hidden="true" className="h-4 w-4" />
            {multiple ? "Open CSV files" : "Open CSV file"}
          </button>
          <button type="button" onClick={() => (Array.isArray(sample) ? sample : [sample]).forEach(onLoad)} className={buttonClass}>
            <Sparkles aria-hidden="true" className="h-4 w-4 text-brand-700 dark:text-brand-400" />
            Load sample
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={CSV_ACCEPT}
          multiple={multiple}
          className="sr-only"
          aria-label={multiple ? "Choose CSV files" : "Choose a CSV file"}
          tabIndex={-1}
          onChange={(e) => {
            const picked = e.target.files ? Array.from(e.target.files) : [];
            e.target.value = "";
            openFiles(picked);
          }}
        />
      </div>

      <details className="rounded-xl border border-slate-200 dark:border-slate-800">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Or paste CSV text
        </summary>
        <div className="space-y-3 px-4 pb-4">
          <textarea
            wrap="off"
            spellCheck={false}
            aria-label="CSV text"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={8}
            placeholder={pastePlaceholder}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <button
            type="button"
            disabled={pasteText.trim() === ""}
            onClick={() => onLoad({ name: "pasted.csv", text: pasteText })}
            className={buttonClass}
          >
            Use pasted CSV
          </button>
        </div>
      </details>

      {error && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
