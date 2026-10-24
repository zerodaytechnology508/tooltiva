"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Info, X } from "lucide-react";
import { fitToSize, formatBytes, kbRange, type FitResult } from "@/lib/image-size";
import {
  jpegEncoder,
  loadImage,
  padToMinimum,
  readPixels,
  sampleSignature,
  UnsupportedImageError,
  type CropRect,
  type JpegResult,
  type LoadedImage,
} from "@/lib/image-canvas";
import { analyzeSignature, cleanSignature, cmToPx, setJpegDpi, type InkMode, type SignatureAnalysis } from "@/lib/signature";
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
  { id: "10-20kb", label: "10–20 KB", min: 10, max: 20 },
  { id: "20kb", label: "Under 20 KB", min: 0, max: 20 },
  { id: "10-50kb", label: "10–50 KB", min: 10, max: 50 },
  { id: "20-50kb", label: "20–50 KB", min: 20, max: 50 },
  { id: "50kb", label: "Under 50 KB", min: 0, max: 50 },
];

type DimMode = "auto" | "px" | "cm";

/** Grow a crop box around its centre until it has the target shape; areas outside the photo become white. */
function expandToRatio(box: CropRect, ratio: number): CropRect {
  const current = box.width / box.height;
  if (Math.abs(current - ratio) < 0.005) return box;
  if (current < ratio) {
    const width = box.height * ratio;
    return { x: box.x - (width - box.width) / 2, y: box.y, width, height: box.height };
  }
  const height = box.width / ratio;
  return { x: box.x, y: box.y - (height - box.height) / 2, width: box.width, height };
}

