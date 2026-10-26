import assert from "node:assert";
import { register } from "node:module";
import Papa from "papaparse";
import { join } from "node:path";

// The library modules import each other without file extensions, as Next.js
// expects. Node's built-in TypeScript support needs the ".ts" extension, so for
// this test run only, resolve extensionless relative imports to ".ts" files.
register(
  "data:text/javascript," +
    encodeURIComponent(`export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    if (err && err.code === "ERR_MODULE_NOT_FOUND" && /^\\.{1,2}\\//.test(specifier) && !/\\.[cm]?[jt]sx?$/.test(specifier)) {
      return next(specifier + ".ts", context);
    }
    throw err;
  }
}`)
);

const {
  detectDelimiter,
  analyzeCSV,
  convertCSVDelimiter,
  isFormulaRisk,
  neutralizeFormulaCells,
  withExcelBOM,
  resolveDelimiter,
} = await import("../src/lib/csv-utils.ts");
const { validateJSON, repairJSON, csvToJSON, jsonToCSV, inferExactType } = await import("../src/lib/json-utils.ts");
const { parseJSONDocument, formatJSON, MAX_JSON_DEPTH } = await import("../src/lib/json-ast.ts");
const { decodeTextBytes, readTextFile } = await import("../src/lib/file-text.ts");
const {
  applyAnalyticsConsent,
  canLoadAnalytics,
  canTrackAnalytics,
  CONSENT_STORAGE_KEY,
  persistConsentChoice,
  preferenceChoice,
  readConsentChoice,
} = await import("../src/lib/analytics-consent.ts");

console.log("🚀 Starting Tooltiva Comprehensive Functional Verification Suite...\n");

// --- TEST 1: CSV Delimiter Auto-Detection ---
console.log("Test 1: Delimiter Auto-Detection");
assert.strictEqual(detectDelimiter("id,name,role\n1,Alice,Dev\n2,Bob,QA"), ",");
assert.strictEqual(detectDelimiter("id;name;role\n1;Alice;Dev\n2;Bob;QA"), ";");
assert.strictEqual(detectDelimiter("id\tname\trole\n1\tAlice\tDev\n2\tBob\tQA"), "\t");
assert.strictEqual(detectDelimiter("id|name|role\n1|Alice|Dev\n2|Bob|QA"), "|");
console.log("  ✓ Auto-detection passed for comma, semicolon, tab, and pipe.\n");

// --- TEST 2: RFC 4180 Quoted String Preservation ---
console.log("Test 2: RFC 4180 Quoted String Delimiter Conversion");
const semicolonCSV = `id;name;address;notes\n1;"Doe, Jane";"123 Elm St, Suite 4";"Specialist, Senior"`;
const converted = convertCSVDelimiter(semicolonCSV, ";", "", {
  delimiter: ",",
  quoteChar: '"',
  quoteAllFields: false,
  escapeChar: '"',
});
assert(converted.output.includes('"Doe, Jane"'), "Preserves comma inside quotes");
assert(converted.output.includes('"123 Elm St, Suite 4"'), "Preserves address comma inside quotes");
assert.strictEqual(converted.rowCount, 2);
const customConverted = convertCSVDelimiter("id~value\n1~A", "custom", "~", {
  delimiter: "custom",
  customDelimiter: "^",
  quoteChar: '"',
  quoteAllFields: false,
  escapeChar: '"',
});
assert.strictEqual(customConverted.output, "id^value\r\n1^A", "Supports custom source and output delimiters");
console.log("  ✓ Semicolon to comma conversion preserves internal commas inside quoted fields.\n");

// --- TEST 3: CSV Analysis & Ragged Row Detection ---
console.log("Test 3: CSV Analysis & Inconsistent Column Detection");
const raggedCSV = `col1,col2,col3\na,b,c\nd,e\nf,g,h,i`;
const analysis = analyzeCSV(raggedCSV, ",");
// Phase 2: the preview counts data rows only (the header was previously counted as a row).
assert.strictEqual(analysis.rowCount, 3, "Row count excludes the header row");
assert.deepStrictEqual(analysis.headers, ["col1", "col2", "col3"]);
assert.deepStrictEqual(analysis.sampleRows[0], ["a", "b", "c"], "Header is not repeated as the first data row");
assert.strictEqual(analysis.hasRaggedRows, true);
assert(analysis.warnings.length > 0, "Warning generated for ragged row counts");
console.log("  ✓ Ragged rows flagged with clear warnings.\n");

// --- TEST 4: CSV to JSON Two-Way Conversion ---
console.log("Test 4: CSV ➔ JSON with Type Inference");
const csvData = `id,name,active,score\n1,John,true,98.5\n2,Mary,false,84`;
const jsonResult = csvToJSON(csvData, {
  format: "array-of-objects",
  parseTypes: true,
  indent: 2,
});
const parsedJSON = JSON.parse(jsonResult.jsonText);
assert.strictEqual(parsedJSON.length, 2);
assert.strictEqual(parsedJSON[0].id, 1, "ID inferred as integer");
assert.strictEqual(parsedJSON[0].active, true, "Active inferred as boolean");
assert.strictEqual(parsedJSON[0].score, 98.5, "Score inferred as float");
console.log("  ✓ CSV to JSON correctly infers types.\n");

// --- TEST 5: JSON to CSV Conversion ---
console.log("Test 5: JSON ➔ CSV Flattening");
const backToCSV = jsonToCSV(jsonResult.jsonText, {
  delimiter: ",",
  quotes: false,
});
assert(backToCSV.csvText.includes("id,name,active,score"), "Headers preserved");
assert(backToCSV.csvText.includes("1,John,true,98.5"), "Rows preserved");
console.log("  ✓ JSON to CSV accurately restores tabular data.\n");

// --- TEST 6: JSON Validation & Error Pinpointing ---
console.log("Test 6: JSON Validation & Error Pinpointing");
const validJSON = `{"key": "value", "list": [1, 2, 3]}`;
const validCheck = validateJSON(validJSON);
assert.strictEqual(validCheck.isValid, true);

const invalidJSON = `{\n  "key": "value",\n  "broken": unquotedVal\n}`;
const invalidCheck = validateJSON(invalidJSON);
assert.strictEqual(invalidCheck.isValid, false);
assert(invalidCheck.error !== undefined);
assert(invalidCheck.error.line !== undefined, "Line number extracted");
console.log(`  ✓ Invalid JSON caught: Line ${invalidCheck.error.line}, message: ${invalidCheck.error.message}\n`);

// --- TEST 7: JSON Auto-Repair with Explicit Audit Logging ---
console.log("Test 7: JSON Auto-Repair (Trailing commas, single quotes, unquoted keys, comments)");
const malformedInput = `{
  // User profile
  name: 'Alice',
  age: 28,
  skills: ['TypeScript', 'Node.js',],
}`;
const { repaired, logs } = repairJSON(malformedInput);
assert(logs.some((l) => l.rule === "comment-stripped"), "Comment stripped logged");
assert(logs.some((l) => l.rule === "unquoted-key"), "Unquoted key logged");
assert(logs.some((l) => l.rule === "single-to-double-quotes"), "Single quote conversion logged");
assert(logs.some((l) => l.rule === "trailing-comma"), "Trailing comma removal logged");

// Verify that repaired JSON is now 100% valid RFC 8259 JSON
const revalidation = validateJSON(repaired);
assert.strictEqual(revalidation.isValid, true, "Repaired JSON passes strict validation");
const recheckedObj = JSON.parse(repaired);
assert.strictEqual(recheckedObj.name, "Alice");
assert.strictEqual(recheckedObj.skills.length, 2);

// --- Additional edge cases requested for phase-one validation ---
console.log("Test 8: CSV edge cases and 5,000-row input");
assert.deepStrictEqual(csvToJSON("", { format: "array-of-objects", parseTypes: true, indent: 2 }).jsonText, "[]");
assert.strictEqual(convertCSVDelimiter("", "auto", "", {
  delimiter: ",", quoteChar: '"', quoteAllFields: false, escapeChar: '"',
}).output, "");
assert.strictEqual(validateJSON("").isValid, false);
const semicolonJSON = csvToJSON("id;name\n1;Alice", {
  format: "array-of-objects", parseTypes: false, indent: 0,
});
assert.deepStrictEqual(JSON.parse(semicolonJSON.jsonText), [{ id: "1", name: "Alice" }]);
const quotedMultiline = 'id;name;notes\r\n1;"Doe, Jane";"first line\nsecond line"';
const pipeOutput = convertCSVDelimiter(quotedMultiline, ";", "", {
  delimiter: "|", quoteChar: '"', quoteAllFields: false, escapeChar: '"',
});
const pipeParsed = Papa.parse(pipeOutput.output, { delimiter: "|" }).data;
assert.deepStrictEqual(pipeParsed, [["id", "name", "notes"], ["1", "Doe, Jane", "first line\nsecond line"]]);
const quotedJSON = csvToJSON('name,note\n"Doe, Jane","line one\nline two"', {
  format: "array-of-objects", parseTypes: false, indent: 2,
});
assert.deepStrictEqual(JSON.parse(quotedJSON.jsonText), [{ name: "Doe, Jane", note: "line one\nline two" }]);
assert(jsonToCSV("{broken", { delimiter: ",", quotes: false }).warnings.length > 0);
const largeCSV = `id,value\n${Array.from({ length: 5000 }, (_, i) => `${i + 1},row-${i + 1}`).join("\n")}`;
const largeJSON = csvToJSON(largeCSV, { format: "array-of-objects", parseTypes: false, indent: 0 });
assert.strictEqual(largeJSON.rowCount, 5000);
assert.strictEqual(JSON.parse(largeJSON.jsonText).at(-1).value, "row-5000");
console.log("  CSV empty input, quoted commas/newlines, malformed JSON, and 5,000 rows handled.\n");

console.log("Test 9: JSON repair safety for valid strings, URLs, and escaped quotes");
const validJSONWithSyntaxLikeStrings = String.raw`{"url":"https://example.com/a//b","comment":"/* text */ // text","keyText":"{name: 'not a key',}","escaped":"say \\\"hello\\\", then continue"}`;
const validRepair = repairJSON(validJSONWithSyntaxLikeStrings);
assert.strictEqual(validRepair.repaired, validJSONWithSyntaxLikeStrings, "Valid JSON and its strings remain unchanged");
assert.deepStrictEqual(validRepair.logs, [], "Valid JSON needs no repairs");
const trickyMalformed = String.raw`{name:'A \'quoted\' value',url:'https://example.com/a//b',note:'literal /* value */ and // text',quote:'A "double quote"', list:[1,2,],}`;
const trickyRepair = repairJSON(trickyMalformed);
assert.strictEqual(validateJSON(trickyRepair.repaired).isValid, true, "Repaired edge-case input is valid JSON");
const trickyValue = JSON.parse(trickyRepair.repaired);
assert.strictEqual(trickyValue.name, "A 'quoted' value");
assert.strictEqual(trickyValue.url, "https://example.com/a//b");
assert.strictEqual(trickyValue.note, "literal /* value */ and // text");
assert.strictEqual(trickyValue.quote, 'A "double quote"');
assert(trickyRepair.logs.length > 0, "Every changed input has a visible repair log");
console.log("  Valid string contents are preserved and every applied repair is reported.\n");
console.log("  ✓ All 4 repair rules logged with counts, resulting in 100% valid RFC 8259 JSON.\n");

