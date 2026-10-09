import assert from "node:assert";
import Papa from "papaparse";
import { detectDelimiter, analyzeCSV, convertCSVDelimiter } from "../src/lib/csv-utils.ts";
import { validateJSON, repairJSON, csvToJSON, jsonToCSV } from "../src/lib/json-utils.ts";

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

console.log("🎉 ALL FUNCTIONAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
