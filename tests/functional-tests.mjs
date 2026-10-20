import assert from "node:assert";
import Papa from "papaparse";
import { detectDelimiter, analyzeCSV, convertCSVDelimiter } from "../src/lib/csv-utils.ts";
import { validateJSON, repairJSON, csvToJSON, jsonToCSV } from "../src/lib/json-utils.ts";
import {
  applyAnalyticsConsent,
  canLoadAnalytics,
  canTrackAnalytics,
  CONSENT_STORAGE_KEY,
  persistConsentChoice,
  preferenceChoice,
  readConsentChoice,
} from "../src/lib/analytics-consent.ts";

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
assert.strictEqual(analysis.rowCount, 4, "Row count includes the header row");
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

console.log("🎉 ALL FUNCTIONAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
