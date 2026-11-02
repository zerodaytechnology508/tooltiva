/**
 * After `next build`: write a Markdown version of every page in the sitemap, plus
 * /llms.txt and /sitemap.md, from the exported HTML in out/.
 *
 * - out/<page>/index.md: the page's main content (no header, footer, menus or the
 *   interactive tool UI), with absolute links and a line naming the source page.
 *   Cloudflare serves it with an HTTP canonical pointing to the HTML page (public/_headers).
 * - out/sitemap.md: every page, grouped by topic, with its Markdown and HTML URLs.
 * - out/llms.txt: a short guide to the site in the llms.txt format (https://llmstxt.org/).
 * - Discovery comments are appended to out/robots.txt and out/sitemap.xml; their
 *   records and URL entries are left unchanged.
 *
 * Because it reads the built HTML, the Markdown always matches the deployed pages.
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import { NodeHtmlMarkdown } from "node-html-markdown";

const OUT = path.resolve(process.argv[2] ?? "out");
const SITE = "https://tooltiva.net";
const LLMS = `${SITE}/llms.txt`;
const MAP = `${SITE}/sitemap.md`;

const nhm = new NodeHtmlMarkdown({ bulletMarker: "-", codeBlockStyle: "fenced", maxConsecutiveNewlines: 2 });

/** Pages listed in the XML sitemap, with their lastmod dates. */
function readSitemap() {
  const xml = fs.readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    url: /<loc>(.*?)<\/loc>/.exec(m[1])[1],
    lastmod: /<lastmod>(.*?)<\/lastmod>/.exec(m[1])?.[1]?.slice(0, 10) ?? null,
  }));
}

const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");

/** Main content of an exported page as Markdown, plus its title and description. */
function pageToMarkdown(htmlFile, pageUrl) {
  const root = parse(fs.readFileSync(htmlFile, "utf8"));
  const title = text(root.querySelector("title"));
  const description = root.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
  const h1 = text(root.querySelector("h1"));
  const main = root.querySelector("main");
  if (!main) throw new Error(`No <main> in ${htmlFile}`);

  // Drop site chrome, the interactive tool and decorative icons.
  for (const sel of ["[data-md-skip]", "nav", "script", "style", "noscript", "template", "svg", "form", "input", "select", "textarea", '[aria-hidden="true"]', ".sr-only"]) {
    for (const el of main.querySelectorAll(sel)) el.remove();
  }
  // FAQ questions are buttons inside headings: keep their text. Other buttons are controls.
  for (const btn of main.querySelectorAll("button")) {
    const inHeading = /^H[1-6]$/.test(btn.parentNode?.tagName ?? "");
    if (inHeading) btn.replaceWith(text(btn));
    else btn.remove();
  }
  // Card links (a title, a description and "Open tool" in one <a>): "[Title](url): description".
  for (const a of main.querySelectorAll("a[href]")) {
    const parts = a.childNodes.filter((n) => n.nodeType === 1).map(text).filter((t) => t && t !== "Open tool");
    if (parts.length >= 2) {
      const link = parse("<a></a>").firstChild;
      link.setAttribute("href", a.getAttribute("href"));
      link.set_content(parts[0]);
      a.replaceWith(`${link.toString()}: ${parts.slice(1).join(" ")}`);
    }
  }
  // Key-value tables (a header cell per row, such as "at a glance"): a bullet list reads better.
  for (const table of main.querySelectorAll("table")) {
    const rows = table.querySelectorAll("tr");
    if (rows.length && rows.every((tr) => tr.querySelector('th[scope="row"]') && tr.querySelectorAll("td").length === 1)) {
      const items = rows.map((tr) => `<li><strong>${text(tr.querySelector("th"))}:</strong> ${tr.querySelector("td").innerHTML}</li>`);
      table.replaceWith(`<ul>${items.join("")}</ul>`);
    }
  }
  // Absolute links, so the Markdown works wherever it is read.
  for (const a of main.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (href.startsWith("/") || href.startsWith("#")) a.setAttribute("href", new URL(href, pageUrl).toString());
  }
  for (const img of main.querySelectorAll("img[src]")) {
    img.setAttribute("src", new URL(img.getAttribute("src"), pageUrl).toString());
  }

  let md = nhm.translate(main.innerHTML).trim();
  md = md.replace(/\n{3,}/g, "\n\n");
  return { title, description, h1, md };
}

const GROUPS = [
  { id: "data", title: "CSV, Excel, JSON and contact tools", test: (p) => p.startsWith("/tools/") },
  { id: "image", title: "Photo and signature tools", test: (p) => p.startsWith("/image-tools/") },
  { id: "guides", title: "Guides", test: (p) => p.startsWith("/guides/") },
  { id: "site", title: "About Tooltiva and policies", test: () => true },
];