console.log("Test 10: Analytics consent choices, persistence, and tracking gates");
const consentValues = new Map();
const consentStorage = {
  getItem(key) {
    return consentValues.get(key) ?? null;
  },
  setItem(key, value) {
    consentValues.set(key, value);
  },
};
assert.strictEqual(readConsentChoice(consentStorage), null, "No saved choice is undecided");
assert.strictEqual(preferenceChoice(true), "accepted", "Enabling analytics accepts it");
assert.strictEqual(preferenceChoice(false), "rejected", "Disabling analytics rejects it");
persistConsentChoice(consentStorage, preferenceChoice(true));
assert.strictEqual(consentValues.get(CONSENT_STORAGE_KEY), "accepted");
assert.strictEqual(readConsentChoice(consentStorage), "accepted", "Acceptance persists");
assert(canLoadAnalytics(readConsentChoice(consentStorage)), "Accepted consent permits GA loading");
persistConsentChoice(consentStorage, preferenceChoice(false));
assert.strictEqual(consentValues.get(CONSENT_STORAGE_KEY), "rejected");
assert.strictEqual(readConsentChoice(consentStorage), "rejected", "Rejection persists");
assert(!canLoadAnalytics(readConsentChoice(consentStorage)), "Rejection prevents GA loading");
assert(!canTrackAnalytics("rejected", true, true), "Rejected consent prevents event tracking");
assert(!canTrackAnalytics(null, true, true), "Undecided consent prevents event tracking");
assert(!canTrackAnalytics("accepted", false, true), "Tracking waits for GA readiness");
assert(!canTrackAnalytics("accepted", true, false), "Tracking requires the existing GA tag");
assert(canTrackAnalytics("accepted", true, true), "Accepted and ready consent permits tracking");
const analyticsCalls = [];
const testGtag = (...args) => analyticsCalls.push(args);
assert.strictEqual(
  applyAnalyticsConsent("accepted", testGtag, true, false),
  true,
  "Acceptance configures the existing Google tag",
);
assert.deepStrictEqual(analyticsCalls, [
  ["consent", "update", { analytics_storage: "granted" }],
  [
    "config",
    "G-DLDHVDXG2Q",
    {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    },
  ],
]);
analyticsCalls.length = 0;
assert.strictEqual(
  applyAnalyticsConsent("accepted", testGtag, true, true),
  true,
  "Re-accepting consent does not configure GA twice",
);
assert.strictEqual(analyticsCalls.length, 1, "Existing GA configuration is reused");
analyticsCalls.length = 0;
assert.strictEqual(
  applyAnalyticsConsent("rejected", testGtag, true, true),
  true,
  "Rejecting preserves the existing one-time configuration state",
);
assert.deepStrictEqual(analyticsCalls, [
  ["consent", "update", { analytics_storage: "denied" }],
]);
analyticsCalls.length = 0;
applyAnalyticsConsent(null, testGtag, true, false);
assert.deepStrictEqual(analyticsCalls, [], "Undecided visitors send no GA commands");
console.log("  ✓ Accept, reject, manage-preference choices, persistence, and analytics gates passed.\n");

// --- TEST 11: JSON ➔ CSV shape handling (regression for crash C1 and column loss H1) ---
console.log("Test 11: JSON ➔ CSV row shapes, missing keys, nulls, nested values");
const toCSV = (json, opts = {}) => {
  let result;
  assert.doesNotThrow(() => {
    result = jsonToCSV(json, { delimiter: ",", quotes: false, ...opts });
  }, `jsonToCSV must not throw for ${json}`);
  return result;
};
const rowsOf = (csvText, delimiter = ",") => Papa.parse(csvText, { delimiter }).data;

// 1. Array of numbers -> single "value" column
const numbers = toCSV("[1,2,3]");
assert.strictEqual(numbers.ok, true);
assert.strictEqual(numbers.csvText, "value\r\n1\r\n2\r\n3");
assert.strictEqual(numbers.rowCount, 3);
assert.deepStrictEqual(numbers.warnings, []);

// 2. Array of strings, including delimiter and quote characters
const strings = toCSV('["a","b, c","say \\"hi\\""]');
assert.strictEqual(strings.ok, true);
assert.deepStrictEqual(rowsOf(strings.csvText), [["value"], ["a"], ["b, c"], ['say "hi"']]);

// 3. Arrays containing null values
const nullScalars = toCSV("[1,null,true]");
assert.strictEqual(nullScalars.ok, true);
assert.deepStrictEqual(rowsOf(nullScalars.csvText), [["value"], ["1"], [""], ["true"]]);
assert(nullScalars.warnings.some((w) => w.includes("1 null value")), "Null-to-empty conversion is reported");
const nullThenObject = toCSV('[null,{"a":1}]');
assert.strictEqual(nullThenObject.ok, false, "Mixed null and object rows are rejected");
assert.strictEqual(nullThenObject.csvText, "");
assert.match(nullThenObject.warnings[0], /item 2 is an object/);
const objectThenNumber = toCSV('[{"a":1},5]');
assert.strictEqual(objectThenNumber.ok, false);
assert.match(objectThenNumber.warnings[0], /item 1 is an object, but item 2 is a number/);
assert.strictEqual(toCSV('[[1,2],"x"]').ok, false, "Mixed array and scalar rows are rejected");

// 4. Objects with different keys -> union of columns in first-seen order
const differentKeys = toCSV('[{"a":1},{"a":2,"b":3},{"c":4}]');
assert.strictEqual(differentKeys.ok, true);
assert.deepStrictEqual(rowsOf(differentKeys.csvText), [
  ["a", "b", "c"],
  ["1", "", ""],
  ["2", "3", ""],
  ["", "", "4"],
]);
assert.strictEqual(differentKeys.rowCount, 3);

// 5. Missing keys and null fields are both empty cells and both reported
const missingAndNull = toCSV('[{"a":1,"b":null},{"a":2}]');
assert.deepStrictEqual(rowsOf(missingAndNull.csvText), [["a", "b"], ["1", ""], ["2", ""]]);
assert(missingAndNull.warnings.some((w) => w.includes("1 cell(s) are empty")), "Missing keys reported");
assert(missingAndNull.warnings.some((w) => w.includes("1 null value")), "Null fields reported");

// 6. Nested objects and arrays are kept as JSON text, never "[object Object]"
const nested = toCSV('[{"id":1,"meta":{"x":1,"y":[2,3]},"tags":["a","b"]}]');
assert.strictEqual(nested.ok, true);
assert(!nested.csvText.includes("[object Object]"));
assert.deepStrictEqual(rowsOf(nested.csvText), [
  ["id", "meta", "tags"],
  ["1", '{"x":1,"y":[2,3]}', '["a","b"]'],
]);
assert(nested.warnings.some((w) => w.includes("2 nested")), "Nested values reported");
const arrayRows = toCSV('[[1,"a"],[2,{"k":true}]]');
assert.deepStrictEqual(rowsOf(arrayRows.csvText), [["1", "a"], ["2", '{"k":true}']]);

// 7. Empty arrays and empty objects produce a clear message, not a crash
for (const empty of ["[]", "{}", "[{}]", "[[]]"]) {
  const result = toCSV(empty);
  assert.strictEqual(result.ok, false, `${empty} is reported as nothing to convert`);
  assert.strictEqual(result.csvText, "");
  assert(result.warnings.length === 1 && result.warnings[0].length > 0);
}

// 8. Invalid JSON and non-tabular top-level values
const invalid = toCSV("{broken");
assert.strictEqual(invalid.ok, false);
assert.match(invalid.warnings[0], /^Invalid JSON:/);
assert.strictEqual(toCSV('"just a string"').ok, false);
assert.strictEqual(toCSV("42").ok, false);
assert.strictEqual(toCSV("null").ok, false);
assert.strictEqual(toCSV("   ").ok, false);

// 9. Existing normal conversions keep their output
const normal = toCSV('[{"id":1,"name":"Sarah Connor","salary":95000},{"id":2,"name":"John Doe","salary":84000}]');
assert.strictEqual(normal.csvText, "id,name,salary\r\n1,Sarah Connor,95000\r\n2,John Doe,84000");
assert.deepStrictEqual(normal.warnings, []);
const semicolonQuoted = toCSV('[{"a":"x;y","b":2}]', { delimiter: ";", quotes: true });
assert.strictEqual(semicolonQuoted.csvText, '"a";"b"\r\n"x;y";"2"');
const recordDictionary = toCSV('{"u1":{"name":"Ann"},"u2":{"name":"Bo","age":30}}');
assert.deepStrictEqual(rowsOf(recordDictionary.csvText), [
  ["_id", "name", "age"],
  ["u1", "Ann", ""],
  ["u2", "Bo", "30"],
]);
const scalarDictionary = toCSV('{"a":1,"b":"two","c":[3]}');
assert.deepStrictEqual(rowsOf(scalarDictionary.csvText), [["key", "value"], ["a", "1"], ["b", "two"], ["c", "[3]"]]);
const mixedDictionary = toCSV('{"a":{"x":1},"b":2}');
assert.strictEqual(mixedDictionary.ok, false, "Dictionaries mixing records and values are rejected");
// A record that already has an "_id" field keeps it; dictionary keys move to "_key"
const idCollision = toCSV('{"k1":{"_id":"own","v":1}}');
assert.deepStrictEqual(rowsOf(idCollision.csvText), [["_key", "_id", "v"], ["k1", "own", "1"]]);
assert(idCollision.warnings.some((w) => w.includes('"_key"')), "Key-column rename reported");
// "__proto__" is an ordinary column name and its value is not lost
const protoKey = toCSV('[{"__proto__":"p","a":1}]');
assert.deepStrictEqual(rowsOf(protoKey.csvText), [["__proto__", "a"], ["p", "1"]]);
// Round trip CSV -> JSON -> CSV stays stable
const roundTripJSON = csvToJSON("id,name\n1,Ann\n2,Bo", { format: "array-of-objects", parseTypes: false, indent: 2 });
assert.strictEqual(toCSV(roundTripJSON.jsonText).csvText, "id,name\r\n1,Ann\r\n2,Bo");

// 10. CSV -> JSON conversions are unchanged
assert.deepStrictEqual(
  JSON.parse(csvToJSON("id,name,active\n1,Ann,true", { format: "array-of-objects", parseTypes: true, indent: 2 }).jsonText),
  [{ id: 1, name: "Ann", active: true }],
);
assert.deepStrictEqual(
  JSON.parse(csvToJSON("a,b\n1,2", { format: "2d-array", parseTypes: false, indent: 0 }).jsonText),
  [["a", "b"], ["1", "2"]],
);
console.log("  ✓ Primitives, nulls, mixed rows, missing keys, nested values, empty and invalid input handled without crashing.\n");

// ===========================================================================
// PHASE 2: data integrity, conversion correctness and output safety
// ===========================================================================
const parseCSV = (text, delimiter = ",") => Papa.parse(text, { delimiter }).data;
const jsonOf = (csv, opts = {}) =>
  JSON.parse(csvToJSON(csv, { format: "array-of-objects", parseTypes: false, indent: 0, ...opts }).jsonText);

