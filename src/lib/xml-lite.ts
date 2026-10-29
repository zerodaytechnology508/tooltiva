/**
 * A minimal, fast XML tokenizer for the machine-written XML inside .xlsx files.
 * It reports start tags (with attributes), end tags and text; it does not
 * validate or build a tree. Element names are reported without their namespace
 * prefix ("x:row" → "row"); attribute names keep theirs ("r:id").
 */

export interface XmlHandlers {
  open?: (name: string, attrs: Record<string, string>, selfClosing: boolean) => void;
  close?: (name: string) => void;
  text?: (text: string) => void;
}

const ENTITY: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

/** Decode XML entities (&amp; &#38; &#x26;). */
export function decodeEntities(text: string): string {
  if (text.indexOf("&") < 0) return text;
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return ENTITY[body] ?? whole;
  });
}

function localName(qualified: string): string {
  const colon = qualified.indexOf(":");
  return colon < 0 ? qualified : qualified.slice(colon + 1);
}

function parseAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s=/]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) attrs[m[1]] = decodeEntities(m[3] ?? m[4] ?? "");
  return attrs;
}

/** Walk the XML string and call the handlers in document order. */
export function scanXml(xml: string, handlers: XmlHandlers): void {
  const { open, close, text } = handlers;
  const length = xml.length;
  let i = 0;
  while (i < length) {
    const lt = xml.indexOf("<", i);
    if (lt < 0) {
      if (text && i < length) text(decodeEntities(xml.slice(i)));
      break;
    }
    if (lt > i && text) text(decodeEntities(xml.slice(i, lt)));
    const next = xml.charCodeAt(lt + 1);
    if (next === 63 /* ? */) {
      const end = xml.indexOf("?>", lt + 2);
      i = end < 0 ? length : end + 2;
      continue;
    }
    if (next === 33 /* ! */) {
      if (xml.startsWith("<!--", lt)) {
        const end = xml.indexOf("-->", lt + 4);
        i = end < 0 ? length : end + 3;
      } else if (xml.startsWith("<![CDATA[", lt)) {
        const end = xml.indexOf("]]>", lt + 9);
        if (text) text(xml.slice(lt + 9, end < 0 ? length : end));
        i = end < 0 ? length : end + 3;
      } else {
        const end = xml.indexOf(">", lt + 2);
        i = end < 0 ? length : end + 1;
      }
      continue;
    }
    // Find the end of the tag, skipping ">" inside quoted attribute values.
    let j = lt + 1;
    let quote = 0;
    for (; j < length; j++) {
      const c = xml.charCodeAt(j);
      if (quote) {
        if (c === quote) quote = 0;
      } else if (c === 34 || c === 39) quote = c;
      else if (c === 62 /* > */) break;
    }
    const body = xml.slice(lt + 1, j);
    i = j + 1;
    if (body.charCodeAt(0) === 47 /* / */) {
      if (close) close(localName(body.slice(1).trim()));
      continue;
    }
    const selfClosing = body.charCodeAt(body.length - 1) === 47;
    const inner = selfClosing ? body.slice(0, -1) : body;
    let nameEnd = 0;
    while (nameEnd < inner.length && !/\s/.test(inner[nameEnd])) nameEnd++;
    const name = localName(inner.slice(0, nameEnd));
    if (open) open(name, nameEnd < inner.length ? parseAttributes(inner.slice(nameEnd)) : {}, selfClosing);
    if (selfClosing && close) close(name);
  }
}

/** Excel escapes some characters in strings as _xHHHH_ (for example _x000D_ for a carriage return). */
export function decodeExcelEscapes(text: string): string {
  if (text.indexOf("_x") < 0) return text;
  return text.replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}
