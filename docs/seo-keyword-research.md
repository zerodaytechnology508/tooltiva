# Tooltiva phase-one keyword and SERP research

**Research date:** 2026-10-10
**Market and language:** English-language web results; no country-specific volume target was selected.
**Method:** Manual query-based web searches and review of the visible competitor pages listed below. Search snippets and page content support qualitative intent and feature observations only. They do not provide keyword volumes, organic difficulty, CPC, or rank tracking.

## Metric limits

No account-authenticated keyword database or Google Ads Keyword Planner export was available for this research. I therefore report no volume, difficulty, CPC, or traffic numbers. Google documents average monthly searches as dependent on date range, location, and Search Network settings; access to Keyword Planner ideas requires Ads account setup and billing information. Any future metric collection should record those settings and export date. Google also defines its Competition metric as advertiser competition, so it must not be presented as organic SEO difficulty.

Sources: [Google Ads Help: Refine keyword ideas](https://support.google.com/google-ads/answer/6325025?hl=en), [Google Ads Help: Keyword Planner metrics](https://support.google.com/google-ads/answer/3022575?hl=en-2).

## Search intent and keyword map

| Tool page | Recommended primary query | Related queries to cover naturally | Search intent | Evidence and opportunity |
| --- | --- | --- | --- | --- |
| `/tools/csv-delimiter-converter/` | CSV delimiter converter | change CSV delimiter; change CSV separator online; convert comma separated CSV to semicolon; semicolon to comma CSV; TSV to CSV; custom CSV delimiter | User has a delimited text file and needs the columns interpreted correctly by another program, often a spreadsheet or importer. | Results use direct action language such as “change CSV delimiter” and explain the Excel regional-separator problem. Tooltiva already provides automatic detection, quote-aware conversion, preview, and row warnings. A custom one-character input/output option is now implemented. |
| `/tools/csv-to-json/` | CSV to JSON converter | JSON to CSV converter; convert CSV to JSON online; CSV to JSON with headers; CSV to array of objects; CSV to 2D array | User wants to transform tabular text into a program-ready structure, or flatten JSON for spreadsheet use. | Reviewed pages explicitly describe header rows, both conversion directions, delimiters, quoted values, and browser processing. Tooltiva already covers two-way conversion and type inference; its H1 names both directions. The shipped UI exposes array-of-objects and 2D-array formats, and public FAQ copy now matches those controls. |
| `/tools/json-formatter/` | JSON formatter | JSON validator online; format JSON online; JSON beautifier; validate JSON; fix invalid JSON; JSON error line and column | User wants to check syntax and make valid JSON readable, or understand why malformed input fails. | Results combine formatting, validation, and often error-location tools. Tooltiva can describe its explicit repair log and undo control, but should be precise that repair handles its listed syntax cases and does not validate a schema or guarantee intended data semantics. |

These are qualitative topic recommendations, not measured demand rankings. The primary terms reflect the tool’s task and existing page architecture. Treat modifier priorities as hypotheses until validated against Search Console impressions or a configured keyword dataset.

## Competitor observations

Observations below describe the pages inspected on the research date; they are not claims about ranking position, traffic, or product quality.

### CSV delimiter conversion

- [ExcelTutorial delimiter converter](https://www.exceltutorial.net/delimiter-converter/) presents comma, tab, semicolon, and custom separators, browser processing, and the Excel single-column/regional-separator use case. It also explains that CSV conversion is not simple search-and-replace and names limitations such as workbook formatting.
- [ConversionTab](https://conversiontab.com/csv-delimiter) foregrounds comma/semicolon/tab/pipe conversion, auto-detection, file input, download, first-row headers, and line-ending controls.
- [W3Schools Change CSV Separator](https://www.w3schools.com/tools/tool_csv_separator.php) focuses on separator switching and explains preserving commas inside quoted fields and the semicolon/decimal-comma Excel use case.

**Observed opportunity:** Give the delimiter page a concrete before/after example for semicolon-to-comma and comma-to-semicolon, show how quoted commas and line breaks are preserved, and explain what the preview warnings mean. Avoid promising spreadsheet-workbook conversion; the product handles delimited text.

### CSV and JSON conversion

- [Don’s Tools CSV/JSON converter](https://www.donstools.com/csv-json) presents both directions, comma/semicolon/tab, header handling, pretty JSON, quoted multiline fields, and local processing.
- [The JSON Converter CSV page](https://thejsonconverter.com/csv-to-json/) emphasizes a header row, CSV-to-object-array conversion, copy/download, and browser-only operation.
- [freecsv2json.app](https://www.freecsv2json.app/) describes live bidirectional conversion, RFC 4180 quoted values, multiple delimiters, custom delimiter support, and array/object output choices.

**Observed opportunity:** Make the two directions visible in the title, H1, and controls. Explain type inference with an example because coercing identifiers such as `00123` can be undesirable; keep the preserve-as-strings control prominent. Add a selectable keyed-object option only if the UI is completed and its duplicate/missing key behavior is explained.

### JSON formatting and validation

- [JSONLint formatter](https://jsonlint.com/json-formatter) combines validate, prettify, and compress actions and states that formatting runs in the browser.
- [JSONFYI](https://www.jsonfyi.com/) advertises formatting, validation, line/column errors, lint warnings, tree navigation, and local processing.
- [JSON Formatter Studio validator](https://www.jsonformatterstudio.com/json-validator/) describes validation, line/column reporting, and a repair function with repair reporting.

**Observed opportunity:** Explain the repair scope and show a small malformed-to-valid example with its repair log. Position undo and transparent modifications as useful behaviors, but do not claim these are unique to Tooltiva based on this small SERP sample.

## Existing page review and targeted changes

- The three tools have dedicated routes, canonical URLs on `https://tooltiva.net`, title/description metadata, internal cross-links, and original explanatory sections. The generated sitemap and robots route use the intended domain.
- The delimiter page already targets the task phrase and teaches the spreadsheet regional-separator use case. The custom separator control was incomplete; it is now available for both source and target separators.
- The CSV/JSON page metadata names both directions, but its H1 previously relied on a symbolic arrow. The H1 now says “CSV to JSON and JSON to CSV Converter,” making the supported tasks explicit to readers and search systems.
- The JSON page covers formatting, validation, and repair. Keep statements about repair exact and preserve a clear repair log/undo flow.
- Tooltiva’s browser-local processing is a useful trust attribute, but reviewed competitors also claim local processing. It is a product requirement and supporting message, not an evidenced unique SEO advantage.

## Risks and next evidence to collect

1. Search volume, organic difficulty, and CPC remain unmeasured. Do not substitute Google Ads advertiser competition for SEO difficulty or use numbers from unsourced SEO roundups.
2. The search sample was not geotargeted and may differ by country, language, device, and personalization. Choose Tooltiva’s target country/language before collecting comparable volumes.
3. The CSV-to-JSON FAQ previously described keyed-object output even though the UI does not expose it; that unsupported public claim has been removed.
4. Competitor observations come from visible pages, not technical audits, traffic data, or controlled rank tracking. No competitor weakness is asserted.
5. After launch, validate query impressions, clicks, and page engagement in Search Console; use those observations to revise the qualitative map.

## Search query sample

Manual searches reviewed on 2026-10-10 included “CSV delimiter converter change separator online tool,” “CSV to JSON converter online free JSON to CSV converter,” “JSON formatter online validator,” “CSV delimiter converter online tool,” and “JSON formatter line and column.” Search-result pages and competitor sources are recorded above. The review is a small qualitative sample, not a reproducible rank/volume study.
