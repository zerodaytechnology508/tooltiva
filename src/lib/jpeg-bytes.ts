/** Byte-level JPEG edits that never touch the pixels: the DPI header and padding. */

/**
 * Write the DPI into a JPEG's JFIF header so programs that check print size (cm
 * or inches) read it correctly. Adds a JFIF header when the encoder left it out.
 * The pixels are not touched.
 */
export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  const d = Math.max(1, Math.min(65535, Math.round(dpi)));
  const isJfif =
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes[3] === 0xe0 &&
    bytes[6] === 0x4a && bytes[7] === 0x46 && bytes[8] === 0x49 && bytes[9] === 0x46 && bytes[10] === 0x00;
  if (isJfif) {
    const out = bytes.slice();
    out[13] = 1; // density unit: dots per inch
    out[14] = d >> 8;
    out[15] = d & 0xff;
    out[16] = d >> 8;
    out[17] = d & 0xff;
    return out;
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const app0 = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 1, d >> 8, d & 0xff, d >> 8, d & 0xff, 0x00, 0x00];
  const out = new Uint8Array(bytes.length + app0.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}

/** The DPI stored in a JPEG's JFIF header, or null when there is none. */
export function readJpegDpi(bytes: Uint8Array): number | null {
  if (bytes[3] !== 0xe0 || bytes[6] !== 0x4a || bytes[13] !== 1) return null;
  return (bytes[14] << 8) | bytes[15];
}

/**
 * Make a JPEG at least `minBytes` long by adding comment (COM) segments right after
 * the start marker. Image viewers and form uploads ignore comments, so the picture
 * is unchanged; only the file size grows. Used when a form demands a minimum size
 * that the image cannot reach at its required dimensions.
 */
export function padJpeg(bytes: Uint8Array, minBytes: number): Uint8Array {
  if (bytes.length >= minBytes || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const segments: Uint8Array[] = [];
  let missing = minBytes - bytes.length;
  while (missing > 0) {
    // A segment is 4 bytes of marker and length plus up to 65,533 bytes of data.
    const data = Math.min(65533, Math.max(1, missing - 4));
    const seg = new Uint8Array(4 + data);
    seg[0] = 0xff;
    seg[1] = 0xfe;
    seg[2] = (data + 2) >> 8;
    seg[3] = (data + 2) & 0xff;
    seg.fill(0x20, 4); // spaces
    segments.push(seg);
    missing -= seg.length;
  }
  const extra = segments.reduce((n, seg) => n + seg.length, 0);
  // Keep a JFIF header first when there is one, so DPI and format detection still work.
  const insertAt = bytes[2] === 0xff && bytes[3] === 0xe0 ? 4 + ((bytes[4] << 8) | bytes[5]) : 2;
  const out = new Uint8Array(bytes.length + extra);
  out.set(bytes.subarray(0, insertAt), 0);
  let at = insertAt;
  for (const seg of segments) {
    out.set(seg, at);
    at += seg.length;
  }
  out.set(bytes.subarray(insertAt), at);
  return out;
}
