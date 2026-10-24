/**
 * Fit an image into a file-size range (for example 10–20 KB) by adjusting JPEG
 * quality and, when quality alone is not enough, the pixel dimensions.
 *
 * The search is independent of the browser: `encode` turns (width, height, quality)
 * into an encoded result with a byte `size`. In the page it draws to a canvas and
 * calls toBlob; in tests it is a simple model.
 */

export interface SizeTarget {
  /** Smallest acceptable file size in bytes (0 = no minimum). */
  minBytes: number;
  /** Largest acceptable file size in bytes. */
  maxBytes: number;
}

export interface Encoded {
  size: number;
}

export type Encoder<T extends Encoded> = (width: number, height: number, quality: number) => Promise<T>;

export interface FitOptions {
  /** Keep these exact dimensions; only the quality changes. */
  fixedSize?: boolean;
  /** Never make the long side larger than this when enlarging to reach a minimum size. */
  maxLongSide?: number;
  /** Never make the short side smaller than this when shrinking. */
  minShortSide?: number;
}

export type FitStatus =
  /** The result is inside the range. */
  | "ok"
  /** Even the smallest allowed version is larger than the maximum. */
  | "too-large"
  /** Even the largest allowed version is smaller than the minimum. */
  | "too-small";

export interface FitResult<T extends Encoded> {
  status: FitStatus;
  result: T;
  width: number;
  height: number;
  quality: number;
  /** True when the dimensions were changed to reach the range. */
  resized: boolean;
}

/**
 * Size limits for a range given in KB. Forms differ in whether a KB is 1,000 or
 * 1,024 bytes, so the maximum uses 1,000 and the minimum 1,024: a file inside
 * these limits passes either way.
 */
export function kbRange(minKB: number, maxKB: number): SizeTarget {
  return { minBytes: Math.max(0, Math.ceil(minKB * 1024)), maxBytes: Math.floor(maxKB * 1000) };
}

/** File size for display: "18.6 KB", "1.24 MB" (1 KB = 1,024 bytes, as Windows shows file sizes). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 2 : 1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const Q_MIN = 0.5; // below this JPEG artefacts show on faces and text; shrink pixels instead
const Q_MAX = 0.95;
const Q_STEPS = 7;

function scaled(width: number, height: number, scale: number) {
  return { w: Math.max(1, Math.round(width * scale)), h: Math.max(1, Math.round(height * scale)) };
}

/**
 * Find the best-looking version inside the range: the highest quality, then the
 * largest dimensions, whose size is between minBytes and maxBytes.
 */
export async function fitToSize<T extends Encoded>(
  width: number,
  height: number,
  target: SizeTarget,
  encode: Encoder<T>,
  options: FitOptions = {}
): Promise<FitResult<T>> {
  const { fixedSize = false, maxLongSide = 6000, minShortSide = 16 } = options;
  const { minBytes, maxBytes } = target;
  const fits = (size: number) => size <= maxBytes && size >= minBytes;

  /** Highest quality in [qLow, qHigh] at this size that is not over the maximum. */
  const bestQuality = async (w: number, h: number, qLow: number, qHigh: number) => {
    const high = await encode(w, h, qHigh);
    if (high.size <= maxBytes) return { quality: qHigh, result: high, over: false };
    let lo = qLow;
    let loResult = await encode(w, h, qLow);
    if (loResult.size > maxBytes) return { quality: qLow, result: loResult, over: true };
    let hi = qHigh;
    for (let i = 0; i < Q_STEPS; i++) {
      const mid = (lo + hi) / 2;
      const r = await encode(w, h, mid);
      if (r.size <= maxBytes) {
        lo = mid;
        loResult = r;
      } else {
        hi = mid;
      }
    }
    return { quality: lo, result: loResult, over: false };
  };

  const done = (status: FitStatus, result: T, w: number, h: number, quality: number): FitResult<T> => ({
    status,
    result,
    width: w,
    height: h,
    quality,
    resized: w !== width || h !== height,
  });

  // 1. Original (or fixed) dimensions, quality only.
  let scale = 1;
  let { w, h } = scaled(width, height, scale);
  let best = await bestQuality(w, h, fixedSize ? 0.05 : Q_MIN, Q_MAX);

  if (fixedSize) {
    if (best.over) return done("too-large", best.result, w, h, best.quality);
    if (best.result.size < minBytes) {
      const top = await encode(w, h, 1);
      if (fits(top.size)) return done("ok", top, w, h, 1);
      return done("too-small", top.size > maxBytes ? best.result : top, w, h, top.size > maxBytes ? best.quality : 1);
    }
    return done("ok", best.result, w, h, best.quality);
  }

  // 2. Too large even at the lowest acceptable quality: shrink the pixels.
  for (let round = 0; best.over && round < 12; round++) {
    // File size grows roughly with pixel count, so scale by the square root of the overshoot.
    const factor = Math.min(0.9, Math.sqrt(maxBytes / best.result.size) * 0.95);
    const next = scale * factor;
    const { w: nw, h: nh } = scaled(width, height, next);
    if (Math.min(nw, nh) < minShortSide) {
      const s = minShortSide / Math.min(width, height);
      ({ w, h } = scaled(width, height, s));
      const last = await bestQuality(w, h, 0.05, Q_MAX);
      return done(last.over ? "too-large" : "ok", last.result, w, h, last.quality);
    }
    scale = next;
    ({ w, h } = { w: nw, h: nh });
    best = await bestQuality(w, h, Q_MIN, Q_MAX);
  }
  if (best.over) {
    const last = await bestQuality(w, h, 0.05, Q_MAX);
    return done(last.over ? "too-large" : "ok", last.result, w, h, last.quality);
  }

  // 3. Below the minimum even at the highest quality: raise quality to the top, then enlarge.
  if (best.result.size < minBytes) {
    let top = await encode(w, h, 1);
    let quality = 1;
    for (let round = 0; top.size < minBytes && round < 12; round++) {
      const factor = Math.max(1.05, Math.sqrt(minBytes / top.size) * 1.05);
      const { w: nw, h: nh } = scaled(width, height, scale * factor);
      if (Math.max(nw, nh) > maxLongSide) break;
      scale *= factor;
      ({ w, h } = { w: nw, h: nh });
      top = await encode(w, h, 1);
      quality = 1;
      if (top.size > maxBytes) {
        // Overshot: settle on the best quality at this size that is still in range.
        const settled = await bestQuality(w, h, Q_MIN, 1);
        return done(fits(settled.result.size) ? "ok" : "too-small", settled.result, w, h, settled.quality);
      }
    }
    return done(fits(top.size) ? "ok" : "too-small", top, w, h, quality);
  }

  return done("ok", best.result, w, h, best.quality);
}
