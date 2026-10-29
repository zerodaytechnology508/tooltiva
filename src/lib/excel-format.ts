/**
 * Excel number formats: turn a cell's stored number into the text Excel shows,
 * such as 02134 for a ZIP code formatted "00000", 12.5% for 0.125, or
 * 10/29/2026 for the date serial 46324. Covers the formats real spreadsheets
 * use (General, fixed decimals, thousands separators, percent, scientific,
 * literal text and padding, dates and times, elapsed time, multiple sections);
 * fractions fall back to General.
 */

/** Excel's built-in format codes (en-US), by numFmtId. */
export const BUILTIN_FORMATS: Record<number, string> = {
  0: "General",
  1: "0",
  2: "0.00",
  3: "#,##0",
  4: "#,##0.00",
  5: '"$"#,##0_);\\("$"#,##0\\)',
  6: '"$"#,##0_);[Red]\\("$"#,##0\\)',
  7: '"$"#,##0.00_);\\("$"#,##0.00\\)',
  8: '"$"#,##0.00_);[Red]\\("$"#,##0.00\\)',
  9: "0%",
  10: "0.00%",
  11: "0.00E+00",
  12: "# ?/?",
  13: "# ??/??",
  14: "m/d/yyyy",
  15: "d-mmm-yy",
  16: "d-mmm",
  17: "mmm-yy",
  18: "h:mm AM/PM",
  19: "h:mm:ss AM/PM",
  20: "h:mm",
  21: "h:mm:ss",
  22: "m/d/yyyy h:mm",
  37: "#,##0 ;(#,##0)",
  38: "#,##0 ;[Red](#,##0)",
  39: "#,##0.00;(#,##0.00)",
  40: "#,##0.00;[Red](#,##0.00)",
  41: '_(* #,##0_);_(* \\(#,##0\\);_(* "-"_);_(@_)',
  42: '_("$"* #,##0_);_("$"* \\(#,##0\\);_("$"* "-"_);_(@_)',
  43: '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)',
  44: '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)',
  45: "mm:ss",
  46: "[h]:mm:ss",
  47: "mm:ss.0",
  48: "##0.0E+0",
  49: "@",
};

/** Format code for a numFmtId: custom formats first, then built-ins. East Asian date ids fall back to ISO dates. */
export function formatCodeFor(id: number, custom: Map<number, string>): string {
  const code = custom.get(id) ?? BUILTIN_FORMATS[id];
  if (code !== undefined) return code;
  if ((id >= 27 && id <= 36) || (id >= 50 && id <= 58)) return "yyyy-mm-dd";
  return "General";
}

/** Split a format into its ;-separated sections, ignoring ; inside quotes, brackets or after a backslash. */
const sectionCache = new Map<string, string[]>();
function splitSections(code: string): string[] {
  let cached = sectionCache.get(code);
  if (!cached) {
    cached = splitSectionsUncached(code);
    if (sectionCache.size > 500) sectionCache.clear();
    sectionCache.set(code, cached);
  }
  return cached;
}

function splitSectionsUncached(code: string): string[] {
  const sections: string[] = [];
  let current = "";
  let inQuote = false;
  let inBracket = false;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === "\\" && !inQuote && i + 1 < code.length) {
      current += c + code[++i];
      continue;
    }
    if (c === '"' && !inBracket) inQuote = !inQuote;
    else if (c === "[" && !inQuote) inBracket = true;
    else if (c === "]" && !inQuote) inBracket = false;
    if (c === ";" && !inQuote && !inBracket) {
      sections.push(current);
      current = "";
    } else current += c;
  }
  sections.push(current);
  return sections;
}

/** The format with quoted text, escapes and [..] blocks removed, for classifying it. */
function stripLiterals(section: string): string {
  return section
    .replace(/"[^"]*"/g, "")
    .replace(/\\./g, "")
    .replace(/_./g, "")
    .replace(/\*./g, "")
    .replace(/\[(h+|m+|s+)\]/gi, "$1")
    .replace(/\[[^\]]*\]/g, "");
}

