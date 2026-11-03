"use client";

import React, { useCallback, useId, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Download, Info, X } from "lucide-react";
import { clampDpi, pixelsFor, printSize, readDpiInfo, setDpi, type DpiInfo, type DpiReading } from "@/lib/dpi";
import { formatBytes } from "@/lib/image-size";
import { samplePhoto } from "@/lib/image-canvas";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { BlobPreview, ImageFileInput } from "@/components/tools/image-ui";
import { buttonClass, downloadBlob, fieldClass, fileStem, primaryButtonClass } from "@/components/tools/csv-ui";

const PRESETS = [72, 96, 150, 200, 300, 600];
const ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

/** Print sizes people often need, with the pixels each takes at the chosen DPI. */
const PRINT_TARGETS = [
  { label: "Passport photo, 3.5 × 4.5 cm", w: 3.5, h: 4.5 },
  { label: "Signature, 3.5 × 1.5 cm", w: 3.5, h: 1.5 },
  { label: "Photo print, 4 × 6 in (10.2 × 15.2 cm)", w: 10.16, h: 15.24 },
  { label: "A4 page, 21 × 29.7 cm", w: 21, h: 29.7 },
];

const fmt = (v: number, digits = 1) => v.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const dpiText = (r: DpiReading) => (r.x === r.y ? `${r.x} DPI` : `${r.x} × ${r.y} DPI`);
const SOURCE_NAMES: Record<string, string> = { JFIF: "JFIF header", EXIF: "EXIF data", Photoshop: "Photoshop data", PNG: "PNG pHYs chunk" };
/** "A", "A and B", "A, B and C" */
const listOf = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

/** A sample like a typical phone photo: a JPG that says 72 DPI. */
async function sampleAt72(): Promise<File> {
  const photo = await samplePhoto();
  const bytes = setDpi(new Uint8Array(await photo.arrayBuffer()), 72);
  return new File([bytes as BlobPart], "sample-photo.jpg", { type: "image/jpeg" });
}