export function SignatureResizerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [analysis, setAnalysis] = useState<{ result: SignatureAnalysis; scale: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presetId, setPresetId] = useState("10-20kb");
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("30");
  const [trim, setTrim] = useState(true);
  const [clean, setClean] = useState(true);
  const [inkMode, setInkMode] = useState<InkMode>("original");
  const [dimMode, setDimMode] = useState<DimMode>("auto");
  const [pxW, setPxW] = useState("300");
  const [pxH, setPxH] = useState("120");
  const [cmW, setCmW] = useState("3.5");
  const [cmH, setCmH] = useState("1.5");
  const [dpi, setDpi] = useState("200");
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
      const pixels = readPixels(loaded);
      const result = analyzeSignature(pixels.data, pixels.width, pixels.height);
      setFile(next);
      setImage(loaded);
      setAnalysis({ result, scale: pixels.scale });
      setDimMode("auto");
      if (!result.box) setTrim(false);
    } catch (err) {
      setError(err instanceof UnsupportedImageError ? err.message : "This file could not be opened as an image.");
    }
  }, []);

  // The part of the photo to use: the signature with a margin, or the whole photo.
  const crop = useMemo<CropRect | null>(() => {
    if (!image || !analysis) return null;
    const box = analysis.result.box;
    if (!trim || !box) return { x: 0, y: 0, width: image.width, height: image.height };
    const s = analysis.scale;
    return { x: box.x / s, y: box.y / s, width: box.width / s, height: box.height / s };
  }, [image, analysis, trim]);

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

  const dpiValue = Math.round(Number(dpi));
  const target =
    dimMode === "px"
      ? { w: Math.round(Number(pxW)), h: Math.round(Number(pxH)) }
      : dimMode === "cm"
        ? { w: cmToPx(Number(cmW), dpiValue), h: cmToPx(Number(cmH), dpiValue) }
        : null;
  const dimError =
    target && (!(target.w >= 16 && target.w <= 4000) || !(target.h >= 16 && target.h <= 4000))
      ? dimMode === "cm"
        ? "Enter a width and height in centimetres that give between 16 and 4,000 pixels at this DPI."
        : "Enter a width and height between 16 and 4,000 pixels."
      : null;

  useEffect(() => {
    if (!image || !crop || !analysis || rangeError || dimError) return;
    const current = ++job.current;
    setWorking(true);
    const timer = setTimeout(async () => {
      try {
        const { paper, ink } = analysis.result;
        const process = clean
          ? (ctx: CanvasRenderingContext2D, w: number, h: number) => {
              const data = ctx.getImageData(0, 0, w, h);
              cleanSignature(data.data, paper, ink, inkMode);
              ctx.putImageData(data, 0, 0);
            }
          : undefined;
        // Leave room for the DPI header, which can add 18 bytes.
        const range = kbRange(minKB, maxKB);
        const sizeTarget = { minBytes: range.minBytes, maxBytes: range.maxBytes - 18 };
        let result: FitResult<JpegResult>;
        if (target) {
          const area = expandToRatio(crop, target.w / target.h);
          result = await fitToSize(target.w, target.h, sizeTarget, jpegEncoder(image, area, process), { fixedSize: true });
        } else {
          const w = Math.round(crop.width);
          const h = Math.round(crop.height);
          result = await fitToSize(w, h, sizeTarget, jpegEncoder(image, crop, process), { maxLongSide: 3000 });
        }
        const final = await padToMinimum(result, range.minBytes, range.maxBytes);
        if (dimMode === "cm" && final.fit.status === "ok") {
          // Write the DPI last, after any padding, so print-size checks read the right size.
          const bytes = setJpegDpi(new Uint8Array(await final.fit.result.blob.arrayBuffer()), dpiValue);
          const blob = new Blob([bytes as BlobPart], { type: "image/jpeg" });
          final.fit = { ...final.fit, result: { blob, size: blob.size } };
        }
        if (job.current === current) {
          setFit(final.fit);
          setPadded(final.padded);
        }
      } catch (err) {
        console.error("Tooltiva could not resize the signature:", err);
        if (job.current === current) setError("The image could not be processed. Try a smaller photo or another browser.");
      } finally {
        if (job.current === current) setWorking(false);
      }
    }, 250);
    return () => clearTimeout(timer);
    // target is derived from dimMode and the size fields listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, crop, analysis, clean, inkMode, minKB, maxKB, dimMode, pxW, pxH, cmW, cmH, dpiValue, rangeError, dimError]);

  const reset = () => {
    job.current++;
    setFile(null);
    setImage(null);
    setAnalysis(null);
    setFit(null);
    setError(null);
    setWorking(false);
    setTrim(true);
  };

  if (!file || !image || !analysis) {
    return (
      <div className="space-y-4">
        <PrivacyBadge />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <ImageFileInput onFile={open} sample={sampleSignature} sampleLabel="Try a sample signature" />
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
  const label = "flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300";
  const pill = (active: boolean) =>
    `flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium ${
      active
        ? "border-brand-600 bg-brand-50 text-brand-900 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-100"
        : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;
  const num = (value: string, set: (v: string) => void, aria: string, mode: DimMode, step = "1") => (
    <input
      type="number"
      min={0}
      step={step}
      inputMode="decimal"
      aria-label={aria}
      value={value}
      onFocus={() => setDimMode(mode)}
      onChange={(e) => {
        setDimMode(mode);
        set(e.target.value);
      }}
      className={`${fieldClass} w-24`}
    />
  );
  const sizeLabel = preset ? preset.id : `${minKB ? `${minKB}-` : ""}${maxKB}kb`;
  const noSignature = !analysis.result.box;

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

        {noSignature && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            No clear signature was found, so the whole image is used. For best results, sign with a dark pen on white
            paper and photograph it in good light.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <fieldset className="space-y-1">
            <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Clean up</legend>
            <label className={label}>
              <input type="checkbox" checked={trim} disabled={noSignature} onChange={(e) => setTrim(e.target.checked)} className={radio} />
              Trim empty space around the signature
            </label>
            <label className={label}>
              <input type="checkbox" checked={clean} onChange={(e) => setClean(e.target.checked)} className={radio} />
              Make the paper pure white
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <span className="font-medium">Ink</span>
              <select
                value={inkMode}
                disabled={!clean}
                onChange={(e) => setInkMode(e.target.value as InkMode)}
                className={fieldClass}
              >
                <option value="original">Keep the ink colour</option>
                <option value="black">Make the ink black</option>
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Dimensions</legend>
            <div className="space-y-2">
              <label className={label}>
                <input type="radio" name={`${ids}-dim`} checked={dimMode === "auto"} onChange={() => setDimMode("auto")} className={radio} />
                Keep proportions, make it smaller only if needed
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className={label}>
                  <input type="radio" name={`${ids}-dim`} checked={dimMode === "px"} onChange={() => setDimMode("px")} className={radio} />
                  Pixels
                </label>
                {num(pxW, setPxW, "Width in pixels", "px")}
                <span aria-hidden="true" className="text-slate-500">×</span>
                {num(pxH, setPxH, "Height in pixels", "px")}
                <span className="text-sm text-slate-600 dark:text-slate-400">px</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className={label}>
                  <input type="radio" name={`${ids}-dim`} checked={dimMode === "cm"} onChange={() => setDimMode("cm")} className={radio} />
                  Centimetres
                </label>
                {num(cmW, setCmW, "Width in centimetres", "cm", "0.1")}
                <span aria-hidden="true" className="text-slate-500">×</span>
                {num(cmH, setCmH, "Height in centimetres", "cm", "0.1")}
                <span className="text-sm text-slate-600 dark:text-slate-400">cm at</span>
                <select
                  aria-label="Resolution in DPI"
                  value={dpi}
                  onChange={(e) => {
                    setDimMode("cm");
                    setDpi(e.target.value);
                  }}
                  className={fieldClass}
                >
                  <option value="100">100 DPI</option>
                  <option value="150">150 DPI</option>
                  <option value="200">200 DPI</option>
                  <option value="300">300 DPI</option>
                </select>
              </div>
              {target && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Output {target.w} × {target.h} px. If the shape differs from the signature, white space is added so
                  nothing is cut off.
                </p>
              )}
            </div>
          </fieldset>
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
                <input type="number" min={0} inputMode="decimal" value={customMin} placeholder="0" onChange={(e) => setCustomMin(e.target.value)} className={`${fieldClass} w-24`} />
                <span>KB</span>
              </label>
              <label className="flex items-center gap-2">
                <span>Maximum</span>
                <input type="number" min={2} inputMode="decimal" value={customMax} onChange={(e) => setCustomMax(e.target.value)} className={`${fieldClass} w-24`} />
                <span>KB</span>
              </label>
            </div>
          )}
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
                    {dimMode === "cm" ? ` · ${dpiValue} DPI` : ""}
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
                onClick={() => downloadBlob(fit.result.blob, `${fileStem(file.name)}-signature-${sizeLabel}.jpg`)}
                className={primaryButtonClass}
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Download signature
              </button>
            </div>
            {!working && fit.status === "too-large" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                At {fit.width} × {fit.height} px the smallest version is {formatBytes(fit.result.size)}. Choose smaller
                dimensions or a larger maximum.
              </p>
            )}
            {!working && fit.status === "too-small" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                At the highest quality this signature is {formatBytes(fit.result.size)} at {fit.width} × {fit.height} px.
                A clean signature on white compresses very well, so choose larger dimensions or a lower minimum.
              </p>
            )}
            {!working && fit.status === "ok" && (
              <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {padded
                    ? "A clean signature at this size is smaller than the minimum, so empty data was added inside the file to reach it; the signature itself is unchanged. "
                    : ""}
                  Hidden details such as GPS location and phone model are removed.
                </span>
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <figure className="min-w-0 space-y-2">
                <div className="flex aspect-[5/2] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                  <BlobPreview blob={file} alt="Original photo of the signature" className="max-h-full max-w-full object-contain" />
                </div>
                <figcaption className="text-sm text-slate-600 dark:text-slate-400">Original · {formatBytes(file.size)}</figcaption>
              </figure>
              <figure className="min-w-0 space-y-2">
                <div className="flex aspect-[5/2] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800">
                  <BlobPreview blob={fit.result.blob} alt="Resized signature" className="max-h-full max-w-full object-contain" />
                </div>
                <figcaption className="text-sm text-slate-600 dark:text-slate-400">Result · {formatBytes(fit.result.size)}</figcaption>
              </figure>
            </div>
          </section>
        )}
        {!fit && working && <p className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">Resizing…</p>}
      </div>
    </div>
  );
}
