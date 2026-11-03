/**
 * Read and change the resolution (DPI) stored in JPG and PNG files.
 *
 * Only header fields are rewritten, never the compressed image data, so the pixels
 * and the quality stay exactly the same; the file grows by at most a few bytes.
 *
 * - JPG: the JFIF header (added when missing), the EXIF XResolution / YResolution /
 *   ResolutionUnit fields of the main image, and Photoshop's ResolutionInfo block.
 *   Programs differ in which one they read, so every copy is updated.
 * - PNG: the pHYs chunk (pixels per metre), added when missing.
 */
import { crc32 } from "./zip";

export type DpiFormat = "jpeg" | "png";
export type DpiSource = "JFIF" | "EXIF" | "Photoshop" | "PNG";

export interface DpiReading {
  source: DpiSource;
  x: number;
  y: number;
}

export interface DpiInfo {
  format: DpiFormat | null;
  width: number | null;
  height: number | null;
  /** Every DPI value found in the file, in the order programs usually prefer them. */
  readings: DpiReading[];
  /** The value most programs show: Photoshop, then EXIF, then JFIF / PNG. Null when none is stored. */
  dpi: DpiReading | null;
  /** True when the JPG has camera / location data (an EXIF block). */
  hasExif: boolean;
}

export class UnsupportedFormatError extends Error {
  constructor() {
    super("Only JPG and PNG files have a DPI that can be changed without re-saving the image.");
    this.name = "UnsupportedFormatError";
  }
}

const MAX_DPI = 65535;
const INCH = 0.0254; // metres

export function clampDpi(dpi: number): number {
  return Math.max(1, Math.min(MAX_DPI, Math.round(dpi)));
}

export function detectFormat(b: Uint8Array): DpiFormat | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length > 8 && sig.every((v, i) => b[i] === v)) return "png";
  return null;
}