export function ChangeDpiClient() {
  const ids = useId();
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [info, setInfo] = useState<DpiInfo | null>(null);
  const [error, setError] = useState<React.ReactNode>(null);
  const [choice, setChoice] = useState<number | "custom">(300);
  const [custom, setCustom] = useState("");
  const [removeExif, setRemoveExif] = useState(false);

  const open = useCallback(async (f: File) => {
    setError(null);
    const b = new Uint8Array(await f.arrayBuffer());
    const i = readDpiInfo(b);
    if (!i.format || !i.width || !i.height) {
      setFile(null);
      setBytes(null);
      setInfo(null);
      setError(
        <>
          {f.name} is not a JPG or PNG file. The DPI can be changed without re-saving the picture only in JPG and PNG.
          To convert a photo to JPG first, use <Link href="/image-tools/resize-image-to-kb/">Resize Image to KB</Link>{" "}
          with a large size such as Under 500 KB.
        </>
      );
      return;
    }
    setFile(f);
    setBytes(b);
    setInfo(i);
    setRemoveExif(false);
  }, []);

  const reset = () => {
    setFile(null);
    setBytes(null);
    setInfo(null);
    setError(null);
  };

  const dpi = choice === "custom" ? Number(custom) : choice;
  const dpiValid = Number.isFinite(dpi) && dpi >= 1 && dpi <= 65535;
  const target = dpiValid ? clampDpi(dpi) : null;

  const output = useMemo(() => {
    if (!bytes || !info || !target) return null;
    const out = setDpi(bytes, target, { removeExif: removeExif && info.format === "jpeg" });
    return { bytes: out, check: readDpiInfo(out) };
  }, [bytes, info, target, removeExif]);

  if (!file || !bytes || !info || !info.width || !info.height) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <ImageFileInput
            onFile={open}
            sample={sampleAt72}
            accept={ACCEPT}
            hint="JPG or PNG · or paste with Ctrl+V · the image stays on your device"
          />
          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  const { width, height } = info;
  const current = info.dpi;
  const disagree = info.readings.some((r) => r.x !== info.readings[0].x || r.y !== info.readings[0].y);
  const ext = info.format === "png" ? "png" : "jpg";
  const pill = (active: boolean) =>
    `flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium ${
      active
        ? "border-brand-600 bg-brand-50 text-brand-900 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-100"
        : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;
  const radio = "h-4 w-4 accent-brand-700";

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <BlobPreview blob={file} alt="The image you chose" className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900 dark:text-white" title={file.name}>
                {file.name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {ext.toUpperCase()} · {width.toLocaleString()} × {height.toLocaleString()} px · {formatBytes(file.size)}
              </p>
            </div>
          </div>
          <button type="button" onClick={reset} className={buttonClass}>
            <X aria-hidden="true" className="h-4 w-4" />
            Choose another image
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">
            Current DPI: {current ? dpiText(current) : "none stored"}
          </p>
          {current ? (
            <p className="mt-1">
              Stored in the {listOf(info.readings.map((r) => SOURCE_NAMES[r.source]))}. At this DPI it prints at{" "}
              {fmt(printSize(width, current.x).cm)} × {fmt(printSize(height, current.y).cm)} cm.
              {disagree && (
                <> The copies disagree ({info.readings.map((r) => `${r.source} ${dpiText(r)}`).join(", ")}), so programs may show different numbers; the new file will have one value everywhere.</>
              )}
            </p>
          ) : (
            <p className="mt-1">The file does not say. Most programs then assume 72 or 96 DPI.</p>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">New DPI</legend>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <label key={p} className={pill(choice === p)}>
                <input type="radio" name={`${ids}-dpi`} checked={choice === p} onChange={() => setChoice(p)} className={radio} />
                {p}
              </label>
            ))}
            <label className={pill(choice === "custom")}>
              <input type="radio" name={`${ids}-dpi`} checked={choice === "custom"} onChange={() => setChoice("custom")} className={radio} />
              Custom
            </label>
          </div>
          {choice === "custom" && (
            <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <span>DPI</span>
              <input
                type="number"
                min={1}
                max={65535}
                inputMode="numeric"
                value={custom}
                placeholder="e.g. 240"
                onChange={(e) => setCustom(e.target.value)}
                className={`${fieldClass} w-28`}
              />
              {!dpiValid && custom !== "" && <span className="text-rose-700 dark:text-rose-300">Enter a number from 1 to 65,535.</span>}
            </label>
          )}
        </fieldset>

        {info.format === "jpeg" && info.hasExif && (
          <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={removeExif} onChange={(e) => setRemoveExif(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-700" />
            <span>Also remove camera, date and location details (EXIF). The picture itself is not changed.</span>
          </label>
        )}

        <section aria-labelledby={`${ids}-result`} className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id={`${ids}-result`} aria-live="polite" className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              {target ? (
                <>
                  <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-700 dark:text-brand-400" />
                  {target} DPI · prints at {fmt(printSize(width, target).cm)} × {fmt(printSize(height, target).cm)} cm
                </>
              ) : (
                "Choose a DPI"
              )}
            </h2>
            <button
              type="button"
              disabled={!output}
              onClick={() =>
                output &&
                downloadBlob(
                  new Blob([output.bytes as BlobPart], { type: info.format === "png" ? "image/png" : "image/jpeg" }),
                  `${fileStem(file.name)}-${target}dpi.${ext}`
                )
              }
              className={primaryButtonClass}
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Download {ext.toUpperCase()}
            </button>
          </div>
          {target && output && (
            <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {fmt(printSize(width, target).inches, 2)} × {fmt(printSize(height, target).inches, 2)} inches. Same{" "}
                {width.toLocaleString()} × {height.toLocaleString()} pixels and the same quality: only the DPI
                {output.check.readings.length > 1 ? " fields" : " field"} ({listOf(output.check.readings.map((r) => SOURCE_NAMES[r.source]))})
                changed. New file size {formatBytes(output.bytes.length)}.
              </span>
            </p>
          )}

          {target && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label="Pixels needed for common print sizes, scrolls sideways on small screens">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Pixels needed for common print sizes at {target} DPI</caption>
                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Print size</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Pixels needed at {target} DPI</th>
                    <th scope="col" className="px-3 py-2 font-semibold">This image</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                  {PRINT_TARGETS.map((t) => {
                    const w = pixelsFor(t.w, target), h = pixelsFor(t.h, target);
                    const enough = (width >= w && height >= h) || (width >= h && height >= w);
                    return (
                      <tr key={t.label}>
                        <td className="px-3 py-2">{t.label}</td>
                        <td className="px-3 py-2 tabular-nums">{w.toLocaleString()} × {h.toLocaleString()} px</td>
                        <td className="px-3 py-2">{enough ? "Enough pixels" : "Too few pixels"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