/** True when the format shows a date or time. */
export function isDateFormat(code: string): boolean {
  if (/^\[\$-F[48]00\]/i.test(code)) return true;
  const first = stripLiterals(splitSections(code)[0]);
  if (/general/i.test(first)) return false;
  return /[ymdhs]/i.test(first.replace(/E[+-]/gi, ""));
}

/** The date/time codes of a format in order, with "m" marked as minutes (M) when it follows hours or precedes seconds. */
function dateCodes(code: string): string[] {
  const s = stripLiterals(splitSections(code)[0]).toLowerCase().replace(/am\/pm|a\/p/g, " ");
  const codes = s.match(/[ymdhs]+/g) ?? [];
  return codes.map((c, i) => {
    if (c[0] !== "m" || c.length > 2) return c;
    const prev = codes[i - 1];
    const next = codes[i + 1];
    return (prev && prev[0] === "h") || (next && next[0] === "s") ? "M" : c;
  });
}

/** True when the format has a date part (not only a time). */
export function hasDatePart(code: string): boolean {
  if (/^\[\$-F800\]/i.test(code)) return true;
  return dateCodes(code).some((c) => c[0] === "y" || c[0] === "d" || c[0] === "m");
}

/** True when the format has a time part. */
export function hasTimePart(code: string): boolean {
  if (/^\[\$-F400\]/i.test(code)) return true;
  return dateCodes(code).some((c) => c[0] === "h" || c[0] === "s" || c === "M") || /am\/pm|a\/p/i.test(code);
}

/** True for elapsed-time formats such as [h]:mm, whose value is a duration rather than a date. */
export function isElapsedFormat(code: string): boolean {
  return /\[(h+|m+|s+)\]/i.test(splitSections(code)[0]);
}

// ---- General ----

/** Excel's General format for a number: up to 11 significant characters on screen; we use 15 significant digits as Excel does when saving CSV. */
export function formatGeneral(value: number): string {
  if (!Number.isFinite(value)) return "#NUM!";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-9) {
    const [mantissa, exp] = value.toExponential(14).split("e");
    const m = mantissa.replace(/\.?0+$/, "");
    const e = parseInt(exp, 10);
    return `${m}E${e < 0 ? "-" : "+"}${String(Math.abs(e)).padStart(2, "0")}`;
  }
  const precise = parseFloat(value.toPrecision(15));
  let text = String(precise);
  if (/e/i.test(text)) text = precise.toFixed(20).replace(/\.?0+$/, "");
  return text;
}

// ---- Dates ----

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface DateParts {
  year: number;
  month: number; // 1–12
  day: number;
  weekday: number; // 0 = Sunday
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  /** Whole days plus time, for elapsed formats like [h]:mm. */
  serial: number;
}

/** Convert an Excel date serial to calendar parts (1900 system with its Feb 29, 1900 bug, or the 1904 system). */
export function serialToDate(serial: number, date1904 = false): DateParts | null {
  if (!Number.isFinite(serial) || serial < 0 || serial > 2958466) return null;
  let days = Math.floor(serial);
  const ms = Math.round((serial - days) * 86400000);
  let totalMs = ms;
  if (totalMs >= 86400000) {
    days += 1;
    totalMs -= 86400000;
  }
  let utc: number;
  if (date1904) utc = Date.UTC(1904, 0, 1) + days * 86400000;
  else if (days === 60) {
    // Excel's fictional 29 February 1900.
    return { year: 1900, month: 2, day: 29, weekday: 3, ...timeParts(totalMs), serial };
  } else utc = Date.UTC(1899, 11, 31) + (days > 60 ? days - 1 : days) * 86400000;
  const d = new Date(utc);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), weekday: d.getUTCDay(), ...timeParts(totalMs), serial };
}