// --- TEST 12: CSV values are preserved (no silent type changes) ---
console.log("Test 12: CSV ➔ JSON keeps values exactly; optional typing converts only exact numbers/booleans");
const valuesCSV = "zip,account,empty,sci,neg,big,flag,spaced\n00123,0042,,1e5,-7,9007199254740993,TRUE, 5";
assert.deepStrictEqual(jsonOf(valuesCSV), [
  { zip: "00123", account: "0042", empty: "", sci: "1e5", neg: "-7", big: "9007199254740993", flag: "TRUE", spaced: " 5" },
], "Default keeps every cell as the original text");
assert.deepStrictEqual(jsonOf(valuesCSV, { parseTypes: true }), [
  { zip: "00123", account: "0042", empty: "", sci: "1e5", neg: -7, big: "9007199254740993", flag: "TRUE", spaced: " 5" },
], "Typed mode converts only values whose JSON form is spelled identically");
for (const [cell, expected] of [
  ["42", 42], ["-7", -7], ["0", 0], ["98.5", 98.5], ["0.25", 0.25], ["true", true], ["false", false],
  ["00123", "00123"], ["1e5", "1e5"], ["1E5", "1E5"], ["1.50", "1.50"], ["+5", "+5"], [" 5", " 5"], ["5 ", "5 "],
  ["-0", "-0"], ["9007199254740993", "9007199254740993"], ["1.", "1."], [".5", ".5"], ["0x1F", "0x1F"],
  ["NaN", "NaN"], ["TRUE", "TRUE"], ["", ""], ["0.1000000000000000055511151231257827", "0.1000000000000000055511151231257827"],
]) {
  assert.strictEqual(inferExactType(cell), expected, `inferExactType(${JSON.stringify(cell)})`);
}
assert.deepStrictEqual(
  JSON.parse(csvToJSON("a,b\n00123,", { format: "2d-array", parseTypes: true, indent: 0 }).jsonText),
  [["a", "b"], ["00123", ""]],
  "2D arrays follow the same rules; empty cells never become null",
);
const dupHeaders = csvToJSON("a,a,a_1\n1,2,3", { format: "array-of-objects", parseTypes: false, indent: 0 });
assert.deepStrictEqual(JSON.parse(dupHeaders.jsonText), [{ a: "1", a_1: "2", a_1_1: "3" }]);
assert(dupHeaders.warnings.some((w) => w.includes("renamed")), "Duplicate column renames are reported");
const ragged = csvToJSON("a,b\n1\n2,3,4", { format: "array-of-objects", parseTypes: false, indent: 0 });
assert.deepStrictEqual(JSON.parse(ragged.jsonText), [{ a: "1" }, { a: "2", b: "3", column_3: "4" }]);
assert(ragged.warnings.some((w) => w.includes("fewer fields")) && ragged.warnings.some((w) => w.includes("column_3")));
assert.deepStrictEqual(jsonOf("__proto__,constructor\nx,y"), [JSON.parse('{"__proto__":"x","constructor":"y"}')]);
assert.strictEqual(csvToJSON("__proto__\nx", { format: "array-of-objects", parseTypes: false, indent: 0 }).jsonText, '[{"__proto__":"x"}]');
// Quoted delimiters, quotes, line breaks and non-Latin text survive CSV -> JSON -> CSV
const richCSV = 'name,note,city\r\n"Doe, Jane","He said ""hi""\nthen left",Lahore\r\nعلی,😀 ok,"São Paulo"';
const richJSON = csvToJSON(richCSV, { format: "array-of-objects", parseTypes: false, indent: 2 });
assert.deepStrictEqual(JSON.parse(richJSON.jsonText), [
  { name: "Doe, Jane", note: 'He said "hi"\nthen left', city: "Lahore" },
  { name: "علی", note: "😀 ok", city: "São Paulo" },
]);
assert.deepStrictEqual(parseCSV(jsonToCSV(richJSON.jsonText, { delimiter: ",", quotes: false }).csvText), parseCSV(richCSV));
assert(csvToJSON('a,b\n"unclosed,1', { format: "array-of-objects", parseTypes: false, indent: 0 }).warnings.some((w) => /quote/i.test(w)),
  "Unclosed quotes are reported");
console.log("  ✓ Leading zeros, empty cells, scientific notation, large integers and text are preserved.\n");

// --- TEST 13: Lossless JSON parsing, formatting, duplicates and error positions ---
console.log("Test 13: JSON formatter keeps numbers exactly, reports duplicate keys, and pinpoints errors");
const numbersJSON = '{"a":9007199254740993,"b":123456789012345678901234567890,"c":1.0,"d":1e5,"e":-0,"f":1.10,"g":"\\u00e9"}';
const numbersDoc = parseJSONDocument(numbersJSON);
assert.strictEqual(numbersDoc.ok, true);
assert.strictEqual(formatJSON(numbersDoc.root, 0), numbersJSON, "Minify is byte-identical for already-compact input");
assert.strictEqual(
  formatJSON(numbersDoc.root, 2),
  '{\n  "a": 9007199254740993,\n  "b": 123456789012345678901234567890,\n  "c": 1.0,\n  "d": 1e5,\n  "e": -0,\n  "f": 1.10,\n  "g": "\\u00e9"\n}',
);
assert.strictEqual(numbersDoc.unsafeIntegerCount, 2, "Integers beyond 2^53 are reported");
assert.deepStrictEqual(numbersDoc.unsafeIntegers.map((u) => u.path), ["$.a", "$.b"]);
// Layout matches JSON.stringify for ordinary data
const ordinary = { users: [{ id: 1, name: "Ann", tags: [], meta: {} }, { id: 2, name: 'Bo "B"', score: 9.5, ok: null }] };
for (const indent of [0, 2, 4]) {
  assert.strictEqual(
    formatJSON(parseJSONDocument(JSON.stringify(ordinary)).root, indent),
    JSON.stringify(ordinary, null, indent || undefined),
    `Formatting layout matches JSON.stringify at indent ${indent}`,
  );
}
// Duplicate keys are found with their location and kept when formatting
const dupDoc = parseJSONDocument('{\n  "a": 1,\n  "list": [{"x": 1, "x": 2}],\n  "a": 3\n}');
assert.strictEqual(dupDoc.duplicateKeyCount, 2);
assert.deepStrictEqual(dupDoc.duplicateKeys.map(({ path, key, line, column }) => [path, key, line, column]), [
  ["$.list[0]", "x", 3, 21],
  ["$", "a", 4, 3],
]);
assert.strictEqual(formatJSON(dupDoc.root, 0), '{"a":1,"list":[{"x":1,"x":2}],"a":3}', "Formatting keeps both duplicates");
// Repair then format keeps large numbers
const repairedBig = repairJSON("{id: 9007199254740993, price: 1.50, /* c */ tags: ['a',],}");
const repairedDoc = parseJSONDocument(repairedBig.repaired);
assert.strictEqual(repairedDoc.ok, true);
assert.strictEqual(formatJSON(repairedDoc.root, 0), '{"id":9007199254740993,"price":1.50,"tags":["a"]}');
// Exact error positions, independent of the JavaScript engine's message format
for (const [text, line, column, pattern] of [
  ['{\n  "key": "value",\n  "broken": unquotedVal\n}', 3, 13, /double quotes/],
  ["[1,\n2,,\n3]", 2, 3, /extra comma/],
  ['{"a":1,}', 1, 8, /Trailing comma/],
  ["[1,2,]", 1, 6, /Trailing comma/],
  ["{'a':1}", 1, 2, /double quotes/],
  ["{a:1}", 1, 2, /double quotes/],
  ['{"a":01}', 1, 6, /leading zeros/],
  ['{"a":1.}', 1, 8, /decimal point/],
  ['{"a":NaN}', 1, 6, /NaN/],
  ['{"a":1}x', 1, 8, /one top-level value/],
  ['{"a":"x\ny"}', 1, 8, /Line break/],
  ['{"a":[1,2}', 1, 10, /Expected ',' or ']'/],
  ['{"a":1', 1, 1, /not closed/],
  ['"abc', 1, 1, /Unterminated/],
  ['{"a":"\\x"}', 1, 7, /escape/],
]) {
  const result = validateJSON(text);
  assert.strictEqual(result.isValid, false, `${JSON.stringify(text)} is invalid`);
  assert.deepStrictEqual([result.error.line, result.error.column], [line, column], `Position for ${JSON.stringify(text)}`);
  assert.match(result.error.message, pattern);
  assert(/^ *\^$/.test(result.error.pointer) && result.error.pointer.length <= result.error.snippet.length + 1, "Caret lies within the snippet");
}
const pointed = validateJSON('{\n  "key": "value",\n  "broken": unquotedVal\n}').error;
assert.strictEqual(pointed.snippet, '  "broken": unquotedVal');
assert.strictEqual(pointed.pointer, "            ^", "Caret sits under the error column");
assert.strictEqual(validateJSON("").isValid, false);
assert.strictEqual(validateJSON("\uFEFF{\"a\":1}").isValid, true, "A leading byte-order mark is tolerated");
assert.strictEqual(parseJSONDocument("[".repeat(MAX_JSON_DEPTH) + "]".repeat(MAX_JSON_DEPTH)).ok, true);
assert.match(parseJSONDocument("[".repeat(MAX_JSON_DEPTH + 1) + "]".repeat(MAX_JSON_DEPTH + 1)).message, /Nesting/);
// Agreement with JSON.parse on validity for a mixed sample
for (const text of ['{"a":[1,2,{"b":null}]}', '"\\ud83d\\ude00"', "[]", "0", "-0.5e-3", "[1,]", "{,}", "[01]", '"\\u12"', "tru", "nul", '{"a" "b"}', " [ ] ", "[1 2]"]) {
  let native = true;
  try { JSON.parse(text); } catch { native = false; }
  assert.strictEqual(parseJSONDocument(text).ok, native, `Validity of ${text} matches JSON.parse`);
}
console.log("  ✓ Numbers keep their exact text, duplicates are reported and kept, and errors point at the exact character.\n");

// --- TEST 14: JSON -> CSV correctness on the lossless parser ---
console.log("Test 14: JSON ➔ CSV keeps exact numbers, column order and reports every lossy step");
const exactNumbers = toCSV('[{"id":9007199254740993,"price":1.0,"big":1e5,"zero":-0}]');
assert.strictEqual(exactNumbers.csvText, "id,price,big,zero\r\n9007199254740993,1.0,1e5,-0", "Numbers are written exactly as in the JSON");
const identicalKeys = toCSV('[{"a":1,"b":"x"},{"a":2,"b":"y"}]');
assert.strictEqual(identicalKeys.csvText, "a,b\r\n1,x\r\n2,y");
assert.deepStrictEqual(identicalKeys.warnings, []);
// Column order follows the document, even for integer-like keys (JSON.parse would reorder these)
assert.strictEqual(toCSV('[{"b":1,"2":2,"a":3}]').csvText, "b,2,a\r\n1,2,3");
// Duplicate keys: last value is used and the user is told
const dupRows = toCSV('[{"a":1,"a":2,"b":3}]');
assert.strictEqual(dupRows.csvText, "a,b\r\n2,3");
assert(dupRows.warnings.some((w) => w.includes("duplicate key") && w.includes("last value")));
// Empty strings, delimiters, quotes and line breaks survive and parse back identically
const tricky = toCSV('[{"empty":"","comma":"x,y","quote":"say \\"hi\\"","newline":"l1\\nl2","semi":"a;b"}]', { delimiter: ";" });
assert.deepStrictEqual(parseCSV(tricky.csvText, ";"), [["empty", "comma", "quote", "newline", "semi"], ["", "x,y", 'say "hi"', "l1\nl2", "a;b"]]);
// Arrays of arrays have no header row
const arrayRowsNoHeader = toCSV('[["a",1],["b",2]]');
assert.strictEqual(arrayRowsNoHeader.hasHeader, false);
assert.strictEqual(toCSV('[{"a":1}]').hasHeader, true);
// Unsupported shapes and invalid JSON give understandable messages with positions
assert.match(toCSV('[{"a":1},[1]]').warnings[0], /mixes row types/);
assert.match(toCSV('{"a":1,"b":{"c":2}}').warnings[0], /mixes record and non-record/);
assert.match(toCSV("true").warnings[0], /must be an array or an object/);
assert.match(toCSV('[{"a":1,}]').warnings[0], /^Invalid JSON: Trailing comma .*\(line 1, column 9\)$/);
console.log("  ✓ Exact numbers, document column order, duplicate-key notices and unsupported shapes verified.\n");

