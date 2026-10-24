/**
 * Read and write vCard (.vcf) contact files.
 *
 * Reading handles vCard 2.1, 3.0 and 4.0 as phones and apps export them: folded
 * lines, property groups (item1.TEL) with Apple's custom labels, quoted-printable
 * values with a charset (old Android exports of non-English names), escaped
 * commas/semicolons and embedded photos (skipped).
 *
 * Writing produces vCard 3.0, which Android, iPhone, Google Contacts and Outlook
 * all import: CRLF line endings, escaped text and lines folded at 75 octets.
 */

export interface ContactValue {
  value: string;
  /** A readable label such as "Mobile", "Work" or a custom label; "" when none. */
  type: string;
}

export interface ContactAddress {
  type: string;
  poBox: string;
  extended: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface Contact {
  fullName: string;
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  nickname: string;
  organization: string;
  title: string;
  phones: ContactValue[];
  emails: ContactValue[];
  addresses: ContactAddress[];
  urls: string[];
  birthday: string;
  note: string;
}

export function emptyContact(): Contact {
  return {
    fullName: "",
    prefix: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    nickname: "",
    organization: "",
    title: "",
    phones: [],
    emails: [],
    addresses: [],
    urls: [],
    birthday: "",
    note: "",
  };
}

/* ------------------------------------------------------------------ reading */

interface RawProperty {
  group: string;
  name: string;
  params: Map<string, string[]>;
  /** Bare parameters without "=" (vCard 2.1 style, e.g. TEL;CELL;PREF). */
  bare: string[];
  value: string;
}

const TYPE_LABELS: Record<string, string> = {
  cell: "Mobile",
  mobile: "Mobile",
  iphone: "iPhone",
  home: "Home",
  work: "Work",
  fax: "Fax",
  main: "Main",
  pager: "Pager",
  other: "Other",
  car: "Car",
  video: "Video",
  text: "Text",
  "x-mobile": "Mobile",
};
/** Type words that say nothing a person needs to see. */
const IGNORED_TYPES = new Set(["voice", "pref", "internet", "x400", "dom", "intl", "postal", "parcel", "msg"]);

/** "_$!<Mobile>!$_" (Apple) → "Mobile"; other labels unchanged. */
function cleanLabel(label: string): string {
  const m = label.match(/^_\$!<(.+)>!\$_$/);
  return (m ? m[1] : label).trim();
}

function typeLabel(prop: RawProperty, labels: Map<string, string>): string {
  if (prop.group && labels.has(prop.group)) return labels.get(prop.group)!;
  const words = [...(prop.params.get("TYPE") ?? []), ...prop.bare]
    .flatMap((t) => t.split(","))
    .map((t) => t.trim().toLowerCase().replace(/^"|"$/g, ""))
    .filter((t) => t && !IGNORED_TYPES.has(t));
  const known = words.map((w) => TYPE_LABELS[w]).filter(Boolean);
  if (known.length > 0) return known.filter((k, i) => known.indexOf(k) === i).join(", ");
  return words.length > 0 ? words[0].replace(/^x-/, "").replace(/^\w/, (c) => c.toUpperCase()) : "";
}

/** Join folded lines, and quoted-printable soft line breaks, into logical lines. */
function logicalLines(text: string): string[] {
  const physical = text.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  const out: string[] = [];
  for (const line of physical) {
    const last = out.length - 1;
    if (last >= 0 && (line.startsWith(" ") || line.startsWith("\t"))) {
      out[last] += line.slice(1);
    } else if (last >= 0 && /QUOTED-PRINTABLE/i.test(out[last].split(":")[0]) && out[last].endsWith("=")) {
      out[last] = out[last].slice(0, -1) + line;
    } else {
      out.push(line);
    }
  }
  return out;
}

/** Index of the ":" that ends the name and parameters (quoted parameter values may contain ":"). */
function valueStart(line: string): number {
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') quoted = !quoted;
    else if (ch === ":" && !quoted) return i;
  }
  return -1;
}

function parseProperty(line: string): RawProperty | null {
  const colon = valueStart(line);
  if (colon <= 0) return null;
  const head = line.slice(0, colon).split(";");
  const fullName = head[0];
  const dot = fullName.lastIndexOf(".");
  const params = new Map<string, string[]>();
  const bare: string[] = [];
  for (const p of head.slice(1)) {
    const eq = p.indexOf("=");
    if (eq < 0) {
      bare.push(p);
      continue;
    }
    const key = p.slice(0, eq).toUpperCase();
    params.set(key, [...(params.get(key) ?? []), p.slice(eq + 1)]);
  }
  return {
    group: dot >= 0 ? fullName.slice(0, dot).toLowerCase() : "",
    name: (dot >= 0 ? fullName.slice(dot + 1) : fullName).toUpperCase(),
    params,
    bare,
    value: line.slice(colon + 1),
  };
}

