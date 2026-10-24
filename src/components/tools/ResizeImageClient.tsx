"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Info, X } from "lucide-react";
import { fitToSize, formatBytes, kbRange, type FitResult } from "@/lib/image-size";
import { jpegEncoder, loadImage, padToMinimum, samplePhoto, UnsupportedImageError, type JpegResult, type LoadedImage } from "@/lib/image-canvas";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { BlobPreview, ImageFileInput } from "@/components/tools/image-ui";
import { buttonClass, downloadBlob, fieldClass, fileStem, primaryButtonClass } from "@/components/tools/csv-ui";

interface Preset {
  id: string;
  label: string;
  min: number;
  max: number;
}

const PRESETS: Preset[] = [
  { id: "20kb", label: "Under 20 KB", min: 0, max: 20 },
  { id: "50kb", label: "Under 50 KB", min: 0, max: 50 },
  { id: "100kb", label: "Under 100 KB", min: 0, max: 100 },
  { id: "200kb", label: "Under 200 KB", min: 0, max: 200 },
  { id: "500kb", label: "Under 500 KB", min: 0, max: 500 },
  { id: "10-20kb", label: "10–20 KB", min: 10, max: 20 },
  { id: "20-50kb", label: "20–50 KB", min: 20, max: 50 },
  { id: "50-100kb", label: "50–100 KB", min: 50, max: 100 },
];

type DimMode = "auto" | "exact";

/** Center crop of the source that matches the target aspect ratio, so an exact size never stretches the photo. */
function centerCrop(image: LoadedImage, width: number, height: number) {
  const target = width / height;
  const source = image.width / image.height;
  if (Math.abs(target - source) < 0.005) return { x: 0, y: 0, width: image.width, height: image.height };
  if (source > target) {
    const w = Math.round(image.height * target);
    return { x: Math.round((image.width - w) / 2), y: 0, width: w, height: image.height };
  }
  const h = Math.round(image.width / target);
  return { x: 0, y: Math.round((image.height - h) / 2), width: image.width, height: h };
}