// --- TEST 15: Spreadsheet formula injection ---
console.log("Test 15: Formula-like cells are neutralized in spreadsheet-safe mode and reported otherwise");
for (const risky of ["=1+1", "+1+1", "-1+2", "@SUM(A1)", "\t=1", "\r=1", '=HYPERLINK("http://x","y")', "=cmd|' /C calc'!A0", "+1 555 123 4567", "-x"]) {
  assert.strictEqual(isFormulaRisk(risky), true, `${JSON.stringify(risky)} is treated as a formula risk`);
}
for (const safe of ["-5", "+3.2", "-1,234.50", "-12%", "1e-3", "-1.5E+3", "-", "---", "+", " =1", "a=1", "", "hello", "email@example.com", "2026-10-20"]) {
  assert.strictEqual(isFormulaRisk(safe), false, `${JSON.stringify(safe)} is ordinary data`);
}
const formulaJSON = '[{"=bad":"=1+1","amount":-5,"text":"-5","at":"@SUM(A1)","tab":"\\t=1","ok":"plain"}]';
const safeCSV = toCSV(formulaJSON, { formulaSafe: true });
assert.deepStrictEqual(parseCSV(safeCSV.csvText), [
  ["'=bad", "amount", "text", "at", "tab", "ok"],
  ["'=1+1", "-5", "-5", "'@SUM(A1)", "'\t=1", "plain"],
], "Risky cells (including headers) get an apostrophe; numbers stay numeric");
assert(safeCSV.warnings.some((w) => w.startsWith("4 cell(s)") && w.includes("apostrophe")));
const rawCSV = toCSV(formulaJSON, { formulaSafe: false });
assert.deepStrictEqual(parseCSV(rawCSV.csvText)[1], ["=1+1", "-5", "-5", "@SUM(A1)", "\t=1", "plain"], "Unprotected mode keeps values unchanged");
assert(rawCSV.warnings.some((w) => w.includes("may run as formulas")), "Unprotected mode still warns");
const delimiterSafe = convertCSVDelimiter("a;b\n=1+1;-5\n@x;ok", ";", "", {
  delimiter: ",", quoteChar: '"', quoteAllFields: false, escapeChar: '"', formulaSafe: true,
});
assert.deepStrictEqual(parseCSV(delimiterSafe.output), [["a", "b"], ["'=1+1", "-5"], ["'@x", "ok"]]);
assert.strictEqual(delimiterSafe.formulaCells, 2);
assert.strictEqual(neutralizeFormulaCells([["=1"]], false).rows[0][0], "=1", "Disabled neutralization changes nothing");
console.log("  ✓ Formula payloads neutralized, negative numbers and ordinary text untouched, behavior reported.\n");

// --- TEST 16: UTF-8, BOM and file decoding ---
console.log("Test 16: UTF-8 text, Excel BOM and uploaded-file decoding");
assert.strictEqual(withExcelBOM("a,b\r\n1,2"), "a,b\r\n1,2", "ASCII downloads are unchanged");
for (const text of ["café", "نام,شہر", "😀", "Müller"]) {
  assert.strictEqual(withExcelBOM(text), "\uFEFF" + text, `Non-ASCII download ${text} gets a UTF-8 BOM`);
}
const utfConverted = convertCSVDelimiter('نام;شہر;emoji\r\n"علی; خان";لاہور;😀\r\n"é\nü";;x', ";", "", {
  delimiter: ",", quoteChar: '"', quoteAllFields: false, escapeChar: '"',
});
assert.deepStrictEqual(parseCSV(utfConverted.output), [["نام", "شہر", "emoji"], ["علی; خان", "لاہور", "😀"], ["é\nü", "", "x"]]);
const encoder = new TextEncoder();
assert.deepStrictEqual(decodeTextBytes(new Uint8Array([0xef, 0xbb, 0xbf, ...encoder.encode("id,név")])), { text: "id,név" }, "UTF-8 BOM is removed");
const cp1252 = decodeTextBytes(new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72, 0x3b, 0x80]), '"legacy.csv"');
assert.strictEqual(cp1252.text, "Müller;€", "Invalid UTF-8 falls back to Windows-1252");
assert.match(cp1252.notice, /legacy\.csv.*not valid UTF-8/);
const utf16 = new Uint8Array([0xff, 0xfe, 0x61, 0x00, 0x3b, 0x00, 0xe9, 0x00]);
assert.deepStrictEqual(decodeTextBytes(utf16), { text: "a;é" }, "UTF-16 files with a BOM are decoded");
assert.deepStrictEqual(await readTextFile(new Blob([encoder.encode("x,ü\n1,2")])), { text: "x,ü\n1,2" });
// A BOM at the start of pasted/uploaded CSV does not leak into the first header
assert.deepStrictEqual(jsonOf("\uFEFFid,name\n1,Ann"), [{ id: "1", name: "Ann" }]);
console.log("  ✓ Non-Latin text, emoji and multiline cells round-trip; downloads and uploads handle encodings explicitly.\n");

// --- TEST 17: Preview counts and delimiter consistency ---
console.log("Test 17: Preview counts data rows only and uses the same delimiter as the conversion");
const preview = analyzeCSV('id,note\n1,"multi\nline"\n\n2,b\n\n\n', ",");
assert.strictEqual(preview.rowCount, 2, "Header, blank lines and trailing newlines are not counted");
assert.deepStrictEqual(preview.sampleRows, [["1", "multi\nline"], ["2", "b"]]);
assert(preview.warnings.some((w) => w.includes("1 blank line")), "Blank lines between records are reported");
assert.strictEqual(analyzeCSV("a,b\n1,2\n", ",").warnings.length, 0, "A trailing newline is not a warning");
const noHeader = analyzeCSV("1,2\n3,4,5", ",", { hasHeader: false });
assert.deepStrictEqual([noHeader.headers, noHeader.rowCount], [["Column 1", "Column 2", "Column 3"], 2]);
assert.strictEqual(convertCSVDelimiter("a;b\n1;2\n\n", ";", "", {
  delimiter: ",", quoteChar: '"', quoteAllFields: false, escapeChar: '"',
}).rowCount, 2, "Converted record count ignores trailing blank lines");
for (const [label, text, expected] of [
  ["comma", "id,name\n1,Ann\n2,Bo", ","],
  ["semicolon with decimal commas", "name;price\nA;10,50\nB;3,20", ";"],
  ["tab with commas in values", "id\tnote\n1\ta, b, c\n2\td, e, f", "\t"],
  ["pipe", "a|b|c\n1|2|3", "|"],
  ["colon", "a:b\n1:2\n3:4", ":"],
  ["comma file with times", "time,value\n10:20:30,5\n11:22:33,6", ","],
  ["quoted semicolons in comma file", 'a,b\n"x;y;z",1\n"p;q;r",2', ","],
  ["multiline quoted field", 'a;b\n"line1\nline2";2\nx;y', ";"],
  ["single line", "a;b;c", ";"],
  ["single column", "name\nAnn\nBo", ","],
]) {
  assert.strictEqual(detectDelimiter(text), expected, `Detects ${label}`);
  const previewHeaders = analyzeCSV(text).headers;
  const converted = JSON.parse(csvToJSON(text, { format: "2d-array", parseTypes: false, indent: 0 }).jsonText);
  assert.deepStrictEqual(converted[0], previewHeaders, `Preview and conversion agree for ${label}`);
}
assert.deepStrictEqual(resolveDelimiter("a,b", "custom", ""), { delimiter: "", error: "Enter a custom separator character." });
assert.match(resolveDelimiter("a,b", "custom", '"').error, /quote/);
assert.strictEqual(convertCSVDelimiter("a,b", "custom", "", { delimiter: ",", quoteChar: '"', quoteAllFields: false, escapeChar: '"' }).ok, false,
  "A blank custom separator is an error, not a silent fallback");
console.log("  ✓ Row counts exclude the header and blank lines; preview and conversion use one parser and one detector.\n");

// --- TEST 18: Malformed quoting is rejected with a location; valid quoting still works ---
console.log("Test 18: Malformed CSV quoting is an error with a line/column; valid quoted fields are unaffected");
const toJSON = (csv, opts = {}) => csvToJSON(csv, { format: "array-of-objects", parseTypes: false, indent: 0, ...opts });
const delimOpts = { delimiter: ";", quoteChar: '"', quoteAllFields: false, escapeChar: '"' };
// Finding A: an unclosed quote must not swallow the next row into a misleading record.
for (const [label, text] of [
  ["LF", 'Name,Description\nAli,"Unclosed quoted field\nSara,Karachi\n'],
  ["LF without final newline", 'Name,Description\nAli,"Unclosed quoted field\nSara,Karachi'],
  ["CRLF", 'Name,Description\r\nAli,"Unclosed quoted field\r\nSara,Karachi\r\n'],
]) {
  const unclosed = toJSON(text);
  assert.strictEqual(unclosed.ok, false, `Unclosed quote is an error (${label})`);
  assert.strictEqual(unclosed.jsonText, "", `No records are produced for an unclosed quote (${label})`);
  assert.strictEqual(unclosed.warnings.length, 1, `One clear message (${label})`);
  assert.match(unclosed.warnings[0], /Line 2, column 5: .*never closed/, `Error names the opening quote (${label})`);
  const unclosedPreview = analyzeCSV(text);
  assert.strictEqual(unclosedPreview.rowCount, 0, `Preview shows no misleading rows (${label})`);
  assert.match(unclosedPreview.error, /Line 2, column 5/);
  const unclosedConvert = convertCSVDelimiter(text, "auto", "", delimOpts);
  assert.deepStrictEqual([unclosedConvert.ok, unclosedConvert.output], [false, ""], `Delimiter converter refuses it (${label})`);
  assert.match(unclosedConvert.warnings[0], /Line 2, column 5/);
}
// Location is reported on later lines and after blank lines.
assert.match(toJSON('a,b\n1,2\n\n3,"never closed\n4,5').warnings[0], /^Malformed CSV\. Line 4, column 3:/);
assert.match(toJSON('a;b\n1;2\n3;"x').warnings[0], /Line 3, column 3/, "Works with other separators");
// Finding B: text after a closing quote is reported once, not once per later quote.
const trailing = toJSON('Name,Description\nAli,"abc"def,x\nSara,"x"y');
assert.strictEqual(trailing.ok, false);
assert.strictEqual(trailing.warnings.length, 1, "A malformed quote is reported once, without repeated warnings");
assert.match(trailing.warnings[0], /Line 2, column 5: .*extra text after its closing quote/);
// Finding B: JSON pasted in CSV mode gets a hint about the conversion mode.
const wrongMode = toJSON('[\n  {"Name":"Ali","Note":"=1+1"}\n]');
assert.match(wrongMode.warnings[0], /looks like JSON.*JSON ➔ CSV/, "Wrong-mode JSON paste is explained");
assert(!toJSON("a,b\n[x],{y}").warnings.some((w) => w.includes("looks like JSON")), "Ordinary CSV gets no JSON hint");
// Finding H: valid quoting, embedded commas/newlines, escaped quotes, empty cells and CRLF still work.
const validMultiline = toJSON('Name,Description\nAli,"Developer, designer"\nSara,"First line\nSecond line"');
assert.strictEqual(validMultiline.ok, true);
assert.deepStrictEqual(JSON.parse(validMultiline.jsonText), [
  { Name: "Ali", Description: "Developer, designer" },
  { Name: "Sara", Description: "First line\nSecond line" },
]);
const validMixed = toJSON('a,b,c\r\n"say ""hi""","",x\r\n"multi\r\nline",,"q,""r"""\r\n"spaced" ,ok,z\r\n');
assert.deepStrictEqual([validMixed.ok, validMixed.warnings], [true, []]);
assert.deepStrictEqual(JSON.parse(validMixed.jsonText), [
  { a: 'say "hi"', b: "", c: "x" },
  { a: "multi\r\nline", b: "", c: 'q,"r"' },
  { a: "spaced", b: "ok", c: "z" },
]);
assert.strictEqual(toJSON('a,b\n1,ab"c').ok, true, "A quote inside an unquoted value is kept as text, as before");
// Finding C: quoted newlines are not counted as rows.
assert.strictEqual(analyzeCSV('Name,Description\nAli,"x"\nSara,"First line\nSecond line"\nBo,y').rowCount, 3);
// Finding I: empty and header-only input.
assert.deepStrictEqual(toJSON("Name,City,Amount"), { jsonText: "[]", rowCount: 0, warnings: [], ok: true });
assert.strictEqual(toJSON("").ok, true);
assert.strictEqual(toJSON("").jsonText, "[]");
console.log("  ✓ Unclosed and malformed quotes are rejected once with a location; valid quoting, CRLF and header-only input unchanged.\n");