const u16 = (b: Uint8Array, o: number, le = false) => (le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]);
const u32 = (b: Uint8Array, o: number, le = false) =>
  (le ? b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24) : (b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
function put16(b: Uint8Array, o: number, v: number, le = false) {
  if (le) { b[o] = v & 0xff; b[o + 1] = (v >> 8) & 0xff; } else { b[o] = (v >> 8) & 0xff; b[o + 1] = v & 0xff; }
}
function put32(b: Uint8Array, o: number, v: number, le = false) {
  if (le) { b[o] = v & 0xff; b[o + 1] = (v >>> 8) & 0xff; b[o + 2] = (v >>> 16) & 0xff; b[o + 3] = (v >>> 24) & 0xff; }
  else { b[o] = (v >>> 24) & 0xff; b[o + 1] = (v >>> 16) & 0xff; b[o + 2] = (v >>> 8) & 0xff; b[o + 3] = v & 0xff; }
}
function ascii(b: Uint8Array, o: number, s: string): boolean {
  for (let i = 0; i < s.length; i++) if (b[o + i] !== s.charCodeAt(i)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// JPEG

interface Segment {
  marker: number;
  /** Offset of the 0xFF of the marker. */
  start: number;
  /** Offset of the segment data (after the 2-byte length). */
  data: number;
  /** Length of the data, excluding the length field. */
  length: number;
}

/** Header segments of a JPEG, up to the start of the image data (SOS). */
function jpegSegments(b: Uint8Array): Segment[] {
  const out: Segment[] = [];
  let pos = 2;
  while (pos + 4 <= b.length) {
    if (b[pos] !== 0xff) break;
    let m = pos + 1;
    while (b[m] === 0xff && m < b.length) m++; // fill bytes
    const marker = b[m];
    const start = m - 1;
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { pos = m + 1; continue; }
    if (marker === 0xd9) break;
    const len = u16(b, m + 1);
    if (len < 2 || m + 1 + len > b.length) break;
    out.push({ marker, start, data: m + 3, length: len - 2 });
    if (marker === 0xda) break; // image data follows
    pos = m + 1 + len;
  }
  return out;
}

const isJfif = (b: Uint8Array, s: Segment) => s.marker === 0xe0 && s.length >= 14 && ascii(b, s.data, "JFIF\0");
const isExif = (b: Uint8Array, s: Segment) => s.marker === 0xe1 && s.length >= 14 && ascii(b, s.data, "Exif\0\0");
const isPhotoshop = (b: Uint8Array, s: Segment) => s.marker === 0xed && s.length >= 14 && ascii(b, s.data, "Photoshop 3.0\0");

interface ExifRes {
  le: boolean;
  /** Absolute offsets of the X and Y RATIONAL values, and of the unit SHORT (or -1). */
  x: number;
  y: number;
  unit: number;
}

/** Positions of the main image's resolution fields inside an EXIF segment. */
function exifResolution(b: Uint8Array, s: Segment): ExifRes | null {
  const tiff = s.data + 6;
  const end = s.data + s.length;
  if (tiff + 8 > end) return null;
  const le = b[tiff] === 0x49 && b[tiff + 1] === 0x49;
  if (!le && !(b[tiff] === 0x4d && b[tiff + 1] === 0x4d)) return null;
  const ifd = tiff + u32(b, tiff + 4, le);
  if (ifd + 2 > end) return null;
  const count = u16(b, ifd, le);
  let x = -1, y = -1, unit = -1;
  for (let i = 0; i < count; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > end) break;
    const tag = u16(b, e, le);
    const type = u16(b, e + 2, le);
    if ((tag === 0x011a || tag === 0x011b) && type === 5) {
      const at = tiff + u32(b, e + 8, le);
      if (at + 8 <= end) { if (tag === 0x011a) x = at; else y = at; }
    } else if (tag === 0x0128 && type === 3) {
      unit = e + 8;
    }
  }
  return x >= 0 && y >= 0 ? { le, x, y, unit } : null;
}

/** Offset of the data of Photoshop's ResolutionInfo (8BIM 0x03ED) block, or -1. */
function photoshopResolution(b: Uint8Array, s: Segment): number {
  let p = s.data + 14;
  const end = s.data + s.length;
  while (p + 12 <= end && ascii(b, p, "8BIM")) {
    const id = u16(b, p + 4);
    let q = p + 6;
    const nameLen = b[q];
    q += 1 + nameLen + ((1 + nameLen) % 2); // Pascal string padded to even length
    if (q + 4 > end) break;
    const size = u32(b, q);
    const data = q + 4;
    if (id === 0x03ed && size >= 16 && data + 16 <= end) return data;
    p = data + size + (size % 2);
  }
  return -1;
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

function readJpeg(b: Uint8Array): Omit<DpiInfo, "format" | "dpi"> {
  let width: number | null = null;
  let height: number | null = null;
  let hasExif = false;
  const readings: DpiReading[] = [];
  for (const s of jpegSegments(b)) {
    if (s.marker >= 0xc0 && s.marker <= 0xcf && s.marker !== 0xc4 && s.marker !== 0xc8 && s.marker !== 0xcc && s.length >= 5) {
      height = u16(b, s.data + 1);
      width = u16(b, s.data + 3);
    } else if (isJfif(b, s)) {
      const unit = b[s.data + 7];
      const x = u16(b, s.data + 8), y = u16(b, s.data + 10);
      if (unit === 1 && x && y) readings.push({ source: "JFIF", x, y });
      if (unit === 2 && x && y) readings.push({ source: "JFIF", x: round2(x * 2.54), y: round2(y * 2.54) });
    } else if (isExif(b, s)) {
      hasExif = true;
      const r = exifResolution(b, s);
      if (r) {
        const unit = r.unit >= 0 ? u16(b, r.unit, r.le) : 2;
        const val = (o: number) => { const d = u32(b, o + 4, r.le); return d ? u32(b, o, r.le) / d : 0; };
        const x = val(r.x), y = val(r.y);
        if (x && y && (unit === 2 || unit === 3)) {
          const f = unit === 3 ? 2.54 : 1;
          readings.push({ source: "EXIF", x: round2(x * f), y: round2(y * f) });
        }
      }
    } else if (isPhotoshop(b, s)) {
      const d = photoshopResolution(b, s);
      if (d >= 0) {
        // Stored in pixels per inch (16.16 fixed point); the unit fields only choose how Photoshop displays it.
        const x = u32(b, d) / 65536, y = u32(b, d + 8) / 65536;
        if (x && y) readings.push({ source: "Photoshop", x: round2(x), y: round2(y) });
      }
    }
  }
  return { width, height, readings, hasExif };
}

function writeJpeg(b: Uint8Array, dpi: number, removeExif: boolean): Uint8Array {
  const d = clampDpi(dpi);
  const segments = jpegSegments(b);
  let out = b.slice();
  let hasJfif = false;
  for (const s of segments) {
    if (isJfif(out, s)) {
      hasJfif = true;
      out[s.data + 7] = 1; // dots per inch
      put16(out, s.data + 8, d);
      put16(out, s.data + 10, d);
    } else if (isExif(out, s) && !removeExif) {
      const r = exifResolution(out, s);
      if (r) {
        put32(out, r.x, d, r.le); put32(out, r.x + 4, 1, r.le);
        put32(out, r.y, d, r.le); put32(out, r.y + 4, 1, r.le);
        if (r.unit >= 0) put16(out, r.unit, 2, r.le);
      }
    } else if (isPhotoshop(out, s)) {
      const p = photoshopResolution(out, s);
      if (p >= 0) {
        put32(out, p, d * 65536); put16(out, p + 4, 1);
        put32(out, p + 8, d * 65536); put16(out, p + 12, 1);
      }
    }
  }
  if (removeExif) {
    const drop = segments.filter((s) => isExif(out, s) || (s.marker === 0xe1 && ascii(out, s.data, "http://ns.adobe.com/xap/1.0/\0")));
    if (drop.length) {
      const parts: Uint8Array[] = [];
      let last = 0;
      for (const s of drop) {
        parts.push(out.subarray(last, s.start));
        last = s.data + s.length;
      }
      parts.push(out.subarray(last));
      const joined = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
      let o = 0;
      for (const p of parts) { joined.set(p, o); o += p.length; }
      out = joined;
    }
  }
  if (!hasJfif) {
    // JFIF header right after the start marker, as the JFIF format requires.
    const app0 = new Uint8Array([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 1, d >> 8, d & 0xff, d >> 8, d & 0xff, 0x00, 0x00]);
    const joined = new Uint8Array(out.length + app0.length);
    joined.set(out.subarray(0, 2), 0);
    joined.set(app0, 2);
    joined.set(out.subarray(2), 2 + app0.length);
    out = joined;
  }
  return out;
}

// ---------------------------------------------------------------------------
// PNG

interface Chunk {
  type: string;
  start: number;
  data: number;
  length: number;
}

function pngChunks(b: Uint8Array): Chunk[] {
  const out: Chunk[] = [];
  let p = 8;
  while (p + 12 <= b.length) {
    const length = u32(b, p);
    const type = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]);
    if (p + 12 + length > b.length) break;
    out.push({ type, start: p, data: p + 8, length });
    if (type === "IEND") break;
    p += 12 + length;
  }
  return out;
}

function readPng(b: Uint8Array): Omit<DpiInfo, "format" | "dpi"> {
  const chunks = pngChunks(b);
  const ihdr = chunks.find((c) => c.type === "IHDR");
  const phys = chunks.find((c) => c.type === "pHYs" && c.length === 9);
  const readings: DpiReading[] = [];
  if (phys && b[phys.data + 8] === 1) {
    const x = u32(b, phys.data), y = u32(b, phys.data + 4);
    if (x && y) readings.push({ source: "PNG", x: Math.round(x * INCH), y: Math.round(y * INCH) });
  }
  return { width: ihdr ? u32(b, ihdr.data) : null, height: ihdr ? u32(b, ihdr.data + 4) : null, readings, hasExif: false };
}

function physChunk(dpi: number): Uint8Array {
  const ppm = Math.round(dpi / INCH);
  const c = new Uint8Array(21);
  put32(c, 0, 9);
  c.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  put32(c, 8, ppm);
  put32(c, 12, ppm);
  c[16] = 1; // unit: metre
  put32(c, 17, crc32(c.subarray(4, 17)));
  return c;
}

function writePng(b: Uint8Array, dpi: number): Uint8Array {
  const chunks = pngChunks(b);
  const ihdr = chunks.find((c) => c.type === "IHDR");
  if (!ihdr) throw new UnsupportedFormatError();
  const phys = physChunk(clampDpi(dpi));
  const old = chunks.find((c) => c.type === "pHYs");
  // Replace an existing pHYs, or put the new one right after IHDR (it must come before the image data).
  const cutFrom = old ? old.start : ihdr.data + ihdr.length + 4;
  const cutTo = old ? old.data + old.length + 4 : cutFrom;
  const out = new Uint8Array(b.length - (cutTo - cutFrom) + phys.length);
  out.set(b.subarray(0, cutFrom), 0);
  out.set(phys, cutFrom);
  out.set(b.subarray(cutTo), cutFrom + phys.length);
  return out;
}

// ---------------------------------------------------------------------------

const PREFERENCE: DpiSource[] = ["Photoshop", "EXIF", "JFIF", "PNG"];

export function readDpiInfo(bytes: Uint8Array): DpiInfo {
  const format = detectFormat(bytes);
  if (!format) return { format: null, width: null, height: null, readings: [], dpi: null, hasExif: false };
  const r = format === "jpeg" ? readJpeg(bytes) : readPng(bytes);
  const readings = [...r.readings].sort((a, b) => PREFERENCE.indexOf(a.source) - PREFERENCE.indexOf(b.source));
  return { format, ...r, readings, dpi: readings[0] ?? null };
}

/**
 * The same file with its DPI set to `dpi` in every place it is stored. The image
 * data is not touched. `removeExif` also drops a JPG's EXIF and XMP blocks (camera,
 * date and location details).
 */
export function setDpi(bytes: Uint8Array, dpi: number, { removeExif = false }: { removeExif?: boolean } = {}): Uint8Array {
  const format = detectFormat(bytes);
  if (format === "jpeg") return writeJpeg(bytes, dpi, removeExif);
  if (format === "png") return writePng(bytes, dpi);
  throw new UnsupportedFormatError();
}

/** Printed size of `pixels` at `dpi`, in centimetres and inches. */
export function printSize(pixels: number, dpi: number): { cm: number; inches: number } {
  const inches = pixels / dpi;
  return { cm: inches * 2.54, inches };
}

/** Pixels needed to print `cm` centimetres at `dpi`. */
export function pixelsFor(cm: number, dpi: number): number {
  return Math.round((cm / 2.54) * dpi);
}