function timeParts(ms: number) {
  return {
    hours: Math.floor(ms / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
    milliseconds: ms % 1000,
  };
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** ISO 8601 text for a date serial: 2026-10-29, 2026-10-29 14:05:00, or 14:05:00 for a time only. */
export function serialToISO(serial: number, code: string, date1904 = false): string {
  // Round to whole seconds, as Excel does on screen when no fractions are shown.
  const parts = serialToDate(Math.round(serial * 86400) / 86400, date1904);
  if (!parts) return formatGeneral(serial);
  const date = `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`;
  const time = `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
  const showDate = hasDatePart(code) || serial >= 1;
  const showTime = hasTimePart(code) || (serial % 1 !== 0 && !hasDatePart(code));
  if (showDate && showTime) return `${date} ${time}`;
  return showDate ? date : time;
}

type DateToken = { kind: "lit"; text: string } | { kind: "code"; code: string };

function tokenizeDate(section: string): DateToken[] {
  const tokens: DateToken[] = [];
  let i = 0;
  while (i < section.length) {
    const c = section[i];
    if (c === '"') {
      const end = section.indexOf('"', i + 1);
      tokens.push({ kind: "lit", text: section.slice(i + 1, end < 0 ? undefined : end) });
      i = end < 0 ? section.length : end + 1;
    } else if (c === "\\") {
      tokens.push({ kind: "lit", text: section[i + 1] ?? "" });
      i += 2;
    } else if (c === "_") {
      tokens.push({ kind: "lit", text: " " });
      i += 2;
    } else if (c === "*") {
      i += 2;
    } else if (c === "[") {
      const end = section.indexOf("]", i);
      const inner = section.slice(i + 1, end < 0 ? undefined : end);
      if (/^(h+|m+|s+)$/i.test(inner)) tokens.push({ kind: "code", code: `[${inner.toLowerCase()}]` });
      i = end < 0 ? section.length : end + 1;
    } else if (/^(AM\/PM|A\/P)/i.test(section.slice(i))) {
      const m = /^(AM\/PM|A\/P)/i.exec(section.slice(i))![0];
      tokens.push({ kind: "code", code: m.toUpperCase() });
      i += m.length;
    } else if (/[yYmMdDhHsS]/.test(c)) {
      let j = i;
      while (j < section.length && section[j].toLowerCase() === c.toLowerCase()) j++;
      tokens.push({ kind: "code", code: section.slice(i, j).toLowerCase() });
      i = j;
    } else if (c === "." && /^\.0+/.test(section.slice(i))) {
      const m = /^\.0+/.exec(section.slice(i))![0];
      tokens.push({ kind: "code", code: m });
      i += m.length;
    } else if (c === "e" || c === "E" || c === "g" || c === "G" || c === "B") {
      // Era and calendar codes (rare): treat e as the year.
      tokens.push(c === "e" || c === "E" ? { kind: "code", code: "yyyy" } : { kind: "lit", text: "" });
      i++;
    } else {
      tokens.push({ kind: "lit", text: c });
      i++;
    }
  }
  // "m" next to hours or seconds means minutes.
  const codes = tokens.map((t, idx) => ({ t, idx })).filter((x) => x.t.kind === "code");
  for (let k = 0; k < codes.length; k++) {
    const t = codes[k].t as { kind: "code"; code: string };
    if (!/^m{1,2}$/.test(t.code)) continue;
    const prev = codes[k - 1]?.t as { code: string } | undefined;
    const next = codes[k + 1]?.t as { code: string } | undefined;
    if ((prev && /^(h+|\[h+\])$/.test(prev.code)) || (next && /^(s+|\[s+\])$/.test(next.code))) t.code = t.code === "m" ? "M" : "MM";
  }
  return tokens;
}

function formatDateSection(serial: number, section: string, date1904: boolean): string {
  const tokens = tokenizeDate(section);
  const fraction = tokens.find((t) => t.kind === "code" && t.code.startsWith("."));
  const decimals = fraction && fraction.kind === "code" ? fraction.code.length - 1 : 0;
  const unit = 86400 * 10 ** decimals;
  const parts = serialToDate(Math.round(serial * unit) / unit, date1904);
  if (!parts) return formatGeneral(serial);
  const ampm = tokens.some((t) => t.kind === "code" && (t.code === "AM/PM" || t.code === "A/P"));
  const hours12 = parts.hours % 12 === 0 ? 12 : parts.hours % 12;
  let out = "";
  for (const t of tokens) {
    if (t.kind === "lit") {
      out += t.text;
      continue;
    }
    const c = t.code;
    switch (c) {
      case "yy": out += pad(parts.year % 100); break;
      case "y": out += pad(parts.year % 100); break;
      case "m": out += parts.month; break;
      case "mm": out += pad(parts.month); break;
      case "mmm": out += MONTHS[parts.month - 1].slice(0, 3); break;
      case "mmmm": out += MONTHS[parts.month - 1]; break;
      case "mmmmm": out += MONTHS[parts.month - 1][0]; break;
      case "d": out += parts.day; break;
      case "dd": out += pad(parts.day); break;
      case "ddd": out += DAYS[parts.weekday].slice(0, 3); break;
      case "h": out += ampm ? hours12 : parts.hours; break;
      case "hh": out += pad(ampm ? hours12 : parts.hours); break;
      case "M": out += parts.minutes; break;
      case "MM": out += pad(parts.minutes); break;
      case "s": out += parts.seconds; break;
      case "ss": out += pad(parts.seconds); break;
      case "AM/PM": out += parts.hours < 12 ? "AM" : "PM"; break;
      case "A/P": out += parts.hours < 12 ? "A" : "P"; break;
      default:
        if (/^y{3,}$/.test(c)) out += pad(parts.year, 4);
        else if (/^d{4,}$/.test(c)) out += DAYS[parts.weekday];
        else if (/^m{6,}$/.test(c)) out += MONTHS[parts.month - 1];
        else if (/^h{3,}$/.test(c)) out += pad(ampm ? hours12 : parts.hours);
        else if (/^s{3,}$/.test(c)) out += pad(parts.seconds);
        else if (/^\[h+\]$/.test(c)) out += pad(Math.floor(serial * 24 + 1e-9), c.length - 2);
        else if (/^\[m+\]$/.test(c)) out += pad(Math.floor(serial * 1440 + 1e-9), c.length - 2);
        else if (/^\[s+\]$/.test(c)) out += pad(Math.round(serial * 86400), c.length - 2);
        else if (c.startsWith(".")) out += "." + pad(parts.milliseconds, 3).slice(0, decimals);
    }
  }
  return out;
}

// ---- Numbers ----

function formatNumberSection(value: number, section: string): string {
  // Collect literal prefix/suffix and the numeric pattern, keeping literals that sit between digit placeholders.
  type Tok = { kind: "lit"; text: string } | { kind: "ph"; c: string };
  const toks: Tok[] = [];
  for (let i = 0; i < section.length; i++) {
    const c = section[i];
    if (c === '"') {
      const end = section.indexOf('"', i + 1);
      toks.push({ kind: "lit", text: section.slice(i + 1, end < 0 ? undefined : end) });
      i = end < 0 ? section.length : end;
    } else if (c === "\\") toks.push({ kind: "lit", text: section[++i] ?? "" });
    else if (c === "_") {
      toks.push({ kind: "lit", text: " " });
      i++;
    } else if (c === "*") i++;
    else if (c === "[") {
      const end = section.indexOf("]", i);
      const inner = section.slice(i + 1, end < 0 ? undefined : end);
      const currency = /^\$([^-\]]*)/.exec(inner);
      if (currency && currency[1]) toks.push({ kind: "lit", text: currency[1] });
      i = end < 0 ? section.length : end;
    } else if ("0#?.,%".includes(c)) toks.push({ kind: "ph", c });
    else if ((c === "E" || c === "e") && /^[Ee][+-]/.test(section.slice(i))) {
      toks.push({ kind: "ph", c: "E" + section[i + 1] });
      i++;
    } else if (c === "@") toks.push({ kind: "lit", text: "" });
    else toks.push({ kind: "lit", text: c });
  }

  let percent = 0;
  for (const t of toks) if (t.kind === "ph" && t.c === "%") percent++;
  let v = value * 100 ** percent;

  // Trailing commas after the last digit placeholder scale by 1,000 each.
  const digitIdx = toks.map((t, i) => (t.kind === "ph" && "0#?".includes(t.c) ? i : -1)).filter((i) => i >= 0);
  if (digitIdx.length === 0) {
    return toks.map((t) => (t.kind === "lit" ? t.text : t.c === "%" ? "%" : "")).join("");
  }
  const lastDigit = digitIdx[digitIdx.length - 1];
  for (let i = lastDigit + 1; i < toks.length; i++) {
    const t = toks[i];
    if (t.kind === "ph" && t.c === ",") {
      v /= 1000;
      toks[i] = { kind: "lit", text: "" };
    } else if (!(t.kind === "lit" && t.text === "")) break;
  }

  const expIdx = toks.findIndex((t) => t.kind === "ph" && t.c.startsWith("E"));
  const dotIdx = toks.findIndex((t, i) => t.kind === "ph" && t.c === "." && (expIdx < 0 || i < expIdx));
  const endOfMantissa = expIdx < 0 ? toks.length : expIdx;
  const intToks = toks.slice(0, dotIdx < 0 ? endOfMantissa : dotIdx);
  const fracToks = dotIdx < 0 ? [] : toks.slice(dotIdx + 1, endOfMantissa);
  const expToks = expIdx < 0 ? [] : toks.slice(expIdx + 1);
  const grouping = intToks.some((t) => t.kind === "ph" && t.c === ",");
  const fracPlaces = fracToks.filter((t) => t.kind === "ph" && "0#?".includes(t.c)).length;

  let exponent = 0;
  if (expIdx >= 0) {
    const intDigits = Math.max(1, intToks.filter((t) => t.kind === "ph" && "0#?".includes(t.c)).length);
    if (v !== 0) {
      exponent = Math.floor(Math.log10(Math.abs(v)));
      // Engineering-style formats (##0.0E+0) keep the exponent a multiple of the integer width.
      if (intDigits > 1) exponent = Math.floor(exponent / intDigits) * intDigits;
      v = v / 10 ** exponent;
    }
  }

  const fixed = Math.abs(v).toFixed(fracPlaces);
  let [intDigitsStr, fracDigitsStr = ""] = fixed.split(".");
  if (expIdx >= 0 && intDigitsStr.length > 1 && parseFloat(fixed) >= 10 && intToks.filter((t) => t.kind === "ph" && "0#?".includes(t.c)).length <= 1) {
    // Rounding pushed the mantissa to 10.0: renormalise.
    exponent += 1;
    [intDigitsStr, fracDigitsStr = ""] = (Math.abs(v) / 10).toFixed(fracPlaces).split(".");
  }

  // Integer part: fill placeholders from the right; extra digits go before the leftmost placeholder.
  const intPh = intToks.filter((t) => t.kind === "ph" && "0#?".includes(t.c)).length;
  const digits = intDigitsStr === "0" ? "" : intDigitsStr;
  const out: string[] = [];
  let di = digits.length - 1;
  let phSeen = 0;
  for (let i = intToks.length - 1; i >= 0; i--) {
    const t = intToks[i];
    if (t.kind === "lit") {
      out.push(t.text);
      continue;
    }
    if (t.c === "," || t.c === "%") {
      if (t.c === "%") out.push("%");
      continue;
    }
    phSeen++;
    if (di >= 0) {
      if (phSeen === intPh) {
        out.push(digits.slice(0, di + 1));
        di = -1;
      } else out.push(digits[di--]);
    } else if (t.c === "0") out.push("0");
    else if (t.c === "?") out.push(" ");
  }
  let intText = out.reverse().join("");
  if (grouping) {
    // Re-insert thousands separators into the run of digits.
    intText = intText.replace(/\d{4,}/, (run) => run.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  }

  // Fraction part: trim optional (#) trailing zeros.
  let fracText = "";
  let fi = 0;
  const required = fracToks.filter((t) => t.kind === "ph" && t.c === "0").length;
  let trimmed = fracDigitsStr;
  while (trimmed.length > required && trimmed.endsWith("0")) trimmed = trimmed.slice(0, -1);
  for (const t of fracToks) {
    if (t.kind === "lit") fracText += t.text;
    else if (t.c === "%") fracText += "%";
    else if ("0#?".includes(t.c)) {
      if (fi < trimmed.length) fracText += trimmed[fi];
      else if (t.c === "?") fracText += " ";
      fi++;
    }
  }
  let text = intText;
  if (dotIdx >= 0) text += "." + fracText;
  else text += fracText;

  if (expIdx >= 0) {
    const sign = (toks[expIdx] as { c: string }).c[1];
    const expDigits = expToks.filter((t) => t.kind === "ph" && t.c === "0").length || 1;
    const expSign = exponent < 0 ? "-" : sign === "+" ? "+" : "";
    text += "E" + expSign + String(Math.abs(exponent)).padStart(expDigits, "0");
    text += expToks.filter((t) => t.kind === "lit").map((t) => (t as { text: string }).text).join("");
  }
  return text;
}

/**
 * The text Excel shows for a number in the given format.
 * `date1904` selects the workbook's date system.
 */
export function formatNumber(value: number, code: string, date1904 = false): string {
  if (!code || /^general$/i.test(code.trim())) return formatGeneral(value);
  if (/^\[\$-F800\]/i.test(code)) return formatDateSection(value, "dddd, mmmm d, yyyy", date1904);
  if (/^\[\$-F400\]/i.test(code)) return formatDateSection(value, "h:mm:ss AM/PM", date1904);
  const sections = splitSections(code);
  let section = sections[0];
  let negativeSign = false;
  // Conditions such as [<1000] pick a section; otherwise positive;negative;zero;text.
  const condition = (s: string) => /^\[(<=|>=|<>|<|>|=)(-?[\d.]+)\]/.exec(stripColor(s));
  if (condition(sections[0])) {
    const pick = sections.find((s, i) => {
      const m = condition(s);
      if (!m) return i < 2;
      const n = parseFloat(m[2]);
      return m[1] === "<" ? value < n : m[1] === ">" ? value > n : m[1] === "=" ? value === n : m[1] === "<=" ? value <= n : m[1] === ">=" ? value >= n : value !== n;
    });
    section = pick ?? sections[sections.length - 1];
    if (value < 0 && !/[-(]/.test(stripLiterals(section))) negativeSign = true;
  } else if (value < 0 && sections.length >= 2 && sections[1].trim() !== "") section = sections[1];
  else if (value === 0 && sections.length >= 3) section = sections[2];
  else if (value < 0) negativeSign = true;
  const bare = stripLiterals(section);
  if (/general/i.test(bare)) return (negativeSign ? "-" : "") + section.replace(/General/i, formatGeneral(Math.abs(value)));
  if (isDateFormat(section)) return formatDateSection(value, section, date1904);
  if (/[?]\/[?\d]/.test(bare)) return formatGeneral(value);
  if (!/[0#?]/.test(bare) && bare.includes("@")) return formatGeneral(value);
  const useAbs = value < 0 && (sections.length >= 2 || negativeSign);
  // Padding (_x and ?) only aligns columns on screen; trim it from the value.
  const text = formatNumberSection(useAbs ? Math.abs(value) : value, section).trim();
  return negativeSign && /[1-9]/.test(text) ? "-" + text : text;
}

function stripColor(section: string): string {
  return section.replace(/^\[(Black|Blue|Cyan|Green|Magenta|Red|White|Yellow|Color\s*\d+)\]/i, "");
}

/** Text in a text-section format, e.g. a format of "@" or a fourth section like _(@_). */
export function formatText(text: string, code: string): string {
  const sections = splitSections(code);
  const section = sections.length >= 4 ? sections[3] : sections.find((s) => s.includes("@"));
  if (!section) return text;
  let out = "";
  for (let i = 0; i < section.length; i++) {
    const c = section[i];
    if (c === "@") out += text;
    else if (c === '"') {
      const end = section.indexOf('"', i + 1);
      out += section.slice(i + 1, end < 0 ? undefined : end);
      i = end < 0 ? section.length : end;
    } else if (c === "\\") out += section[++i] ?? "";
    else if (c === "_") {
      out += " ";
      i++;
    } else if (c === "*") i++;
    else if (c === "[") {
      const end = section.indexOf("]", i);
      i = end < 0 ? section.length : end;
    } else out += c;
  }
  return out;
}