export function ResizeImageClient() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presetId, setPresetId] = useState("20kb");
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("30");
  const [dimMode, setDimMode] = useState<DimMode>("auto");
  const [exactW, setExactW] = useState("");
  const [exactH, setExactH] = useState("");
  const [fit, setFit] = useState<FitResult<JpegResult> | null>(null);
  const [padded, setPadded] = useState(false);
  const [working, setWorking] = useState(false);
  const job = useRef(0);
  const ids = useId();

  const open = useCallback(async (next: File) => {
    setError(null);
    setFit(null);
    try {
      const loaded = await loadImage(next);
      setFile(next);
      setImage(loaded);
      setExactW(String(loaded.width));
      setExactH(String(loaded.height));
      setDimMode("auto");
    } catch (err) {
      setError(err instanceof UnsupportedImageError ? err.message : "This file could not be opened as an image.");
    }
  }, []);

  // Target range in KB, or an error message for invalid custom values.
  const preset = PRESETS.find((p) => p.id === presetId);
  const minKB = preset ? preset.min : Number(customMin || 0);
  const maxKB = preset ? preset.max : Number(customMax);
  const rangeError =
    !Number.isFinite(maxKB) || maxKB <= 0
      ? "Enter a maximum size in KB."
      : !Number.isFinite(minKB) || minKB < 0
        ? "Enter a minimum of 0 or more."
        : minKB >= maxKB
          ? "The minimum must be smaller than the maximum."
          : maxKB < 2
            ? "Choose a maximum of at least 2 KB."
            : null;
  const w = Math.round(Number(exactW));
  const h = Math.round(Number(exactH));
  const dimError =
    dimMode === "exact" && (!(w >= 16 && w <= 6000) || !(h >= 16 && h <= 6000))
      ? "Enter a width and height between 16 and 6,000 pixels."
      : null;

  useEffect(() => {
    if (!image || rangeError || dimError) return;
    const current = ++job.current;
    setWorking(true);
    const timer = setTimeout(async () => {
      try {
        const target = kbRange(minKB, maxKB);
        const fitted =
          dimMode === "exact"
            ? await fitToSize(w, h, target, jpegEncoder(image, centerCrop(image, w, h)), { fixedSize: true })
            : await fitToSize(image.width, image.height, target, jpegEncoder(image));
        const final = await padToMinimum(fitted, target.minBytes, target.maxBytes);
        if (job.current === current) {
          setFit(final.fit);
          setPadded(final.padded);
        }
      } catch (err) {
        console.error("Tooltiva could not resize the image:", err);
        if (job.current === current) setError("The image could not be processed. Try a smaller photo or another browser.");
      } finally {
        if (job.current === current) setWorking(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [image, minKB, maxKB, dimMode, w, h, rangeError, dimError]);

  const reset = () => {
    job.current++;
    setFile(null);
    setImage(null);
    setFit(null);
    setError(null);
    setWorking(false);
  };

  if (!file || !image) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <ImageFileInput onFile={open} sample={samplePhoto} />
          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  const radio = "h-4 w-4 accent-brand-700";
  const pill = (active: boolean) =>
    `flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium ${
      active
        ? "border-brand-600 bg-brand-50 text-brand-900 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-100"
        : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;
  const sizeLabel = preset ? preset.id : `${minKB ? `${minKB}-` : ""}${maxKB}kb`;

  return (
    <div className="space-y-4">
      <PrivacyBadge />
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-white" title={file.name}>
              {file.name}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {formatBytes(file.size)} · {image.width.toLocaleString()} × {image.height.toLocaleString()} px
            </p>
          </div>
          <button type="button" onClick={reset} className={buttonClass}>
            <X aria-hidden="true" className="h-4 w-4" />
            Choose another image
          </button>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Target file size</legend>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <label key={p.id} className={pill(presetId === p.id)}>
                <input type="radio" name={`${ids}-size`} checked={presetId === p.id} onChange={() => setPresetId(p.id)} className={radio} />
                {p.label}
              </label>
            ))}
            <label className={pill(presetId === "custom")}>
              <input type="radio" name={`${ids}-size`} checked={presetId === "custom"} onChange={() => setPresetId("custom")} className={radio} />
              Custom
            </label>
          </div>
          {presetId === "custom" && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2">
                <span>Minimum</span>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={customMin}
                  placeholder="0"
                  onChange={(e) => setCustomMin(e.target.value)}
                  className={`${fieldClass} w-24`}
                />
                <span>KB</span>
              </label>
              <label className="flex items-center gap-2">
                <span>Maximum</span>
                <input
                  type="number"
                  min={2}
                  inputMode="decimal"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className={`${fieldClass} w-24`}
                />
                <span>KB</span>
              </label>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Dimensions</legend>
          <div className="space-y-2">
            <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input type="radio" name={`${ids}-dim`} checked={dimMode === "auto"} onChange={() => setDimMode("auto")} className={radio} />
              Keep proportions, make it smaller only if needed
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input type="radio" name={`${ids}-dim`} checked={dimMode === "exact"} onChange={() => setDimMode("exact")} className={radio} />
                Exact size in pixels
              </label>
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="number"
                  min={16}
                  inputMode="numeric"
                  aria-label="Width in pixels"
                  value={exactW}
                  onFocus={() => setDimMode("exact")}
                  onChange={(e) => {
                    setDimMode("exact");
                    setExactW(e.target.value);
                  }}
                  className={`${fieldClass} w-24`}
                />
                <span aria-hidden="true">×</span>
                <input
                  type="number"
                  min={16}
                  inputMode="numeric"
                  aria-label="Height in pixels"
                  value={exactH}
                  onFocus={() => setDimMode("exact")}
                  onChange={(e) => {
                    setDimMode("exact");
                    setExactH(e.target.value);
                  }}
                  className={`${fieldClass} w-24`}
                />
                <span>px</span>
              </div>
            </div>
            {dimMode === "exact" && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                If the shape differs from the photo, the edges are trimmed evenly so nothing is stretched.
              </p>
            )}
          </div>
        </fieldset>

        {(rangeError || dimError || error) && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {rangeError || dimError || error}
          </p>
        )}

        {fit && !rangeError && !dimError && (
          <section aria-labelledby={`${ids}-result`} className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${ids}-result`} aria-live="polite" className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                {working ? (
                  "Resizing…"
                ) : fit.status === "ok" ? (
                  <>
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-700 dark:text-brand-400" />
                    {formatBytes(fit.result.size)} · {fit.width.toLocaleString()} × {fit.height.toLocaleString()} px
                  </>
                ) : (
                  <>
                    <AlertCircle aria-hidden="true" className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    {fit.status === "too-large" ? "Can't get small enough" : "Can't reach the minimum size"}
                  </>
                )}
              </h2>
              <button
                type="button"
                disabled={working || fit.status !== "ok"}
                onClick={() => downloadBlob(fit.result.blob, `${fileStem(file.name)}-${sizeLabel}.jpg`)}
                className={primaryButtonClass}
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Download JPG
              </button>
            </div>

            {!working && fit.status === "too-large" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                At {fit.width} × {fit.height} px the smallest version is {formatBytes(fit.result.size)}. Choose smaller
                dimensions, or &quot;Keep proportions&quot; so the photo can be made smaller.
              </p>
            )}
            {!working && fit.status === "too-small" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                At the highest quality this image is {formatBytes(fit.result.size)} at {fit.width} × {fit.height} px. Choose
                larger dimensions or a lower minimum.
              </p>
            )}
            {!working && fit.status === "ok" && (
              <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  JPEG quality {Math.round(fit.quality * 100)}%.{" "}
                  {padded
                    ? "The picture could not reach the minimum size on its own, so empty data was added inside the file; the image itself is unchanged. "
                    : fit.width > image.width
                    ? "The image was enlarged to reach the minimum size; this adds pixels, not detail. "
                    : fit.resized && dimMode === "auto"
                      ? "The dimensions were reduced so the photo stays sharp at this file size. "
                      : ""}
                  Hidden details such as GPS location and camera model are removed.
                </span>
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <figure className="min-w-0 space-y-2">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                  <BlobPreview blob={file} alt="Original image" className="max-h-full max-w-full object-contain" />
                </div>
                <figcaption className="text-sm text-slate-600 dark:text-slate-400">
                  Original · {formatBytes(file.size)}
                </figcaption>
              </figure>
              <figure className="min-w-0 space-y-2">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                  <BlobPreview blob={fit.result.blob} alt="Resized image" className="max-h-full max-w-full object-contain" />
                </div>
                <figcaption className="text-sm text-slate-600 dark:text-slate-400">
                  Resized · {formatBytes(fit.result.size)}
                </figcaption>
              </figure>
            </div>
          </section>
        )}
        {!fit && working && <p className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">Resizing…</p>}
      </div>
    </div>
  );
}