function decodeQuotedPrintable(value: string, charset: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === "=" && /^[0-9A-Fa-f]{2}$/.test(value.slice(i + 1, i + 3))) {
      bytes.push(parseInt(value.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(ch.charCodeAt(0) & 0xff);
    }
  }
  try {
    return new TextDecoder(charset || "utf-8", { fatal: false }).decode(new Uint8Array(bytes));
  } catch {
    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  }
}

/** Split a structured value on unescaped ";" and unescape each part. */
function splitStructured(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === "\\" && i + 1 < value.length) {
      current += ch + value[i + 1];
      i++;
    } else if (ch === ";") {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map(unescapeText);
}

function unescapeText(value: string): string {
  return value.replace(/\\([nN,;:\\])/g, (_, c: string) => (c === "n" || c === "N" ? "\n" : c));
}

function propertyValue(prop: RawProperty): string {
  const encoding = [...(prop.params.get("ENCODING") ?? []), ...prop.bare].map((e) => e.toUpperCase());
  if (encoding.includes("QUOTED-PRINTABLE")) {
    return decodeQuotedPrintable(prop.value, (prop.params.get("CHARSET") ?? [])[0] ?? "utf-8");
  }
  return prop.value;
}

function isEmptyContact(c: Contact): boolean {
  return (
    !c.fullName &&
    !c.firstName &&
    !c.lastName &&
    !c.organization &&
    c.phones.length === 0 &&
    c.emails.length === 0
  );
}

export interface ParseVCFResult {
  contacts: Contact[];
  /** Cards that held no name, phone, email or company and were left out. */
  skippedEmpty: number;
  /** True when the text contains no BEGIN:VCARD at all. */
  notVCard: boolean;
}

export function parseVCF(text: string): ParseVCFResult {
  const lines = logicalLines(text);
  const contacts: Contact[] = [];
  let skippedEmpty = 0;
  let sawCard = false;
  let props: RawProperty[] | null = null;

  const finish = (list: RawProperty[]) => {
    // Apple stores custom labels as a separate property in the same group.
    const labels = new Map<string, string>();
    for (const p of list) if (p.name === "X-ABLABEL" && p.group) labels.set(p.group, cleanLabel(propertyValue(p)));

    const c = emptyContact();
    for (const p of list) {
      const raw = propertyValue(p);
      switch (p.name) {
        case "FN":
          c.fullName = unescapeText(raw).trim();
          break;
        case "N": {
          const [last = "", first = "", middle = "", prefix = "", suffix = ""] = splitStructured(raw);
          Object.assign(c, { lastName: last.trim(), firstName: first.trim(), middleName: middle.trim(), prefix: prefix.trim(), suffix: suffix.trim() });
          break;
        }
        case "NICKNAME":
          c.nickname = unescapeText(raw).trim();
          break;
        case "ORG":
          c.organization = splitStructured(raw).filter(Boolean).join(", ").trim();
          break;
        case "TITLE":
          c.title = unescapeText(raw).trim();
          break;
        case "TEL": {
          const value = unescapeText(raw).replace(/^tel:/i, "").trim();
          if (value) c.phones.push({ value, type: typeLabel(p, labels) });
          break;
        }
        case "EMAIL": {
          const value = unescapeText(raw).trim();
          if (value) c.emails.push({ value, type: typeLabel(p, labels) });
          break;
        }
        case "ADR": {
          const [poBox = "", extended = "", street = "", city = "", region = "", postalCode = "", country = ""] = splitStructured(raw);
          if ([poBox, extended, street, city, region, postalCode, country].some((v) => v.trim())) {
            c.addresses.push({ type: typeLabel(p, labels), poBox, extended, street, city, region, postalCode, country });
          }
          break;
        }
        case "URL": {
          const value = unescapeText(raw).trim();
          if (value) c.urls.push(value);
          break;
        }
        case "BDAY":
          c.birthday = raw.trim();
          break;
        case "NOTE":
          c.note = unescapeText(raw).trim();
          break;
      }
    }
    if (!c.fullName) c.fullName = [c.prefix, c.firstName, c.middleName, c.lastName, c.suffix].filter(Boolean).join(" ");
    if (isEmptyContact(c)) skippedEmpty++;
    else contacts.push(c);
  };

  for (const line of lines) {
    if (/^BEGIN:VCARD$/i.test(line.trim())) {
      sawCard = true;
      props = [];
      continue;
    }
    if (/^END:VCARD$/i.test(line.trim())) {
      if (props) finish(props);
      props = null;
      continue;
    }
    if (!props || !line.trim()) continue;
    const prop = parseProperty(line);
    if (prop) props.push(prop);
  }
  // A last card without END:VCARD (a truncated file) is still read.
  if (props && props.length > 0) finish(props);
  return { contacts, skippedEmpty, notVCard: !sawCard };
}