const pages = [];
for (const { url, lastmod } of readSitemap()) {
  const pathname = new URL(url).pathname;
  const htmlFile = path.join(OUT, pathname, "index.html");
  const { title, description, h1, md } = pageToMarkdown(htmlFile, url);
  const mdUrl = `${url}index.md`;
  const source = [`Source page: ${url}`, "Language: English", lastmod ? `Last updated: ${lastmod}` : null, "Publisher: Tooltiva, by CodingTangent"]
    .filter(Boolean)
    .join(" · ");
  // Put the source line under the H1 when the content starts with one.
  const body = md.startsWith("# ") ? md.replace(/^(# .*)\n/, `$1\n\n> ${source}\n`) : `# ${h1 || title}\n\n> ${source}\n\n${md}`;
  fs.writeFileSync(path.join(OUT, pathname, "index.md"), `${body.trim()}\n`, "utf8");
  pages.push({ url, mdUrl, pathname, title, description, h1: h1 || title, group: GROUPS.find((g) => g.test(pathname)).id });
}

// Hubs first within each group, then the order of the sitemap.
const isHub = (p) => ["/", "/tools/", "/image-tools/", "/guides/"].includes(p.pathname);
const grouped = GROUPS.map((g) => ({ ...g, pages: pages.filter((p) => p.group === g.id).sort((a, b) => Number(isHub(b)) - Number(isHub(a))) }));
const linkName = (p) => p.h1.replace(/[[\]]/g, "");

const today = new Date().toISOString().slice(0, 10);
const sitemapMd = [
  "# Tooltiva content map",
  "",
  `Every page on tooltiva.net with its Markdown version, grouped by topic. All pages are in English. Generated ${today}.`,
  "",
  `Start here: [llms.txt](${LLMS}) describes the site in a few lines.`,
  "",
  ...grouped.flatMap((g) => [
    `## ${g.title}`,
    "",
    ...g.pages.map((p) => `- [${linkName(p)}](${p.mdUrl}): ${p.description} (web page: ${p.url})`),
    "",
  ]),
].join("\n");
fs.writeFileSync(path.join(OUT, "sitemap.md"), sitemapMd, "utf8");

const section = (id) => grouped.find((g) => g.id === id).pages.map((p) => `- [${linkName(p)}](${p.mdUrl}): ${p.description}`);
const llms = [
  "# Tooltiva",
  "",
  "> Free online tools that run in the browser: view, split, merge, compare and convert CSV, Excel and JSON files, convert contacts between spreadsheets and VCF, and resize photos and signatures to an exact size in KB for online forms. Files are processed on the user's own device and are not uploaded. Tooltiva is made by CodingTangent, a studio in Lahore, Pakistan.",
  "",
  `If you are an LLM looking for site information, use the content map at ${MAP} to locate the relevant topic and its linked Markdown answer. Use that document's sources and canonical page; if the requested information is absent, report that gap.`,
  "",
  "Every page has a Markdown version at its address followed by index.md. Facts about each tool (what it opens, what it produces, limits) are in the \"at a glance\" table near the top of its page.",
  "",
  "## Tools for CSV, Excel, JSON and contacts",
  "",
  ...section("data"),
  "",
  "## Photo and signature tools",
  "",
  ...section("image"),
  "",
  "## Guides",
  "",
  ...section("guides"),
  "",
  "## Optional",
  "",
  `- [Content map](${MAP}): every page with its Markdown and web addresses`,
  ...section("site"),
  "",
].join("\n");
fs.writeFileSync(path.join(OUT, "llms.txt"), llms, "utf8");

// Discovery hints: comments only, so robots records and sitemap entries stay the same.
const robotsFile = path.join(OUT, "robots.txt");
const robots = fs.readFileSync(robotsFile, "utf8");
if (!robots.includes(LLMS)) {
  fs.writeFileSync(
    robotsFile,
    `${robots.trimEnd()}\n\n# Markdown versions of every page for readers and LLMs: ${LLMS}\n# Content map in Markdown: ${MAP}\n`,
    "utf8"
  );
}
const sitemapFile = path.join(OUT, "sitemap.xml");
const xml = fs.readFileSync(sitemapFile, "utf8");
if (!xml.includes(LLMS)) {
  fs.writeFileSync(
    sitemapFile,
    xml.replace(/(<urlset[^>]*>)/, `$1\n<!-- Markdown versions of these pages are listed in ${LLMS} and ${MAP} -->`),
    "utf8"
  );
}

console.log(`Markdown: ${pages.length} pages, llms.txt and sitemap.md written to ${OUT}`);