// --- TEST 19: CSV Viewer table, search, sort and export ---
console.log("Test 19: CSV Viewer builds a rectangular table, searches, sorts naturally and exports the view");
const viewer = await import("../src/lib/csv-viewer.ts");
{
  const { parseCSVRows } = await import("../src/lib/csv-utils.ts");
  const parsed = parseCSVRows('id,name,amount,code\n3,Ann,10.5,00123\n1,bob,2,A2\n2,Céline,,A10\n4,Dan,-7,\n5,ann', ",").rows;
  const table = viewer.buildViewerTable(parsed, true);
  assert.deepStrictEqual(table.headers, ["id", "name", "amount", "code"]);
  assert.strictEqual(table.rows.length, 5);
  assert.deepStrictEqual(table.rows[4], ["5", "ann", "", ""], "Short rows are padded with empty cells");
  assert.deepStrictEqual([table.raggedCount, table.raggedRows], [1, [5]], "Ragged rows are counted and located");
  assert.strictEqual(table.rows[0][3], "00123", "Leading zeros are kept as written");

  // Header off: generated names, first line becomes data.
  const noHeader = viewer.buildViewerTable(parsed, false);
  assert.deepStrictEqual(noHeader.headers, ["Column 1", "Column 2", "Column 3", "Column 4"]);
  assert.strictEqual(noHeader.rows.length, 6);
  // Blank header names get a generated name; extra columns beyond the header are kept.
  const wide = viewer.buildViewerTable([["a", ""], ["1", "2", "3"]], true);
  assert.deepStrictEqual(wide.headers, ["a", "Column 2", "Column 3"]);
  assert.deepStrictEqual(wide.rows[0], ["1", "2", "3"]);

  // Numeric detection and sorting: numbers by value, empties last, stable ties.
  assert.strictEqual(viewer.isNumericColumn(table.rows, 2), true);
  assert.strictEqual(viewer.isNumericColumn(table.rows, 3), false, "Codes such as A2 make a text column");
  const byAmount = viewer.sortIndices(table.rows, [0, 1, 2, 3, 4], { column: 2, direction: "asc" }).map((i) => table.rows[i][2]);
  assert.deepStrictEqual(byAmount, ["-7", "2", "10.5", "", ""], "Numeric ascending with empty cells last");
  const byAmountDesc = viewer.sortIndices(table.rows, [0, 1, 2, 3, 4], { column: 2, direction: "desc" }).map((i) => table.rows[i][0]);
  assert.deepStrictEqual(byAmountDesc, ["3", "1", "4", "2", "5"], "Descending keeps empties last and ties in file order");
  const byCode = viewer.sortIndices(table.rows, [0, 1, 2, 3, 4], { column: 3, direction: "asc" }).map((i) => table.rows[i][3]);
  assert.deepStrictEqual(byCode, ["00123", "A2", "A10", "", ""], "Natural text order: A2 before A10");
  const byName = viewer.sortIndices(table.rows, [0, 1, 2, 3, 4], { column: 1, direction: "asc" }).map((i) => table.rows[i][0]);
  assert.deepStrictEqual(byName, ["3", "5", "1", "2", "4"], "Case-insensitive names; equal names keep file order");
  assert.deepStrictEqual(viewer.sortIndices(table.rows, [2, 0], null), [2, 0], "No sort keeps the given order");

  // Search: case-insensitive, any column or one column, accents kept.
  assert.deepStrictEqual(viewer.filterIndices(table.rows, "ANN", "all"), [0, 4]);
  assert.deepStrictEqual(viewer.filterIndices(table.rows, "a1", 3), [2]);
  assert.deepStrictEqual(viewer.filterIndices(table.rows, "céline", "all"), [2]);
  assert.deepStrictEqual(viewer.filterIndices(table.rows, "  ", "all"), [0, 1, 2, 3, 4], "Blank search shows every row");
  assert.deepStrictEqual(viewer.viewIndices(table.rows, "a", 1, { column: 0, direction: "desc" }), [4, 3, 0],
    "Search then sort");

  // Export of the current view: header plus shown rows, quoting and formula safety.
  const risky = viewer.buildViewerTable([["name", "note"], ["x", "=1+1"], ["y", "a, b"], ["z", "-5"]], true);
  const exported = viewer.exportView(risky, [1, 0], { delimiter: ",", formulaSafe: true, includeHeader: true });
  assert.strictEqual(exported.csvText, 'name,note\r\ny,"a, b"\r\nx,\'=1+1');
  assert.deepStrictEqual([exported.rowCount, exported.formulaCells], [2, 1]);
  const raw = viewer.exportView(risky, [0, 2], { delimiter: ";", formulaSafe: false, includeHeader: false });
  assert.strictEqual(raw.csvText, "x;=1+1\r\nz;-5", "Formula safety off and no header when the file had none");

  // Column widths stay within readable bounds.
  const widths = viewer.columnWidths(viewer.buildViewerTable([["a", "b"], ["1", "x".repeat(500)]], true));
  assert.deepStrictEqual(widths, [96, 360]);

  // A larger table filters and sorts quickly enough for interactive use.
  const big = Array.from({ length: 100000 }, (_, i) => [String(100000 - i), `name ${i % 997}`, i % 3 ? "x" : ""]);
  const started = performance.now();
  const bigView = viewer.viewIndices(big, "name 5", "all", { column: 0, direction: "asc" });
  const elapsed = performance.now() - started;
  assert(bigView.length > 0 && Number(big[bigView[0]][0]) <= Number(big[bigView[1]][0]), "Large view is sorted");
  assert(elapsed < 2000, `100,000-row search and sort took ${elapsed.toFixed(0)} ms`);
}
console.log("  ✓ Padding, ragged-row report, natural and numeric sort, search, export and performance verified.\n");