/** One-line address for a table cell: "Street, City Region PostalCode, Country". */
export function formatAddress(a: ContactAddress): string {
  const locality = [a.city, a.region, a.postalCode].filter((v) => v.trim()).join(" ");
  return [a.poBox, a.extended, a.street, locality, a.country]
    .map((v) => v.replace(/\s*\n\s*/g, ", ").trim())
    .filter(Boolean)
    .join(", ");
}

/** Contacts as a table: fixed name columns, then as many phone/email/address columns as the file needs. */
export function contactsToTable(contacts: Contact[]): { headers: string[]; rows: string[][] } {
  const max = (pick: (c: Contact) => number) => contacts.reduce((m, c) => Math.max(m, pick(c)), 0);
  const phones = Math.max(1, max((c) => c.phones.length));
  const emails = Math.max(1, max((c) => c.emails.length));
  const addresses = max((c) => c.addresses.length);
  const urls = max((c) => c.urls.length);
  const has = (pick: (c: Contact) => string) => contacts.some((c) => pick(c) !== "");

  type Column = { header: string; get: (c: Contact) => string };
  const columns: Column[] = [
    { header: "Full name", get: (c) => c.fullName },
    { header: "First name", get: (c) => c.firstName },
    ...(has((c) => c.middleName) ? [{ header: "Middle name", get: (c: Contact) => c.middleName }] : []),
    { header: "Last name", get: (c) => c.lastName },
    ...(has((c) => c.prefix) ? [{ header: "Prefix", get: (c: Contact) => c.prefix }] : []),
    ...(has((c) => c.suffix) ? [{ header: "Suffix", get: (c: Contact) => c.suffix }] : []),
    ...(has((c) => c.nickname) ? [{ header: "Nickname", get: (c: Contact) => c.nickname }] : []),
  ];
  for (let i = 0; i < phones; i++) {
    columns.push({ header: `Phone ${i + 1}`, get: (c) => c.phones[i]?.value ?? "" });
    columns.push({ header: `Phone ${i + 1} type`, get: (c) => c.phones[i]?.type ?? "" });
  }
  for (let i = 0; i < emails; i++) {
    columns.push({ header: `Email ${i + 1}`, get: (c) => c.emails[i]?.value ?? "" });
    columns.push({ header: `Email ${i + 1} type`, get: (c) => c.emails[i]?.type ?? "" });
  }
  if (has((c) => c.organization)) columns.push({ header: "Organization", get: (c) => c.organization });
  if (has((c) => c.title)) columns.push({ header: "Job title", get: (c) => c.title });
  for (let i = 0; i < addresses; i++) {
    columns.push({ header: `Address ${i + 1}`, get: (c) => (c.addresses[i] ? formatAddress(c.addresses[i]) : "") });
    columns.push({ header: `Address ${i + 1} type`, get: (c) => c.addresses[i]?.type ?? "" });
  }
  for (let i = 0; i < urls; i++) columns.push({ header: `Website ${i + 1}`, get: (c) => c.urls[i] ?? "" });
  if (has((c) => c.birthday)) columns.push({ header: "Birthday", get: (c) => c.birthday });
  if (has((c) => c.note)) columns.push({ header: "Note", get: (c) => c.note });

  return { headers: columns.map((col) => col.header), rows: contacts.map((c) => columns.map((col) => col.get(c))) };
}

/* ------------------------------------------------------------------ writing */

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\n|\r/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

const encoder = new TextEncoder();

/** Fold a content line at 75 octets without splitting a UTF-8 character (RFC 6350 §3.2). */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
      limit = 74; // continuation lines start with one space
    }
    current += ch;
    currentBytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const WRITE_TYPES: Record<string, string> = {
  mobile: "CELL",
  cell: "CELL",
  home: "HOME",
  work: "WORK",
  fax: "FAX",
  main: "MAIN",
  other: "OTHER",
  iphone: "IPHONE",
};

