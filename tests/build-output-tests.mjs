// Checks the static export in out/ after `npm run build`.
// Every page must be indexable and complete: one H1, a unique title and
// description, a canonical URL that matches its path, full Open Graph and
// Twitter tags, an icon, valid JSON-LD, and internal links that resolve.
import assert from "node:assert";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../out/", import.meta.url));
const SITE = "https://tooltiva.net";

if (!existsSync(OUT)) {
  console.error("out/ not found. Run `npm run build` first.");
  process.exit(1);
}

function htmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "_next") continue;
      files.push(...htmlFiles(full));
    } else if (entry === "index.html") {
      files.push(full);
    }
  }
  return files;
}

const pages = htmlFiles(OUT).map((file) => {
  const rel = relative(OUT, file).split(sep).join("/");
  const path = "/" + rel.replace(/index\.html$/, "");
  return { file, path, html: readFileSync(file, "utf8") };
});

const attr = (html, re) => {
  const m = html.match(re);
  return m ? m[1] : null;
};
const meta = (html, key) =>
  attr(html, new RegExp(`<meta[^>]+(?:name|property)="${key.replace(":", "\\:")}"[^>]+content="([^"]*)"`));

const titles = new Map();
const descriptions = new Map();
let problems = 0;
const fail = (page, msg) => {
  problems++;
  console.error(`  ✗ ${page.path}: ${msg}`);
};

console.log(`Checking ${pages.length} pages in out/ ...`);
for (const page of pages) {
  const { html, path } = page;
  if (!/<html[^>]+lang="en"/.test(html)) fail(page, 'missing <html lang="en">');

  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(page, `expected 1 <h1>, found ${h1s.length}`);

  const title = attr(html, /<title>([^<]+)<\/title>/);
  if (!title) fail(page, "missing <title>");
  else if (titles.has(title)) fail(page, `duplicate title also on ${titles.get(title)}`);
  else titles.set(title, path);

  const description = meta(html, "description");
  if (!description || description.length < 50) fail(page, "missing or too-short meta description");
  else if (descriptions.has(description)) fail(page, `duplicate description also on ${descriptions.get(description)}`);
  else descriptions.set(description, path);

  // The 404 page must not be indexed; every other page needs a self-canonical.
  const isNotFound = path === "/404/";
  if (isNotFound) {
    if (!/<meta name="robots" content="noindex/.test(html)) fail(page, "404 page is not marked noindex");
  } else {
    const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
    if (canonical !== SITE + path) fail(page, `canonical is ${canonical}, expected ${SITE + path}`);
  }

  for (const key of ["og:title", "og:description", "og:url", "og:site_name", "og:image", "og:type", "twitter:card", "twitter:image"]) {
    if (!isNotFound && !meta(html, key)) fail(page, `missing ${key}`);
  }
  if (!isNotFound && meta(html, "og:url") !== SITE + path) fail(page, "og:url does not match the canonical URL");
  if (!/<link rel="icon"[^>]+href="\/(icon\.png|favicon\.ico)/.test(html)) fail(page, "missing favicon link");
  if (html.includes('href="/#tools"')) fail(page, "links to the /#tools fragment instead of a real page");

  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)) {
    try {
      JSON.parse(json);
    } catch {
      fail(page, "invalid JSON-LD");
    }
  }

  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
    if (href.startsWith("/_next/")) continue;
    const target = join(OUT, href);
    const ok = href.endsWith("/") ? existsSync(join(target, "index.html")) : existsSync(target);
    if (!ok) fail(page, `broken internal link ${href}`);
  }
}

// Every page except the 404 is in the sitemap, and every sitemap URL exists.
const sitemap = readFileSync(join(OUT, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const page of pages) {
  if (page.path === "/404/" || page.path.startsWith("/_not-found")) continue;
  if (!sitemapUrls.includes(SITE + page.path)) fail(page, "not listed in sitemap.xml");
}
for (const url of sitemapUrls) {
  const path = url.replace(SITE, "");
  if (!existsSync(join(OUT, path, "index.html"))) {
    problems++;
    console.error(`  ✗ sitemap lists ${url}, but no page was built`);
  }
}

for (const asset of ["icon.png", "apple-icon.png", "favicon.ico", "og-default.png", "robots.txt"]) {
  if (!existsSync(join(OUT, asset))) {
    problems++;
    console.error(`  ✗ missing ${asset} in out/`);
  }
}

assert.strictEqual(problems, 0, `${problems} build-output problem(s) found`);
console.log(`✓ ${pages.length} pages: one H1, unique titles and descriptions, canonical, social tags, icon, JSON-LD and internal links all valid.`);
