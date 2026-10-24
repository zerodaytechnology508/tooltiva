/**
 * Browser-only helpers for the image tools: read a photo, draw it at a new size
 * with good quality, and encode it as JPEG. Nothing leaves the device.
 */
import type { Encoder, FitResult } from "./image-size";
import { padJpeg } from "./jpeg-bytes";

export type ImageSource = ImageBitmap | HTMLImageElement;

export interface LoadedImage {
  source: ImageSource;
  width: number;
  height: number;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface JpegResult {
  size: number;
  blob: Blob;
}

export class UnsupportedImageError extends Error {}

const HEIC = /\.(heic|heif)$/i;

/** Decode an image file, applying the rotation stored by phone cameras. */
export async function loadImage(file: Blob & { name?: string }): Promise<LoadedImage> {
  const isHeic = /image\/hei[cf]/i.test(file.type) || (!!file.name && HEIC.test(file.name));
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Fall through to <img>, which decodes some formats createImageBitmap rejects.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    throw new UnsupportedImageError(
      isHeic
        ? "This browser can't open HEIC photos from iPhones. On the iPhone, choose Settings > Camera > Formats > Most Compatible, or share the photo as JPEG, then try again."
        : "This file could not be opened as an image. Use a JPG, PNG or WebP file."
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Draw (part of) the source onto a new canvas of the given size. Large reductions
 * are done in halving steps, which keeps fine lines such as signatures and text sharp.
 */
export function drawScaled(source: ImageSource | HTMLCanvasElement, crop: CropRect, width: number, height: number): HTMLCanvasElement {
  let current: ImageSource | HTMLCanvasElement = source;
  let cx = crop.x;
  let cy = crop.y;
  let cw = crop.width;
  let ch = crop.height;
  while (cw / 2 >= width && ch / 2 >= height) {
    const step = makeCanvas(Math.round(cw / 2), Math.round(ch / 2));
    const ctx = step.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(current, cx, cy, cw, ch, 0, 0, step.width, step.height);
    current = step;
    cx = 0;
    cy = 0;
    cw = step.width;
    ch = step.height;
  }
  const out = makeCanvas(width, height);
  const ctx = out.getContext("2d")!;
  // JPEG has no transparency: transparent areas (PNG logos, signatures) become white, not black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(current, cx, cy, cw, ch, 0, 0, width, height);
  return out;
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("JPEG encoding failed"))), "image/jpeg", quality)
  );
}

/**
 * An Encoder for fitToSize: draws the (cropped) image at each requested size,
 * runs an optional pixel step (such as whitening a signature's paper), and encodes JPEG.
 * Canvases are cached per size, so the quality search re-encodes without redrawing.
 */
export function jpegEncoder(
  image: LoadedImage,
  crop: CropRect = { x: 0, y: 0, width: image.width, height: image.height },
  process?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
): Encoder<JpegResult> {
  const cache = new Map<string, HTMLCanvasElement>();
  return async (width, height, quality) => {
    const key = `${width}x${height}`;
    let canvas = cache.get(key);
    if (!canvas) {
      canvas = drawScaled(image.source, crop, width, height);
      if (process) process(canvas.getContext("2d")!, width, height);
      if (cache.size > 6) cache.clear();
      cache.set(key, canvas);
    }
    const blob = await canvasToJpeg(canvas, quality);
    return { size: blob.size, blob };
  };
}

/**
 * A realistic sample photo (sky, sun, hills, texture), generated on the device so
 * the tools can be tried without a file. About 2400 x 1600 pixels.
 */
export async function samplePhoto(): Promise<File> {
  const width = 2400;
  const height = 1600;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#5b8fd6");
  sky.addColorStop(0.55, "#f2c48d");
  sky.addColorStop(1, "#e8a46a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fff4d6";
  ctx.beginPath();
  ctx.arc(1700, 760, 140, 0, Math.PI * 2);
  ctx.fill();
  const hills = ["#5f7d4e", "#4a6a3c", "#36522c"];
  hills.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 40) {
      const y = 900 + i * 180 + Math.sin(x / (260 - i * 50) + i) * (90 - i * 15) + Math.sin(x / 70) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  });
  // Fine texture, as in a real camera photo, so file sizes behave realistically.
  const data = ctx.getImageData(0, 0, width, height);
  let seed = 7;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const n = ((seed >> 16) % 25) - 12;
    data.data[i] += n;
    data.data[i + 1] += n;
    data.data[i + 2] += n;
  }
  ctx.putImageData(data, 0, 0);
  const blob = await canvasToJpeg(canvas, 0.92);
  return new File([blob], "sample-photo.jpg", { type: "image/jpeg" });
}

/**
 * A sample signature as a phone photo would capture it: blue ink on slightly grey,
 * unevenly lit paper. Generated on the device.
 */
export async function sampleSignature(): Promise<File> {
  const width = 1600;
  const height = 1000;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const light = ctx.createRadialGradient(500, 300, 100, 800, 500, 1100);
  light.addColorStop(0, "#efece4");
  light.addColorStop(1, "#bdb8ab");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#1f3a8a";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(420, 560);
  ctx.bezierCurveTo(470, 380, 560, 360, 540, 560);
  ctx.bezierCurveTo(530, 650, 600, 470, 650, 520);
  ctx.bezierCurveTo(690, 560, 700, 600, 760, 500);
  ctx.bezierCurveTo(800, 430, 820, 640, 880, 520);
  ctx.bezierCurveTo(930, 420, 960, 600, 1010, 540);
  ctx.bezierCurveTo(1060, 480, 1090, 560, 1140, 500);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(400, 640);
  ctx.bezierCurveTo(650, 600, 900, 610, 1190, 590);
  ctx.stroke();
  const data = ctx.getImageData(0, 0, width, height);
  let seed = 11;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const n = ((seed >> 16) % 13) - 6;
    data.data[i] += n;
    data.data[i + 1] += n;
    data.data[i + 2] += n;
  }
  ctx.putImageData(data, 0, 0);
  const blob = await canvasToJpeg(canvas, 0.9);
  return new File([blob], "sample-signature.jpg", { type: "image/jpeg" });
}

/** Read the whole image (scaled so the long side is at most `maxSide`) as RGBA pixels for analysis. */
export function readPixels(image: LoadedImage, maxSide = 1000): { data: Uint8ClampedArray; width: number; height: number; scale: number } {
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = drawScaled(image.source, { x: 0, y: 0, width: image.width, height: image.height }, width, height);
  return { data: canvas.getContext("2d")!.getImageData(0, 0, width, height).data, width, height, scale };
}

/**
 * When a result is below the minimum size (status "too-small"), pad the JPEG with
 * comment data up to the minimum. Pixels are unchanged. Returns the result as is
 * when padding is not needed or would exceed the maximum.
 */
export async function padToMinimum(
  fit: FitResult<JpegResult>,
  minBytes: number,
  maxBytes: number
): Promise<{ fit: FitResult<JpegResult>; padded: boolean }> {
  if (fit.status !== "too-small" || minBytes <= 0 || fit.result.size > maxBytes) return { fit, padded: false };
  const bytes = padJpeg(new Uint8Array(await fit.result.blob.arrayBuffer()), minBytes);
  if (bytes.length > maxBytes) return { fit, padded: false };
  const blob = new Blob([bytes as BlobPart], { type: "image/jpeg" });
  return { fit: { ...fit, status: "ok", result: { blob, size: blob.size } }, padded: true };
}
