/**
 * Read an uploaded file as text without silently garbling characters.
 *
 * FileReader.readAsText assumes UTF-8 and replaces invalid bytes with U+FFFD,
 * so a CSV exported by older Excel versions (Windows-1252) would lose its
 * accented characters without warning. This helper:
 * - decodes UTF-16 files that start with a UTF-16 byte-order mark,
 * - decodes strict UTF-8 (a UTF-8 BOM is removed),
 * - otherwise falls back to Windows-1252 and returns a notice for the user.
 */
export interface DecodedTextFile {
  text: string;
  /** Set when the file was not UTF-8 and a fallback encoding was used. */
  notice?: string;
}

export function decodeTextBytes(bytes: Uint8Array, fileName = "The file"): DecodedTextFile {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { text: new TextDecoder("utf-16le").decode(bytes) };
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { text: new TextDecoder("utf-16be").decode(bytes) };
  }
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return {
      text: new TextDecoder("windows-1252").decode(bytes),
      notice: `${fileName} is not valid UTF-8, so it was read as Windows-1252 (Western European). Check that accented characters look right; if not, save the file as UTF-8 and upload it again.`,
    };
  }
}

export async function readTextFile(file: Blob & { name?: string }): Promise<DecodedTextFile> {
  const buffer = await file.arrayBuffer();
  return decodeTextBytes(new Uint8Array(buffer), file.name ? `"${file.name}"` : "The file");
}
