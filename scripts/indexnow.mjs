/**
 * Tell IndexNow search engines (Bing, Yandex, Seznam, Naver …) that pages changed.
 * Bing's index also feeds ChatGPT search and Copilot.
 *
 * Usage, after the site is deployed:
 *   node scripts/indexnow.mjs                 # every URL in the live sitemap
 *   node scripts/indexnow.mjs /tools/csv-viewer/ /guides/open-vcf-file/   # only these paths
 *
 * The key file public/<key>.txt must be live at https://tooltiva.net/<key>.txt first.
 * Submitting tells the engines to recrawl; it does not guarantee indexing or ranking.
 */
const HOST = "tooltiva.net";
const KEY = "a0c69a31bd1170c55055a1f2ace784b7";
const SITE = `https://${HOST}`;

const paths = process.argv.slice(2);
let urls;
if (paths.length) {
  urls = paths.map((p) => new URL(p, SITE).toString());
} else {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

const keyCheck = await fetch(`${SITE}/${KEY}.txt`);
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
  console.error(`The key file ${SITE}/${KEY}.txt is not live yet. Deploy first, then run this again.`);
  process.exit(1);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: HTTP ${res.status} for ${urls.length} URL(s). 200 or 202 means the list was accepted.`);
if (!res.ok && res.status !== 202) console.log(await res.text());
