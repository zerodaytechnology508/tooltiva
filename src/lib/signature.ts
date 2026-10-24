/**
 * Pixel logic for the signature resizer, independent of the browser so it can be
 * tested: measure paper and ink brightness, find the signature's bounding box,
 * and clean the background to pure white.
 */

export interface SignatureAnalysis {
  /** Typical brightness (0–255) of the paper. */
  paper: number;
  /** Typical brightness (0–255) of the ink. */
  ink: number;
  /** Bounding box of the ink, with a margin, in the analysed image's pixels; null when no ink was found. */
  box: { x: number; y: number; width: number; height: number } | null;
}

const luminance = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Brightness at a given percentile (0–1) of the image's pixels. */
function percentile(hist: Uint32Array, total: number, p: number): number {
  const target = total * p;
  let seen = 0;
  for (let v = 0; v < 256; v++) {
    seen += hist[v];
    if (seen >= target) return v;
  }
  return 255;
}

/**
 * Measure the paper and ink, and find where the signature is. `data` is RGBA,
 * as from canvas getImageData. Transparent pixels count as paper.
 */
export function analyzeSignature(data: Uint8ClampedArray, width: number, height: number, margin = 0.06): SignatureAnalysis {
  const hist = new Uint32Array(256);
  const lum = new Uint8Array(width * height);
  for (let i = 0, p = 0; p < lum.length; i += 4, p++) {
    const a = data[i + 3] / 255;
    const v = Math.round(luminance(data[i], data[i + 1], data[i + 2]) * a + 255 * (1 - a));
    lum[p] = v;
    hist[v]++;
  }
  const paper = percentile(hist, lum.length, 0.6);
  const darkest = percentile(hist, lum.length, 0.005);
  if (paper - darkest < 40) return { paper, ink: darkest, box: null };
  // Ink: the darker pixels, well below the paper.
  const cut = paper - (paper - darkest) * 0.45;
  let inkSum = 0;
  let inkCount = 0;
  const rowCount = new Uint32Array(height);
  const colCount = new Uint32Array(width);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = lum[y * width + x];
      if (v < cut) {
        inkSum += v;
        inkCount++;
        rowCount[y]++;
        colCount[x]++;
      }
    }
  }
  if (inkCount === 0) return { paper, ink: darkest, box: null };
  const ink = Math.round(inkSum / inkCount);
  // Ignore specks: a row or column needs a few ink pixels to count.
  const minHits = Math.max(2, Math.round(Math.min(width, height) * 0.01));
  const first = (counts: Uint32Array) => counts.findIndex((c) => c >= minHits);
  const last = (counts: Uint32Array) => {
    for (let i = counts.length - 1; i >= 0; i--) if (counts[i] >= minHits) return i;
    return -1;
  };
  const top = first(rowCount);
  const bottom = last(rowCount);
  const left = first(colCount);
  const right = last(colCount);
  if (top < 0 || left < 0) return { paper, ink, box: null };
  const pad = Math.round(Math.max(bottom - top, right - left) * margin);
  const x = Math.max(0, left - pad);
  const y = Math.max(0, top - pad);
  return {
    paper,
    ink,
    box: { x, y, width: Math.min(width, right + pad + 1) - x, height: Math.min(height, bottom + pad + 1) - y },
  };
}

export type InkMode = "original" | "black";

/**
 * Make the paper pure white and, optionally, the ink black. Pixels between ink and
 * paper brightness are blended smoothly, so edges stay antialiased instead of jagged.
 */
export function cleanSignature(data: Uint8ClampedArray, paper: number, ink: number, mode: InkMode): void {
  const span = Math.max(30, paper - ink);
  for (let i = 0; i < data.length; i += 4) {
    const v = luminance(data[i], data[i + 1], data[i + 2]);
    // 0 = full ink, 1 = paper.
    const t = Math.min(1, Math.max(0, ((v - ink) / span - 0.15) / 0.55));
    if (mode === "black") {
      const g = Math.round(255 * t);
      data[i] = g;
      data[i + 1] = g;
      data[i + 2] = g;
    } else {
      data[i] = Math.round(data[i] + (255 - data[i]) * t);
      data[i + 1] = Math.round(data[i + 1] + (255 - data[i + 1]) * t);
      data[i + 2] = Math.round(data[i + 2] + (255 - data[i + 2]) * t);
    }
    data[i + 3] = 255;
  }
}

/** Pixels for a length in centimetres at a given DPI (1 inch = 2.54 cm). */
export function cmToPx(cm: number, dpi: number): number {
  return Math.round((cm / 2.54) * dpi);
}

export { setJpegDpi, readJpegDpi } from "./jpeg-bytes";