// --- TEST 20: Split CSV and ZIP export ---
console.log("Test 20: Split CSV by rows, file count and column value; dependency-free ZIP is valid");
{
  const split = await import("../src/lib/csv-split.ts");
  const zip = await import("../src/lib/zip.ts");
  const rows = Array.from({ length: 10 }, (_, i) => [String(i + 1), i % 3 === 0 ? "Lahore" : i % 3 === 1 ? "Karachi" : "", `=cmd${i}`]);

  const byRows = split.splitRows(rows, { kind: "rows", rowsPerFile: 4 }, "orders.csv");
  assert.deepStrictEqual(byRows.parts.map((p) => [p.name, p.rows.length]),
    [["orders.csv-part-001.csv", 4], ["orders.csv-part-002.csv", 4], ["orders.csv-part-003.csv", 2]]);
  assert.deepStrictEqual(byRows.parts.flatMap((p) => p.rows.map((r) => r[0])), rows.map((r) => r[0]), "Every row appears once, in order");

  const byFiles = split.splitRows(rows, { kind: "files", fileCount: 3 }, "orders");
  assert.deepStrictEqual(byFiles.parts.map((p) => p.rows.length), [4, 3, 3], "Rows are divided as evenly as possible");
  assert.deepStrictEqual(byFiles.parts.flatMap((p) => p.rows.map((r) => r[0])), rows.map((r) => r[0]));
  const six = split.splitRows(rows, { kind: "files", fileCount: 6 }, "x");
  assert.deepStrictEqual(six.parts.map((p) => p.rows.length), [2, 2, 2, 2, 1, 1], "Exactly the requested number of files");
  assert.match(split.splitRows(rows, { kind: "files", fileCount: 1 }, "x").error, /2 or more/);
  assert.match(split.splitRows(rows, { kind: "files", fileCount: 11 }, "x").error, /at most 10 files/);
  assert.match(split.splitRows(rows, { kind: "rows", rowsPerFile: 0 }, "x").error, /whole number/);
  assert.match(split.splitRows(rows, { kind: "rows", rowsPerFile: 2.5 }, "x").error, /whole number/);
  assert.match(split.splitRows([], { kind: "rows", rowsPerFile: 5 }, "x").error, /no data rows/);
  const many = Array.from({ length: 2001 }, (_, i) => [String(i)]);
  assert.match(split.splitRows(many, { kind: "rows", rowsPerFile: 2 }, "x").error, /1,000 files or fewer/);

  const byCity = split.splitRows(rows, { kind: "column", column: 1 }, "orders");
  assert.deepStrictEqual(byCity.parts.map((p) => [p.name, p.rows.length, p.value]),
    [["orders-Lahore.csv", 4, "Lahore"], ["orders-Karachi.csv", 3, "Karachi"], ["orders-empty.csv", 3, ""]],
    "One file per value in order of first appearance; empty values grouped");
  const clash = split.splitRows([["A/B"], ["A B"], ["x"], ["X"], ["A-B"]], { kind: "column", column: 0 }, "t");
  assert.deepStrictEqual(clash.parts.map((p) => p.name), ["t-A-B.csv", "t-A-B-2.csv", "t-x.csv", "t-X-2.csv", "t-A-B-3.csv"],
    "Colliding file names (also case-insensitive) get unique suffixes");
  assert.strictEqual(split.safeFileStem('  ..con:tro"l*?.  '), "con-tro-l");
  assert.strictEqual(split.safeFileStem("علی  خان"), "علی-خان", "Non-Latin values are kept in file names");
  assert.strictEqual(split.safeFileStem("???"), "empty");

  const csvPart = split.partToCSV(byRows.parts[2], ["id", "city", "note"], { delimiter: ";", formulaSafe: true });
  assert.strictEqual(csvPart.csvText, "id;city;note\r\n9;;'=cmd8\r\n10;Lahore;'=cmd9", "Header repeated; formulas neutralized");
  assert.strictEqual(csvPart.formulaCells, 2);
  assert.strictEqual(split.partToCSV(byRows.parts[2], null, { delimiter: ",", formulaSafe: false }).csvText, "9,,=cmd8\r\n10,Lahore,=cmd9");

  // ZIP: known CRC-32 value, and the archive opens with Python's zipfile with identical contents.
  assert.strictEqual(zip.crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  const files = [
    { name: "orders-part-001.csv", data: new TextEncoder().encode("id\r\n1\r\n") },
    { name: "orders-علی.csv", data: new TextEncoder().encode("﻿name\r\nعلی 😀\r\n") },
    { name: "empty.csv", data: new Uint8Array(0) },
  ];
  const archive = zip.createZip(files, new Date(2026, 9, 23, 18, 30, 10));
  const { execFileSync } = await import("node:child_process");
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const zipPath = join(mkdtempSync(join(tmpdir(), "tooltiva-zip-")), "test.zip");
  writeFileSync(zipPath, archive);
  let python = null;
  for (const cmd of ["python3", "python"]) {
    try {
      execFileSync(cmd, ["--version"], { stdio: "ignore" });
      python = cmd;
      break;
    } catch {}
  }
  if (python) {
    const listing = JSON.parse(execFileSync(python, ["-c",
      "import zipfile,sys,json;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print(json.dumps([[i.filename,z.read(i).decode('utf-8'),list(i.date_time)] for i in z.infolist()]))",
      zipPath]).toString());
    assert.deepStrictEqual(listing, [
      ["orders-part-001.csv", "id\r\n1\r\n", [2026, 10, 23, 18, 30, 10]],
      ["orders-علی.csv", "﻿name\r\nعلی 😀\r\n", [2026, 10, 23, 18, 30, 10]],
      ["empty.csv", "", [2026, 10, 23, 18, 30, 10]],
    ], "ZIP opens in a standard reader with identical names, contents and dates");
  } else {
    console.log("  (Python not found: ZIP structure checked without a third-party reader)");
  }
  const view = new DataView(archive.buffer);
  assert.strictEqual(view.getUint32(archive.length - 22, true), 0x06054b50, "End-of-central-directory record present");
  assert.strictEqual(view.getUint16(archive.length - 12, true), 3, "Entry count recorded");
}
console.log("  ✓ Row, file-count and column splits, safe unique names, header repeat, formula safety and ZIP output verified.\n");

console.log("Test 21: Merge CSV matches columns by name or position and never changes values");
{
  const merge = await import("../src/lib/csv-merge.ts");
  const jan = { name: "jan.csv", rows: [["id", "Name", "city"], ["001", "Ayesha", "Lahore"], ["002", "Liam", "Cork"]] };
  const feb = { name: "feb.csv", rows: [[" name ", "ID", "discount"], ["Sofia", "003", "=5%"]] };

  const byName = merge.mergeCSVTables([jan, feb], { hasHeader: true, matchBy: "name", sourceColumn: false });
  assert.deepStrictEqual(byName.headers, ["id", "Name", "city", "discount"], "Union of columns, first spelling kept");
  assert.deepStrictEqual(byName.rows, [
    ["001", "Ayesha", "Lahore", ""],
    ["002", "Liam", "Cork", ""],
    ["003", "Sofia", "", "=5%"],
  ], "Columns matched by name in any order, ignoring case and spaces; leading zeros kept");
  assert.deepStrictEqual(byName.files[1].newColumns, ["discount"]);
  assert.deepStrictEqual(byName.files[1].missingColumns, ["city"]);
  assert.deepStrictEqual(byName.files[0].missingColumns, ["discount"]);
  assert.deepStrictEqual(byName.files.map((f) => f.dataRows), [2, 1]);

  const withSource = merge.mergeCSVTables([jan, feb], { hasHeader: true, matchBy: "name", sourceColumn: true });
  assert.deepStrictEqual(withSource.headers[0], "source_file");
  assert.deepStrictEqual(withSource.rows.map((r) => r[0]), ["jan.csv", "jan.csv", "feb.csv"]);
  const clash = merge.mergeCSVTables([{ name: "a.csv", rows: [["source_file", "x"], ["s", "1"]] }], { hasHeader: true, matchBy: "name", sourceColumn: true });
  assert.deepStrictEqual(clash.headers, ["source_file_2", "source_file", "x"], "Source column never overwrites a real column");

  const dupes = merge.mergeCSVTables([{ name: "d.csv", rows: [["id", "id", ""], ["1", "2", "3"]] }, { name: "e.csv", rows: [["id", ""], ["4", "5"]] }],
    { hasHeader: true, matchBy: "name", sourceColumn: false });
  assert.deepStrictEqual(dupes.headers, ["id", "id", "Column 3", "Column 4"], "Duplicate names stay separate; unnamed columns only match at the same position");
  assert.deepStrictEqual(dupes.rows, [["1", "2", "3", ""], ["4", "", "", "5"]]);

  const extra = merge.mergeCSVTables([{ name: "x.csv", rows: [["a", "b"], ["1", "2", "overflow"]] }, jan], { hasHeader: true, matchBy: "name", sourceColumn: false });
  assert.deepStrictEqual(extra.headers, ["a", "b", "id", "Name", "city", "Column 6"], "Extra fields kept in their own column at the end");
  assert.ok(extra.rows.every((r) => r.length === extra.headers.length), "Every row has every column");
  assert.deepStrictEqual(extra.rows[0], ["1", "2", "", "", "", "overflow"]);

  const byPos = merge.mergeCSVTables([jan, feb], { hasHeader: true, matchBy: "position", sourceColumn: false });
  assert.deepStrictEqual(byPos.headers, ["id", "Name", "city"]);
  assert.deepStrictEqual(byPos.rows[2], ["Sofia", "003", "=5%"], "Position matching stacks rows as they are");
  assert.strictEqual(byPos.files[1].columnCountDiffers, undefined);
  const noHeader = merge.mergeCSVTables([{ name: "a", rows: [["1", "2"]] }, { name: "b", rows: [["3", "4", "5"]] }], { hasHeader: false, matchBy: "position", sourceColumn: false });
  assert.deepStrictEqual(noHeader.rows, [["1", "2", ""], ["3", "4", "5"]]);
  assert.deepStrictEqual(noHeader.files[1].columnCountDiffers, { expected: 2, actual: 3 });

  const out = merge.mergedToCSV(byName, { delimiter: ";", formulaSafe: true, includeHeader: true });
  assert.strictEqual(out.formulaCells, 1);
  assert.strictEqual(out.csvText.split("\r\n")[3], "003;Sofia;;'=5%", "Semicolon output with spreadsheet-safe formula cell");
  assert.strictEqual(merge.mergedToCSV(noHeader, { delimiter: ",", formulaSafe: false, includeHeader: false }).csvText, "1,2,\r\n3,4,5");
}
console.log("  ✓ Name and position matching, source column, duplicate/extra columns, per-file report and output verified.\n");

console.log("Test 22: Remove duplicate rows by whole row or key columns, keeping first or last");
{
  const { findDuplicateRows } = await import("../src/lib/csv-dedupe.ts");
  const rows = [
    ["1", "Ann", "ann@example.com"],
    ["2", "Bob", "bob@example.com"],
    ["1", "Ann", "ann@example.com"],
    ["3", "ann", " Ann@Example.com "],
    ["4", "Cy", ""],
    ["5", "Dee", ""],
  ];
  const whole = findDuplicateRows(rows, { columns: "all", keep: "first", ignoreCase: false, trimSpaces: false, keepEmpty: false });
  assert.deepStrictEqual(whole, { kept: [0, 1, 3, 4, 5], removed: [2], duplicateGroups: 1 }, "Exact whole-row duplicates");

  const byEmail = findDuplicateRows(rows, { columns: [2], keep: "first", ignoreCase: true, trimSpaces: true, keepEmpty: false });
  assert.deepStrictEqual(byEmail.kept, [0, 1, 4], "Case and outer spaces ignored; empty emails count as one value");
  assert.deepStrictEqual(byEmail.removed, [2, 3, 5]);
  assert.strictEqual(byEmail.duplicateGroups, 2);

  const keepBlank = findDuplicateRows(rows, { columns: [2], keep: "first", ignoreCase: true, trimSpaces: true, keepEmpty: true });
  assert.deepStrictEqual(keepBlank.removed, [2, 3], "Rows with an empty key are kept when keepEmpty is on");
  assert.strictEqual(keepBlank.duplicateGroups, 1);
  assert.deepStrictEqual(findDuplicateRows([[""], [""]], { columns: "all", keep: "first", ignoreCase: false, trimSpaces: false, keepEmpty: true }).removed, []);

  const strictEmail = findDuplicateRows(rows, { columns: [2], keep: "first", ignoreCase: false, trimSpaces: false, keepEmpty: false });
  assert.deepStrictEqual(strictEmail.removed, [2, 5], "Without the options, differently written emails stay");

  const last = findDuplicateRows(rows, { columns: [2], keep: "last", ignoreCase: true, trimSpaces: true, keepEmpty: false });
  assert.deepStrictEqual(last.kept, [1, 3, 5], "Keep last keeps the final occurrence, in file order");
  assert.deepStrictEqual(last.removed, [0, 2, 4]);

  const twoCols = findDuplicateRows([["a", "b", "1"], ["a", "b", "2"], ["ab", "", "3"], ["a", "", "4"]], { columns: [0, 1], keep: "first", ignoreCase: false, trimSpaces: false, keepEmpty: false });
  assert.deepStrictEqual(twoCols.removed, [1], "Multi-column keys never collide by concatenation (a|b vs ab|)");

  const big = Array.from({ length: 200000 }, (_, i) => [String(i % 50000), "x"]);
  const t0 = performance.now();
  const bigResult = findDuplicateRows(big, { columns: [0], keep: "first", ignoreCase: true, trimSpaces: true, keepEmpty: false });
  const ms = performance.now() - t0;
  assert.strictEqual(bigResult.kept.length, 50000);
  assert.ok(ms < 2000, `200k rows deduplicated in ${ms.toFixed(0)} ms`);
}
console.log("  ✓ Whole-row and key-column matching, case/space options, keep first/last and 200k-row speed verified.\n");

console.log("Test 23: Image size fitting reaches KB ranges by quality, then by dimensions");
{
  const img = await import("../src/lib/image-size.ts");
  // Size model: bytes grow with pixel count and steeply with quality, like JPEG.
  let calls = 0;
  const model = async (w, h, q) => { calls++; return { size: Math.round(w * h * (0.05 + 2.5 * q ** 3)), w, h, q }; };

  assert.deepStrictEqual(img.kbRange(10, 20), { minBytes: 10240, maxBytes: 20000 }, "Max uses 1,000 bytes per KB, min 1,024");
  assert.strictEqual(img.formatBytes(19456), "19.0 KB");
  assert.strictEqual(img.formatBytes(2 * 1024 * 1024), "2.00 MB");

  const photo = await img.fitToSize(4000, 3000, img.kbRange(0, 20), model);
  assert.strictEqual(photo.status, "ok");
  assert.ok(photo.result.size <= 20000 && photo.resized && photo.quality >= 0.3, `12 MP photo shrunk under 20 KB (${photo.result.size} bytes, ${photo.width}x${photo.height}, q${photo.quality.toFixed(2)})`);
  assert.ok(Math.abs(photo.width / photo.height - 4 / 3) < 0.01, "Aspect ratio kept");

  const range = await img.fitToSize(2000, 1500, img.kbRange(50, 100), model);
  assert.strictEqual(range.status, "ok");
  assert.ok(range.result.size >= 51200 && range.result.size <= 100000, `50–100 KB range hit (${range.result.size})`);

  const tiny = await img.fitToSize(60, 45, img.kbRange(20, 50), model);
  assert.strictEqual(tiny.status, "ok", "A small image is enlarged to reach a minimum size");
  assert.ok(tiny.result.size >= 20480 && tiny.result.size <= 50000 && tiny.width > 60, `enlarged to ${tiny.width}x${tiny.height}, ${tiny.result.size} bytes`);

  const already = await img.fitToSize(300, 200, img.kbRange(0, 500), model);
  assert.deepStrictEqual([already.status, already.width, already.quality], ["ok", 300, 0.95], "Already small: original size, top quality");

  const sig = await img.fitToSize(140, 60, img.kbRange(10, 20), model, { fixedSize: true });
  assert.strictEqual(sig.status, "ok");
  assert.deepStrictEqual([sig.width, sig.height], [140, 60], "Fixed dimensions are never changed");
  assert.ok(sig.result.size >= 10240 && sig.result.size <= 20000, `fixed size in range (${sig.result.size})`);

  const cannot = await img.fitToSize(50, 50, img.kbRange(20, 30), model, { fixedSize: true });
  assert.strictEqual(cannot.status, "too-small", "Reports when a fixed small size cannot reach the minimum");
  const huge = await img.fitToSize(4000, 4000, img.kbRange(0, 5), model, { fixedSize: true });
  assert.strictEqual(huge.status, "too-large", "Reports when fixed large dimensions cannot get under the maximum");

  calls = 0;
  await img.fitToSize(6000, 4000, img.kbRange(0, 20), model);
  assert.ok(calls < 80, `bounded number of encodes (${calls})`);
}
console.log("  ✓ KB limits, shrinking, ranges, enlarging to a minimum, fixed sizes and failure reports verified.\n");

console.log("Test 24: Signature analysis, background cleaning and JPEG DPI");
{
  const sig = await import("../src/lib/signature.ts");
  const W = 200, H = 100;
  const data = new Uint8ClampedArray(W * H * 4);
  let seed = 3;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const paper = 200 + ((seed >> 16) % 15) - (x / W) * 20; // grey paper with a shadow gradient
    const isInk = x >= 50 && x < 150 && y >= 30 && y < 70 && (x + y) % 7 < 3;
    const i = (y * W + x) * 4;
    data[i] = isInk ? 30 : paper; data[i + 1] = isInk ? 40 : paper; data[i + 2] = isInk ? 110 : paper; data[i + 3] = 255;
  }
  const speck = (5 * W + 5) * 4; data[speck] = data[speck + 1] = data[speck + 2] = 20; // a single dust speck

  const a = sig.analyzeSignature(data, W, H);
  assert.ok(a.paper > 170 && a.ink < 80, `paper ${a.paper}, ink ${a.ink}`);
  assert.ok(a.box && a.box.x <= 50 && a.box.x >= 40 && a.box.x + a.box.width >= 150 && a.box.y <= 30 && a.box.y + a.box.height >= 70, `box ${JSON.stringify(a.box)}`);
  assert.ok(a.box.x > 5 && a.box.y > 5, "A lone speck does not stretch the crop");
  assert.strictEqual(sig.analyzeSignature(new Uint8ClampedArray(40 * 40 * 4).fill(230), 40, 40).box, null, "Blank paper: no signature found");

  const black = data.slice();
  sig.cleanSignature(black, a.paper, a.ink, "black");
  const px = (arr, x, y) => Array.from(arr.slice((y * W + x) * 4, (y * W + x) * 4 + 3));
  assert.deepStrictEqual(px(black, 10, 90), [255, 255, 255], "Paper becomes pure white");
  assert.ok(px(black, 54, 30)[0] < 40, `ink becomes near black (${px(black, 54, 30)})`);
  const kept = data.slice();
  sig.cleanSignature(kept, a.paper, a.ink, "original");
  const inkPx = px(kept, 54, 30);
  assert.ok(inkPx[2] > inkPx[0], `original ink colour (blue) is kept: ${inkPx}`);
  assert.deepStrictEqual(px(kept, 190, 10), [255, 255, 255]);

  assert.strictEqual(sig.cmToPx(3.5, 300), 413);
  assert.strictEqual(sig.cmToPx(2.54, 200), 200);
  const jfif = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);
  const withDpi = sig.setJpegDpi(jfif, 300);
  assert.strictEqual(withDpi.length, jfif.length, "Existing JFIF header updated in place");
  assert.strictEqual(sig.readJpegDpi(withDpi), 300);
  const bare = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 4, 1, 2, 0xff, 0xd9]);
  const added = sig.setJpegDpi(bare, 200);
  assert.strictEqual(added.length, bare.length + 18, "JFIF header added when missing");
  assert.strictEqual(sig.readJpegDpi(added), 200);
  assert.deepStrictEqual(Array.from(added.slice(20)), Array.from(bare.slice(2)), "Image data untouched");
  const bytes = await import("../src/lib/jpeg-bytes.ts");
  const padded = bytes.padJpeg(withDpi, 10240);
  assert.strictEqual(padded.length, 10240, "Padded to exactly the minimum");
  assert.strictEqual(bytes.readJpegDpi(padded), 300, "JFIF header (and DPI) stays first");
  assert.deepStrictEqual([padded[20], padded[21]], [0xff, 0xfe], "Padding is a JPEG comment segment after the header");
  assert.deepStrictEqual(Array.from(padded.slice(-2)), [0xff, 0xd9], "End marker intact");
  const big = bytes.padJpeg(bare, 150000);
  assert.ok(big.length >= 150000 && big.length < 150010, `multi-segment padding (${big.length})`);
  let pos = 2, segs = 0;
  while (big[pos] === 0xff && big[pos + 1] === 0xfe) { pos += 2 + ((big[pos + 2] << 8) | big[pos + 3]); segs++; }
  assert.ok(segs >= 3 && big[pos] === 0xff && big[pos + 1] === 0xdb, "Comment segments chain to the original image data");
  assert.strictEqual(bytes.padJpeg(withDpi, 10), withDpi, "Already big enough: unchanged");
}
console.log("  ✓ Paper/ink levels, crop box ignoring specks, white background, ink colour modes and DPI header verified.\n");