/** One vCard 3.0 for a contact. Every card gets N and FN, which version 3.0 requires. */
export function contactToVCard(c: Contact): string {
  const name = c.fullName || [c.prefix, c.firstName, c.middleName, c.lastName, c.suffix].filter(Boolean).join(" ");
  const fn = name || c.organization || c.phones[0]?.value || c.emails[0]?.value || "Contact";
  const hasStructured = c.firstName || c.lastName || c.middleName || c.prefix || c.suffix;
  const nParts = hasStructured
    ? [c.lastName, c.firstName, c.middleName, c.prefix, c.suffix]
    : ["", fn, "", "", ""];
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${nParts.map(escapeText).join(";")}`, `FN:${escapeText(fn)}`];
  if (c.nickname) lines.push(`NICKNAME:${escapeText(c.nickname)}`);
  if (c.organization) lines.push(`ORG:${escapeText(c.organization)}`);
  if (c.title) lines.push(`TITLE:${escapeText(c.title)}`);
  for (const p of c.phones) {
    const type = WRITE_TYPES[p.type.toLowerCase()] ?? "CELL";
    lines.push(`TEL;TYPE=${type}:${escapeText(p.value)}`);
  }
  for (const e of c.emails) {
    const type = WRITE_TYPES[e.type.toLowerCase()];
    lines.push(`EMAIL;TYPE=INTERNET${type && type !== "CELL" ? `,${type}` : ""}:${escapeText(e.value)}`);
  }
  for (const a of c.addresses) {
    const type = WRITE_TYPES[a.type.toLowerCase()];
    const value = [a.poBox, a.extended, a.street, a.city, a.region, a.postalCode, a.country].map(escapeText).join(";");
    lines.push(`ADR${type ? `;TYPE=${type}` : ""}:${value}`);
  }
  for (const u of c.urls) lines.push(`URL:${escapeText(u)}`);
  if (c.birthday) lines.push(`BDAY:${c.birthday}`);
  if (c.note) lines.push(`NOTE:${escapeText(c.note)}`);
  lines.push("END:VCARD");
  return lines.map(foldLine).join("\r\n");
}

export function contactsToVCF(contacts: Contact[]): string {
  return contacts.map(contactToVCard).join("\r\n") + "\r\n";
}

/* ------------------------------------------------------------ phone numbers */

/** Excel turns long numbers into scientific notation (9.23001E+11), destroying digits. */
export function isScientificNotation(value: string): boolean {
  return /^\d(\.\d+)?E\+\d+$/i.test(value.trim());
}

/**
 * Add a country code to a phone number written in national form:
 * "0300 1234567" with "+92" → "+923001234567". Numbers that already start with
 * "+" are kept; "00" becomes "+". Values without enough digits are left unchanged.
 */
export function withCountryCode(value: string, countryCode: string): string {
  const trimmed = value.trim();
  const code = countryCode.trim().replace(/^00/, "+");
  if (!code || !/^\+?\d{1,4}$/.test(code)) return trimmed;
  const digits = trimmed.replace(/[\s\-().]/g, "");
  if (!/^\+?\d{6,}$/.test(digits)) return trimmed;
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  const plusCode = code.startsWith("+") ? code : `+${code}`;
  if (digits.startsWith(plusCode.slice(1)) && digits.length > 10) return `+${digits}`;
  return plusCode + digits.replace(/^0+/, "");
}

/* --------------------------------------------------------- column mapping */

export type ContactField =
  | "fullName"
  | "firstName"
  | "lastName"
  | "phone1"
  | "phone2"
  | "phone3"
  | "email1"
  | "email2"
  | "organization"
  | "title"
  | "address"
  | "birthday"
  | "note";

export type ColumnMapping = Record<ContactField, number | null>;

const HEADER_HINTS: { field: ContactField | "phone" | "email"; words: string[]; contains?: boolean }[] = [
  { field: "firstName", words: ["firstname", "givenname", "first", "fname", "forename"] },
  { field: "lastName", words: ["lastname", "surname", "familyname", "last", "lname"] },
  { field: "fullName", words: ["name", "fullname", "contactname", "displayname", "contact", "naam", "customer", "customername", "clientname"] },
  { field: "organization", words: ["company", "organization", "organisation", "org", "business", "companyname", "firm"] },
  { field: "title", words: ["title", "jobtitle", "designation", "position", "role"] },
  { field: "address", words: ["address", "street", "streetaddress", "location"] },
  { field: "birthday", words: ["birthday", "dob", "dateofbirth", "birthdate"] },
  { field: "note", words: ["note", "notes", "remarks", "remark", "comment", "comments"] },
  { field: "email", words: ["email", "mail", "emailaddress"], contains: true },
  { field: "phone", words: ["phone", "mobile", "cell", "tel", "telephone", "number", "whatsapp", "contactno", "contactnumber", "mob", "phoneno", "mobileno"], contains: true },
];

const PHONE_LIKE = /^[+(]?\d[\d\s\-().]{5,}$/;
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Guess which column holds which contact field, from header names and then from the values. */
export function guessMapping(headers: string[], rows: string[][]): ColumnMapping {
  const mapping: ColumnMapping = {
    fullName: null,
    firstName: null,
    lastName: null,
    phone1: null,
    phone2: null,
    phone3: null,
    email1: null,
    email2: null,
    organization: null,
    title: null,
    address: null,
    birthday: null,
    note: null,
  };
  const used = new Set<number>();
  const norm = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const phones: number[] = [];
  const emails: number[] = [];

  norm.forEach((h, i) => {
    for (const hint of HEADER_HINTS) {
      const match = hint.words.includes(h) || (hint.contains && hint.words.some((w) => w.length > 3 && h.includes(w)));
      if (!match) continue;
      if (hint.field === "phone") phones.push(i);
      else if (hint.field === "email") emails.push(i);
      else if (mapping[hint.field] === null) mapping[hint.field] = i;
      else continue;
      used.add(i);
      break;
    }
  });

  // Fall back to the values when headers say nothing (or there is no header row).
  const sample = rows.slice(0, 200);
  const share = (col: number, re: RegExp) => {
    const values = sample.map((r) => (r[col] ?? "").trim()).filter(Boolean);
    return values.length === 0 ? 0 : values.filter((v) => re.test(v) || isScientificNotation(v)).length / values.length;
  };
  headers.forEach((_, i) => {
    if (used.has(i)) return;
    if (share(i, EMAIL_LIKE) >= 0.6) {
      emails.push(i);
      used.add(i);
    } else if (share(i, PHONE_LIKE) >= 0.6) {
      phones.push(i);
      used.add(i);
    }
  });
  if (mapping.fullName === null && mapping.firstName === null && mapping.lastName === null) {
    const nameCol = headers.findIndex((_, i) => !used.has(i) && share(i, /[A-Za-z\u00C0-\uFFFF]/) >= 0.6);
    if (nameCol >= 0) {
      mapping.fullName = nameCol;
      used.add(nameCol);
    }
  }

  [mapping.phone1, mapping.phone2, mapping.phone3] = [phones[0] ?? null, phones[1] ?? null, phones[2] ?? null];
  [mapping.email1, mapping.email2] = [emails[0] ?? null, emails[1] ?? null];
  return mapping;
}

export interface RowsToContactsResult {
  contacts: Contact[];
  /** Data rows with no name, phone, email or company. */
  skippedEmpty: number;
  /** Phone values Excel had already turned into scientific notation (digits lost). */
  damagedPhones: number;
}

/** Turn CSV data rows into contacts using a column mapping. */
export function rowsToContacts(
  rows: string[][],
  mapping: ColumnMapping,
  options: { countryCode: string }
): RowsToContactsResult {
  const contacts: Contact[] = [];
  let skippedEmpty = 0;
  let damagedPhones = 0;
  const cell = (row: string[], col: number | null) => (col === null ? "" : (row[col] ?? "").trim());

  for (const row of rows) {
    const c = emptyContact();
    c.firstName = cell(row, mapping.firstName);
    c.lastName = cell(row, mapping.lastName);
    c.fullName = cell(row, mapping.fullName) || [c.firstName, c.lastName].filter(Boolean).join(" ");
    c.organization = cell(row, mapping.organization);
    c.title = cell(row, mapping.title);
    c.birthday = cell(row, mapping.birthday);
    c.note = cell(row, mapping.note);
    const address = cell(row, mapping.address);
    if (address) c.addresses.push({ type: "", poBox: "", extended: "", street: address, city: "", region: "", postalCode: "", country: "" });

    for (const col of [mapping.phone1, mapping.phone2, mapping.phone3]) {
      const raw = cell(row, col);
      if (!raw) continue;
      // One cell sometimes holds several numbers: "0300 1234567 / 042 35761234".
      for (const part of raw.split(/\s*[/,;|]\s*/).filter(Boolean)) {
        if (isScientificNotation(part)) damagedPhones++;
        const value = options.countryCode ? withCountryCode(part, options.countryCode) : part;
        if (!c.phones.some((p) => p.value === value)) c.phones.push({ value, type: "Mobile" });
      }
    }
    for (const col of [mapping.email1, mapping.email2]) {
      const raw = cell(row, col);
      if (raw && !c.emails.some((e) => e.value === raw)) c.emails.push({ value: raw, type: "" });
    }
    if (isEmptyContact(c)) skippedEmpty++;
    else contacts.push(c);
  }
  return { contacts, skippedEmpty, damagedPhones };
}
