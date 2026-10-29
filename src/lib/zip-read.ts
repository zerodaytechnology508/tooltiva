/**
 * A small ZIP reader for .xlsx files (which are ZIP packages). Reads the central
 * directory, then inflates single entries on demand with the browser's built-in
 * DecompressionStream ("deflate-raw"), so no library is needed and nothing leaves
 * the device. Supports the two methods Office uses: stored (0) and deflate (8).
 */

export interface ZipFileEntry {
  name: string;
  method: number;
  compressedSize: number;
  size: number;
  localHeaderOffset: number;
}

export class ZipError extends Error {}

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

/** True when the bytes start like a ZIP archive ("PK\x03\x04"). */
export function looksLikeZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

/** True for the OLE2 compound format used by .xls (Excel 97–2003) and by password-protected Office files. */
export function looksLikeOle(bytes: Uint8Array): boolean {
  const sig = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
  return bytes.length >= 8 && sig.every((b, i) => bytes[i] === b);
}

/** List the entries of a ZIP archive. Throws ZipError when the archive is damaged. */
export function listZip(bytes: Uint8Array): Map<string, ZipFileEntry> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // The end-of-central-directory record is in the last 22 + 65,535 bytes.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipError("The file is not a complete ZIP package (the end of the archive is missing).");
  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  if (offset === 0xffffffff || count === 0xffff) throw new ZipError("ZIP64 archives (over 4 GB) are not supported.");

  const decoder = new TextDecoder("utf-8");
  const entries = new Map<string, ZipFileEntry>();
  for (let n = 0; n < count; n++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
      throw new ZipError("The ZIP directory is damaged.");
    }
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const size = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    entries.set(name, { name, method, compressedSize, size, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

/** Decompress one entry to bytes. */
export async function readZipEntry(bytes: Uint8Array, entry: ZipFileEntry): Promise<Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const at = entry.localHeaderOffset;
  if (at + 30 > bytes.length || view.getUint32(at, true) !== LOCAL_SIGNATURE) {
    throw new ZipError(`The ZIP entry ${entry.name} is damaged.`);
  }
  const start = at + 30 + view.getUint16(at + 26, true) + view.getUint16(at + 28, true);
  const data = bytes.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return data;
  if (entry.method !== 8) throw new ZipError(`Unsupported ZIP compression method ${entry.method} in ${entry.name}.`);
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Decompress one entry as UTF-8 text, or return null when the entry does not exist. */
export async function readZipText(bytes: Uint8Array, entries: Map<string, ZipFileEntry>, name: string): Promise<string | null> {
  const entry = entries.get(name) ?? entries.get(name.replace(/^\//, ""));
  if (!entry) return null;
  return new TextDecoder("utf-8").decode(await readZipEntry(bytes, entry));
}