console.log("Test 25: vCard reading (2.1/3.0/4.0) and writing, CSV column mapping, country codes");
{
  const v = await import("../src/lib/vcard.ts");

  // Android-style vCard 2.1: quoted-printable UTF-8 name with a soft line break, bare TEL types.
  const android = [
    "BEGIN:VCARD",
    "VERSION:2.1",
    "N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D8=AE=D8=A7=D9=86;=D8=B9=D9=84=DB=8C;;;",
    "FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D8=B9=D9=84=DB=8C=20=D8=AE=D8=A7=",
    "=D9=86",
    "TEL;CELL;PREF:+923001234567",
    "TEL;HOME:042-35761234",
    "PHOTO;ENCODING=BASE64;JPEG:/9j/4AAQSkZJRgABAQ",
    " AAAQABAAD",
    "",
    "END:VCARD",
  ].join("\r\n");
  // iPhone-style vCard 3.0: groups with custom labels, folded NOTE, escaped comma and newline.
  const iphone = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:O'Brien;Liam;;Dr.;",
    "FN:Dr. Liam O'Brien",
    "ORG:Acme\\, Inc.;Sales",
    "item1.TEL;type=pref:+353 87 123 4567",
    "item1.X-ABLabel:_$!<Mobile>!$_",
    "item2.TEL:+353 1 234 5678",
    "item2.X-ABLabel:Office line",
    "EMAIL;type=INTERNET;type=WORK;type=pref:liam@acme.example",
    "ADR;type=HOME:;;12 Main St;Cork;;T12 ABC;Ireland",
    "NOTE:Met at the trade fair\\, booth 4.\\nCall after 3pm about the long-runnin",
    " g order.",
    "END:VCARD",
  ].join("\n");
  const v4 = "BEGIN:VCARD\nVERSION:4.0\nFN:Sofia Rossi\nTEL;VALUE=uri;TYPE=\"voice,work\":tel:+39-02-1234567\nEND:VCARD\nBEGIN:VCARD\nVERSION:3.0\nEND:VCARD\n";

  const parsed = v.parseVCF(android + "\r\n" + iphone + "\n" + v4);
  assert.strictEqual(parsed.contacts.length, 3, "Three contacts; the empty card is skipped");
  assert.strictEqual(parsed.skippedEmpty, 1);
  const [ali, liam, sofia] = parsed.contacts;
  assert.strictEqual(ali.fullName, "علی خان", "Quoted-printable UTF-8 with a soft line break");
  assert.strictEqual(ali.firstName, "علی");
  assert.deepStrictEqual(ali.phones, [{ value: "+923001234567", type: "Mobile" }, { value: "042-35761234", type: "Home" }]);
  assert.strictEqual(liam.organization, "Acme, Inc., Sales", "Escaped comma kept; ORG parts joined");
  assert.deepStrictEqual(liam.phones.map((p) => p.type), ["Mobile", "Office line"], "Apple custom labels");
  assert.deepStrictEqual(liam.emails, [{ value: "liam@acme.example", type: "Work" }]);
  assert.strictEqual(liam.note, "Met at the trade fair, booth 4.\nCall after 3pm about the long-running order.", "Folded line and \\n unescaped");
  assert.strictEqual(v.formatAddress(liam.addresses[0]), "12 Main St, Cork T12 ABC, Ireland");
  assert.deepStrictEqual(sofia.phones, [{ value: "+39-02-1234567", type: "Work" }], "vCard 4.0 tel: URI and quoted TYPE list");
  assert.strictEqual(v.parseVCF("name,phone\nA,1").notVCard, true);

  const table = v.contactsToTable(parsed.contacts);
  assert.deepStrictEqual(table.headers.slice(0, 4), ["Full name", "First name", "Last name", "Prefix"]);
  assert.ok(table.headers.includes("Phone 2 type") && table.headers.includes("Address 1") && table.headers.includes("Note"));
  assert.strictEqual(table.rows[1][table.headers.indexOf("Phone 2")], "+353 1 234 5678");

  // Writing: escaping, folding at 75 octets without splitting UTF-8, CRLF, and a round trip.
  const card = v.contactToVCard(liam);
  assert.ok(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\nN:O'Brien;Liam;;Dr.;\r\nFN:Dr. Liam O'Brien\r\n"));
  assert.ok(card.includes("ORG:Acme\\, Inc.\\, Sales"));
  for (const line of card.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, "Every line at most 75 octets");
  const longUrdu = v.foldLine("NOTE:" + "علی ".repeat(30));
  assert.ok(longUrdu.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75) && !longUrdu.includes("�"));
  const round = v.parseVCF(v.contactsToVCF(parsed.contacts)).contacts;
  assert.deepStrictEqual(round.map((c) => [c.fullName, c.phones.map((p) => p.value), c.note]), parsed.contacts.map((c) => [c.fullName, c.phones.map((p) => p.value), c.note]), "Round trip keeps names, phones and notes");
  const nameless = v.contactToVCard({ ...v.emptyContact(), phones: [{ value: "+923331112222", type: "Mobile" }] });
  assert.ok(nameless.includes("N:;+923331112222;;;") && nameless.includes("FN:+923331112222"), "N and FN always present");

  // Country codes.
  assert.strictEqual(v.withCountryCode("0300 1234567", "+92"), "+923001234567");
  assert.strictEqual(v.withCountryCode("0300-1234567", "92"), "+923001234567");
  assert.strictEqual(v.withCountryCode("+44 20 7946 0958", "+92"), "+442079460958");
  assert.strictEqual(v.withCountryCode("0092 300 1234567", "+92"), "+923001234567");
  assert.strictEqual(v.withCountryCode("923001234567", "+92"), "+923001234567");
  assert.strictEqual(v.withCountryCode("3001234567", "+92"), "+923001234567");
  assert.strictEqual(v.withCountryCode("ext 12", "+92"), "ext 12", "Non-numbers untouched");
  assert.ok(v.isScientificNotation("9.23001E+11") && !v.isScientificNotation("923001234567"));

  // Column mapping from headers, and from values when there is no header.
  const headers = ["Customer Name", "Mobile No.", "WhatsApp", "E-mail", "City", "Company"];
  const rows = [["Ayesha Khan", "0300 1234567 / 0321 7654321", "0300 1234567", "ayesha@example.com", "Lahore", "Khan Traders"], ["", "", "", "", "", ""], ["Hira", "9.23001E+11", "", "", "", ""]];
  const map = v.guessMapping(headers, rows);
  assert.deepStrictEqual([map.fullName, map.phone1, map.phone2, map.email1, map.organization], [0, 1, 2, 3, 5]);
  const conv = v.rowsToContacts(rows, map, { countryCode: "+92" });
  assert.strictEqual(conv.contacts.length, 2);
  assert.strictEqual(conv.skippedEmpty, 1);
  assert.strictEqual(conv.damagedPhones, 1, "Excel-damaged number reported");
  assert.deepStrictEqual(conv.contacts[0].phones.map((p) => p.value), ["+923001234567", "+923217654321"], "Split cell, country code, duplicates merged");
  const noHeader = v.guessMapping(["Column 1", "Column 2", "Column 3"], [["Ali", "03001234567", "ali@example.com"], ["Sara", "03111234567", "sara@example.com"]]);
  assert.deepStrictEqual([noHeader.fullName, noHeader.phone1, noHeader.email1], [0, 1, 2]);
}
console.log("  ✓ vCard 2.1 quoted-printable, Apple labels, 4.0 URIs, folding, escaping, round trip, mapping and country codes verified.\n");

console.log("Test 26: Compare CSV pairs rows by key, whole row or position and reports changed cells");
{
  const c = await import("../src/lib/csv-compare.ts");
  const A = { headers: ["sku", "product", "price", "stock"], rows: [["A100", "Mouse", "24.99", "120"], ["A101", "Cable", "9.99", "300"], ["A102", "Stand", "39.00", "45"], ["A103", "Adapter", "14.50", "80"], ["", "No key", "1", "1"]] };
  const B = { headers: ["SKU ", "price", "Product", "stock", "supplier"], rows: [["A101", "8.99", "Cable", "300", "X"], ["A100", "24.99", "mouse", "95", "Y"], ["A103", "14.5", "Adapter", "80", "Y"], ["A105", "69", "Keyboard", "40", "Y"]] };

  const cols = c.matchColumns(A, B, true);
  assert.deepStrictEqual(cols.map((x) => [x.name, x.a, x.b]), [["SKU ", 0, 0], ["price", 2, 1], ["Product", 1, 2], ["stock", 3, 3], ["supplier", -1, 4]], "Columns matched by name in any order; file-2-only column kept");
  assert.strictEqual(c.suggestKeyColumn(A, B, cols), null, "Empty key in file 1 means sku is not a safe automatic key");
  const A2 = { headers: A.headers, rows: A.rows.slice(0, 4) };
  assert.strictEqual(c.suggestKeyColumn(A2, B, c.matchColumns(A2, B, true)), 0, "sku suggested when unique and filled in");

  const opts = { matchColumnsByName: true, rowMatching: "key", keyColumns: [0], ignoredColumns: [], ignoreCase: false, trimSpaces: true, numericEquality: false };
  const r = c.compareCSV(A, B, opts);
  assert.deepStrictEqual(r.counts, { same: 0, changed: 3, added: 1, removed: 2 });
  assert.deepStrictEqual(r.rows.slice(0, 4), [
    { status: "changed", a: 0, b: 1, changed: [2, 3] },
    { status: "changed", a: 1, b: 0, changed: [1] },
    { status: "removed", a: 2 },
    { status: "changed", a: 3, b: 2, changed: [1] },
  ], "Rows paired by key regardless of order; cells reported by column");
  assert.deepStrictEqual(r.emptyKeys, { a: 1, b: 0 }, "Row with empty key is never paired");
  assert.strictEqual(r.changedCells, 4);

  const loose = c.compareCSV(A, B, { ...opts, ignoreCase: true, numericEquality: true });
  assert.deepStrictEqual(loose.counts, { same: 1, changed: 2, added: 1, removed: 2 }, "Case and 14.50 = 14.5 options");
  const ignored = c.compareCSV(A, B, { ...opts, ignoredColumns: [3], ignoreCase: true, numericEquality: true });
  assert.strictEqual(ignored.counts.changed, 1, "Ignored stock column no longer counts as a change");

  const report = c.buildReportCSV(A, B, r, { delimiter: ",", formulaSafe: true, includeSame: false });
  assert.strictEqual(report.split("\r\n")[0], "change,row_in_file_1,row_in_file_2,changed_columns,\"SKU \",price,Product,stock,supplier");
  assert.ok(report.includes("changed,1,2,Product; stock,A100,24.99,mouse,95,Y"), "Report row uses file 2 values and names changed columns");
  assert.ok(report.includes("removed,3,,,A102,39.00,Stand,45,"), "Removed row uses file 1 values");
  assert.ok(report.includes("added,,4,,A105,69,Keyboard,40,Y"));
  const cells = c.buildCellChangesCSV(A, B, r, { delimiter: ";", formulaSafe: true, keyColumns: [0] }).split("\r\n");
  assert.deepStrictEqual(cells.slice(0, 3), ["\"SKU \";row_in_file_1;row_in_file_2;column;value_in_file_1;value_in_file_2", "A100;1;2;Product;Mouse;mouse", "A100;1;2;stock;120;95"]);

  // Whole rows in any order: multiset matching.
  const X = { headers: ["a", "b"], rows: [["1", "x"], ["2", "y"], ["1", "x"]] };
  const Y = { headers: ["b", "a"], rows: [["y", "2"], ["x", "1"], ["z", "3"]] };
  const content = c.compareCSV(X, Y, { ...opts, rowMatching: "content", keyColumns: [] });
  assert.deepStrictEqual(content.counts, { same: 2, changed: 0, added: 1, removed: 1 }, "Second copy of a duplicate row is reported as removed");

  // Row position, files without a header: columns by position.
  const P = { headers: ["Column 1", "Column 2"], rows: [["1", "a"], ["2", "b"]] };
  const Q = { headers: ["Column 1", "Column 2", "Column 3"], rows: [["1", "a", "z"], ["2", "c", ""], ["3", "d", ""]] };
  const pos = c.compareCSV(P, Q, { ...opts, matchColumnsByName: false, rowMatching: "position", keyColumns: [] });
  assert.deepStrictEqual(pos.rows, [{ status: "same", a: 0, b: 0 }, { status: "changed", a: 1, b: 1, changed: [1] }, { status: "added", b: 2 }]);

  // Duplicate keys are paired in order and reported.
  const D1 = { headers: ["id", "v"], rows: [["7", "a"], ["7", "b"]] };
  const D2 = { headers: ["id", "v"], rows: [["7", "a"], ["7", "c"]] };
  const dup = c.compareCSV(D1, D2, { ...opts, keyColumns: [0] });
  assert.deepStrictEqual([dup.counts.same, dup.counts.changed, dup.duplicateKeys.a, dup.duplicateKeys.b, dup.duplicateKeys.examples], [1, 1, 1, 1, ["7"]]);

  // Multi-column keys never collide by concatenation.
  const K1 = { headers: ["f", "l", "v"], rows: [["ab", "", "1"], ["a", "b", "2"]] };
  const K2 = { headers: ["f", "l", "v"], rows: [["a", "b", "2"], ["ab", "", "1"]] };
  assert.strictEqual(c.compareCSV(K1, K2, { ...opts, keyColumns: [0, 1] }).counts.same, 2);

  const big1 = { headers: ["id", "name", "qty"], rows: Array.from({ length: 200000 }, (_, i) => [String(i), `Item ${i}`, String(i % 97)]) };
  const big2 = { headers: ["qty", "id", "name"], rows: Array.from({ length: 200000 }, (_, i) => { const j = 199999 - i; return [String(j % 1000 === 0 ? 999 : j % 97), String(j + 10), `Item ${j + 10}`]; }) };
  const t0 = performance.now();
  const big = c.compareCSV(big1, big2, { ...opts, keyColumns: [1] }); // index 1 = "id" in file 2 column order
  const ms = performance.now() - t0;
  assert.deepStrictEqual([big.counts.removed, big.counts.added], [10, 10]);
  assert.ok(big.counts.changed > 0 && big.counts.same + big.counts.changed === 199990);
  assert.ok(ms < 3000, `200k × 200k rows compared in ${ms.toFixed(0)} ms`);
  console.log(`  (200k-row comparison: ${ms.toFixed(0)} ms)`);
}
console.log("  ✓ Column matching by name, key/whole-row/position matching, options, reports and 200k-row speed verified.\n");

console.log("Test 27: CSV to SQL writes dialect-correct INSERTs, types and escaping");
{
  const q = await import("../src/lib/csv-sql.ts");
  const header = ["Customer ID", "Full Name", "Postcode", "Balance", "Active", "Signed Up", "Note"];
  const rows = [
    ["1001", "Ayesha Khan", "54000", "1250.50", "true", "2024-01-31", "O'Brien \\ path"],
    ["1002", "Łukasz", "02134", "0", "FALSE", "2024-02-29 10:30:00", ""],
    ["3000000000", "Chen, Wei", "20121", "", "true", "2024-03-01", "two\nlines"],
  ];
  const base = { table: "customers", include: [0, 1, 2, 3, 4, 5, 6], rowsPerStatement: 100, createTable: true, emptyAsNull: true, transaction: false, detectTypes: true };
  const cols = q.analyzeColumns(header, rows, true);
  assert.deepStrictEqual(cols.map((c) => c.kind), ["integer", "text", "text", "decimal", "boolean", "datetime", "text"], "Leading-zero postcodes are text; date + datetime widen to datetime");
  assert.ok(cols[0].big && cols[3].precision === 6 && cols[3].scale === 2);
  assert.deepStrictEqual(q.cleanNames(header, "mysql"), ["customer_id", "full_name", "postcode", "balance", "active", "signed_up", "note"]);
  assert.deepStrictEqual(q.cleanNames(["a b", "A-B", "1st"], "oracle"), ["A_B", "A_B_2", "C_1ST"]);

  const my = q.buildSQL(rows, { ...base, dialect: "mysql", columns: q.cleanNames(header, "mysql") }).chunks.join("");
  assert.ok(my.includes("\n) DEFAULT CHARSET=utf8mb4;"), "MySQL tables are created as utf8mb4");
  assert.ok(my.includes("`customer_id` BIGINT") && my.includes("`postcode` VARCHAR(50)") && my.includes("`balance` DECIMAL(6, 2)") && my.includes("`signed_up` DATETIME"));
  assert.ok(my.includes("(1001, 'Ayesha Khan', '54000', 1250.50, 1, '2024-01-31', 'O''Brien \\\\ path')"), "MySQL doubles quotes and backslashes");
  assert.ok(my.includes("(1002, 'Łukasz', '02134', 0, 0, '2024-02-29 10:30:00', NULL)"), "Empty cell is NULL; leading zero kept");
  assert.ok(my.includes("'two\nlines'"));

  const pg = q.buildSQL(rows, { ...base, dialect: "postgresql", columns: q.cleanNames(header, "postgresql") }).chunks.join("");
  assert.ok(pg.includes('"active" BOOLEAN') && pg.includes("TRUE, '2024-01-31', 'O''Brien \\ path')"), "PostgreSQL: TRUE/FALSE, backslash not doubled");
  const ms = q.buildSQL(rows, { ...base, dialect: "sqlserver", columns: q.cleanNames(header, "sqlserver") }).chunks.join("");
  assert.ok(ms.includes("[full_name] NVARCHAR(50)") && ms.includes("N'Łukasz'") && ms.includes("'Ayesha Khan'") && ms.includes("[active] BIT"), "SQL Server: brackets, N'' only for non-ASCII");
  const ora = q.buildSQL(rows, { ...base, dialect: "oracle", columns: q.cleanNames(header, "oracle"), rowsPerStatement: 2 });
  const oraSQL = ora.chunks.join("");
  assert.ok(oraSQL.includes('INSERT ALL\n  INTO "customers" ("CUSTOMER_ID"') && oraSQL.includes("SELECT 1 FROM DUAL;"), "Oracle multi-row uses INSERT ALL");
  assert.ok(oraSQL.includes("TIMESTAMP '2024-01-31 00:00:00'") && oraSQL.includes("TIMESTAMP '2024-02-29 10:30:00'"), "Oracle timestamp literals have a time");
  assert.strictEqual(ora.statements, 2);

  // Batch limits per dialect, transaction, single-row statements.
  const many = Array.from({ length: 2500 }, (_, i) => [String(i), `n${i}`]);
  const sq = q.buildSQL(many, { ...base, include: [0, 1], columns: ["id", "name"], dialect: "sqlite", rowsPerStatement: 1000, createTable: false });
  assert.strictEqual(sq.statements, 5, "SQLite capped at 500 rows per INSERT");
  const one = q.buildSQL(many.slice(0, 2), { ...base, include: [0, 1], columns: ["id", "name"], dialect: "mysql", rowsPerStatement: 1, createTable: false, transaction: true }).chunks.join("");
  assert.strictEqual(one, "START TRANSACTION;\n\nINSERT INTO `customers` (`id`, `name`) VALUES (0, 'n0');\nINSERT INTO `customers` (`id`, `name`) VALUES (1, 'n1');\n\nCOMMIT;\n");

  // Identifier quoting escapes the quote character; schema.table is split.
  assert.strictEqual(q.quoteIdentifier("we`ird", "mysql"), "`we``ird`");
  assert.strictEqual(q.quoteIdentifier("a]b", "sqlserver"), "[a]]b]");
  assert.strictEqual(q.quoteTableName("sales.orders", "postgresql"), '"sales"."orders"');

  // Types off: everything quoted; empty as '' when NULL is off; invalid dates stay text; 19-digit numbers stay text.
  const plain = q.buildSQL([["007", "2024-02-30", "1234567890123456789", ""]], { ...base, include: [0, 1, 2, 3], columns: ["a", "b", "c", "d"], dialect: "mysql", createTable: false, emptyAsNull: false });
  assert.ok(plain.chunks.join("").includes("('007', '2024-02-30', '1234567890123456789', '')"));
  const off = q.buildSQL([["1", "true"]], { ...base, include: [0, 1], columns: ["a", "b"], dialect: "mysql", createTable: false, detectTypes: false });
  assert.ok(off.chunks.join("").includes("('1', 'true')"));
  assert.strictEqual(q.tableNameFromFile("Customers 2024.csv"), "customers_2024");

  const big = Array.from({ length: 200000 }, (_, i) => [String(i), `Name ${i}`, `user${i}@example.com`, (i % 1000) / 10 + "", i % 2 ? "true" : "false"]);
  const t0 = performance.now();
  const bigSQL = q.buildSQL(big, { ...base, include: [0, 1, 2, 3, 4], columns: ["id", "name", "email", "score", "active"], dialect: "postgresql" });
  const ms2 = performance.now() - t0;
  assert.strictEqual(bigSQL.statements, 2000);
  assert.ok(ms2 < 3000, `200k rows to SQL in ${ms2.toFixed(0)} ms`);
  console.log(`  (200k rows to SQL: ${ms2.toFixed(0)} ms, ${(bigSQL.bytes / 1e6).toFixed(1)} MB)`);
}
console.log("  ✓ Types, leading zeros, escaping per dialect, Oracle INSERT ALL, batch limits, transactions and 200k-row speed verified.\n");

console.log("🎉 ALL FUNCTIONAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
