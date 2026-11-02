import type { ToolMeta } from "./types";
import type { ToolFact } from "./tool-facts";
import type { ResizePresetId } from "@/components/tools/ResizeImageClient";

/**
 * Landing pages for the most-searched file sizes ("resize image to 20 KB" …).
 * Each one opens the Resize Image to KB tool on its preset and adds what is specific
 * to that size: results measured with the tool itself, typical uses, tips and FAQs.
 *
 * The "tested" rows come from running this site's resizer in Chromium on real photos
 * (see .notes/seo-audit-2026-11/evidence/kb_*_results.json). Re-run the tests and update
 * the rows if the resizing logic in src/lib/image-size.ts changes.
 */
export interface KbTestRow {
  /** What was tested, e.g. "10-megapixel camera photo, 3,888 × 2,592 px". */
  input: string;
  /** What the tool produced, e.g. "19.2 KB · 653 × 435 px · quality 51%". */
  result: string;
}

export interface KbSizePage extends ToolMeta {
  /** Preset the tool opens on. */
  presetId: ResizePresetId;
  /** "20 KB", "20–50 KB" */
  sizeLabel: string;
  /** Lead-in sentence for the tested-results table. */
  testedIntro: string;
  tested: KbTestRow[];
  /** Results at exact pixel sizes that forms ask for (optional). */
  pixelTests?: KbTestRow[];
  /** When forms and sites ask for this size. */
  uses: string[];
  tips: string[];
  facts: ToolFact[];
}

const PORTRAIT = "Head-and-shoulders portrait, 512 × 600 px";
const CITY = "City photo, 1,142 × 806 px";
const CAMERA = "10-megapixel camera photo, 3,888 × 2,592 px";
const DOCUMENT = "Photo of a newspaper page, 818 × 1,125 px";

const PRIVACY_FAQ = {
  question: "Is my photo uploaded?",
  answer:
    "No. The photo is resized by your browser on your own phone or computer and never leaves it. Hidden details such as GPS location and camera model are removed from the result.",
};

const common = {
  category: "Image" as const,
  icon: "ImageDown",
  related: ["resize-image-to-kb", "signature-resizer"],
  lastUpdated: "2026-11-03",
};

export const KB_SIZE_PAGES: KbSizePage[] = [
  {
    ...common,
    id: "resize-image-to-20kb",
    slug: "resize-image-to-20kb",
    presetId: "20kb",
    sizeLabel: "20 KB",
    title: "Resize Image to 20 KB",
    navLabel: "20 KB",
    pageTitle: "Resize Image to 20KB Online – Compress Photo to 20 KB",
    h1: "Resize Image to 20 KB",
    intro:
      "Reduce a photo or JPG to under 20 KB for an online form. The tool finds the best quality and size that fit and shows the result before you download. Your photo stays on your device.",
    badgeTitle: "Resize Image to 20 KB",
    shortDescription: "Compress a photo or JPG to under 20 KB for online forms, without uploading it.",
    metaDescription:
      "Resize an image to 20 KB online: compress a photo or JPG to under 20 KB for job and exam forms, with exact pixels if needed. Free, works on phones, no upload.",
    primaryKeyword: "resize image to 20kb",
    secondaryKeywords: ["compress image to 20kb", "reduce photo size to 20kb", "jpg to 20kb", "20kb photo size in pixels"],
    canonicalUrl: "https://tooltiva.net/image-tools/resize-image-to-20kb/",
    testedIntro:
      "We ran four real photos through this page's tool with Under 20 KB selected. Large photos lose pixels to fit; quality stays at 50% or more.",
    tested: [
      { input: PORTRAIT, result: "19.4 KB · 399 × 468 px · quality 51%" },
      { input: DOCUMENT, result: "19.4 KB · 324 × 446 px · quality 50%" },
      { input: CITY, result: "19.5 KB · 456 × 322 px · quality 51%" },
      { input: CAMERA, result: "19.2 KB · 653 × 435 px · quality 51%" },
    ],
    pixelTests: [
      { input: "200 × 230 px (common passport-size request)", result: "17.9 KB · quality 93%" },
      { input: "276 × 354 px (3.5 × 4.5 cm at 200 DPI)", result: "19.2 KB · quality 78%" },
      { input: "413 × 531 px (3.5 × 4.5 cm at 300 DPI)", result: "19.4 KB · quality 42%, visibly compressed" },
    ],
    uses: [
      "Passport-size photos on job, exam and admission forms with a 20 KB limit.",
      "Signatures, when the form asks for under 20 KB. The Signature Resizer also trims the paper and makes it white.",
      "Small profile pictures on government and school portals.",
    ],
    tips: [
      "Crop to head and shoulders first, so the 20 KB goes to the face rather than the background.",
      "Start from the original photo, not a screenshot or a copy sent through WhatsApp, which is already blurrier.",
      "A plain, light background takes fewer bytes than a busy one, so the face stays sharper.",
      "If the form gives pixels, enter them: 20 KB is easy at 200 × 230 px but tight at 413 × 531 px.",
    ],
    facts: [
      { label: "Target", value: "Under 20 KB: at most 20,000 bytes, so it passes whether the form counts 1,000 or 1,024 bytes per KB" },
      { label: "Typical result", value: "Large photos come out about 320–650 px wide at 50%+ JPEG quality; 200 × 230 px keeps 93% quality" },
      { label: "Output", value: "JPG (JPEG), with location and camera details removed" },
    ],
    faqs: [
      {
        question: "How do I resize an image to 20 KB?",
        answer:
          "Choose the photo; Under 20 KB is already selected. The tool uses the highest JPEG quality that fits and, if the photo is still too big at 50% quality, reduces its width and height. Check the preview and the size, then tap Download JPG.",
      },
      {
        question: "What is 20 KB in pixels?",
        answer:
          "There is no fixed pixel size, because it depends on how much detail the photo has. In our tests, photos came out between about 320 × 450 and 650 × 435 pixels at just under 20 KB. A passport-size photo of 200 × 230 pixels fits at 93% JPEG quality.",
      },
      {
        question: "Why is my file 19.4 KB and not exactly 20 KB?",
        answer:
          "JPEG sizes move in steps, so the tool keeps the best version under the limit. It treats 20 KB as 20,000 bytes so the file passes whether the form uses 1,000 or 1,024 bytes per KB. Sizes are shown as Windows shows them (1 KB = 1,024 bytes), so 19.4 KB is about 19,900 bytes.",
      },
      {
        question: "Will a 20 KB photo look blurry?",
        answer:
          "At passport size it looks fine. A large photo has to lose pixels to fit, so the tool scales it to roughly 320–650 pixels wide and keeps JPEG quality at 50% or more, which keeps a face clear on a form. Cropping to the face first gives the sharpest result.",
      },
      {
        question: "The form says between 10 KB and 20 KB. Which option do I choose?",
        answer:
          "Choose 10–20 KB in the size list. The result then lands inside that range; if the photo is too small, the tool raises the quality until it reaches 10 KB.",
      },
      PRIVACY_FAQ,
    ],
  },
  {
    ...common,
    id: "resize-image-to-50kb",
    slug: "resize-image-to-50kb",
    presetId: "50kb",
    sizeLabel: "50 KB",
    title: "Resize Image to 50 KB",
    navLabel: "50 KB",
    pageTitle: "Resize Image to 50KB Online – Compress Photo to 50 KB",
    h1: "Resize Image to 50 KB",
    intro:
      "Compress a photo or JPG to under 50 KB for an online application. Passport-size photos fit at good quality, and large phone photos are scaled down only as far as needed. Nothing is uploaded.",
    badgeTitle: "Resize Image to 50 KB",
    shortDescription: "Compress a photo or JPG to under 50 KB for applications and portals, without uploading it.",
    metaDescription:
      "Resize an image to 50 KB online: compress a photo or JPG to under 50 KB for application forms, with exact pixels if needed. Free, works on phones, no upload.",
    primaryKeyword: "resize image to 50kb",
    secondaryKeywords: ["compress image to 50kb", "reduce photo size to 50kb", "jpg to 50kb", "50kb photo size in pixels"],
    canonicalUrl: "https://tooltiva.net/image-tools/resize-image-to-50kb/",
    testedIntro: "Four real photos run through this page's tool with Under 50 KB selected:",
    tested: [
      { input: PORTRAIT, result: "48.1 KB · 512 × 600 px (unchanged) · quality 61%" },
      { input: DOCUMENT, result: "48.4 KB · 512 × 705 px · quality 55%" },
      { input: CITY, result: "48.2 KB · 721 × 509 px · quality 52%" },
      { input: CAMERA, result: "48.1 KB · 1,104 × 736 px · quality 56%" },
    ],
    pixelTests: [{ input: "413 × 531 px (3.5 × 4.5 cm at 300 DPI)", result: "48.6 KB · quality 85%" }],
    uses: [
      "Passport-size photos on application forms that allow up to 50 KB.",
      "Forms that ask for 20–50 KB: use the 20–50 KB option so the 20 KB minimum is respected too.",
      "Scanned ID cards or small documents on portals with a 50 KB limit; check in the preview that the text is still readable.",
    ],
    tips: [
      "If the form also sets a minimum, choose 20–50 KB instead of Under 50 KB.",
      "Keep the photo's proportions unless the form gives exact pixels; then the edges are trimmed evenly, never stretched.",
      "Crop away borders and background first, so more of the 50 KB goes to the subject.",
      "Upload the downloaded file itself; copying it through a chat app can compress it again.",
    ],
    facts: [
      { label: "Target", value: "Under 50 KB: at most 50,000 bytes, so it passes whether the form counts 1,000 or 1,024 bytes per KB" },
      { label: "Typical result", value: "A 35 × 45 mm photo at 300 DPI (413 × 531 px) keeps 85% quality; large photos come out about 510–1,100 px wide" },
      { label: "Output", value: "JPG (JPEG), with location and camera details removed" },
    ],
    faqs: [
      {
        question: "How do I compress a photo to 50 KB?",
        answer:
          "Choose the photo; Under 50 KB is already selected. The tool lowers the JPEG quality first and reduces the dimensions only if quality alone is not enough. Check the preview, then tap Download JPG.",
      },
      {
        question: "What is 50 KB in pixels?",
        answer:
          "It depends on the photo's detail. In our tests, photos came out between about 512 × 600 and 1,104 × 736 pixels at just under 50 KB, and a 413 × 531 pixel passport photo fitted at 85% JPEG quality.",
      },
      {
        question: "Is 50 KB enough for a passport-size photo?",
        answer:
          "Yes. Even a 35 × 45 mm photo at 300 DPI (413 × 531 pixels) fits under 50 KB at 85% quality, which looks sharp on any form.",
      },
      {
        question: "The form says the photo must be 20 KB to 50 KB. What do I do?",
        answer:
          "Choose 20–50 KB in the size list. The result then stays between 20 and 50 KB; a photo that is too small is raised above 20 KB instead of being rejected.",
      },
      PRIVACY_FAQ,
    ],
  },
  {
    ...common,
    id: "resize-image-to-100kb",
    slug: "resize-image-to-100kb",
    presetId: "100kb",
    sizeLabel: "100 KB",
    title: "Resize Image to 100 KB",
    navLabel: "100 KB",
    pageTitle: "Resize Image to 100KB – Compress JPG or Photo to 100 KB",
    h1: "Resize Image to 100 KB",
    intro:
      "Compress a photo or JPG to under 100 KB for job portals, CVs and email. Large phone photos are scaled down to fit, and smaller photos keep their size at high quality. Nothing is uploaded.",
    badgeTitle: "Resize Image to 100 KB",
    shortDescription: "Compress a photo or JPG to under 100 KB for portals, CVs and email, without uploading it.",
    metaDescription:
      "Resize an image to 100 KB online: compress a photo or JPG to under 100 KB for job portals, CVs and forms. See the result before you download. Free, no upload.",
    primaryKeyword: "resize image to 100kb",
    secondaryKeywords: ["compress image to 100kb", "reduce photo size to 100kb", "jpg to 100kb", "compress jpeg to 100kb"],
    canonicalUrl: "https://tooltiva.net/image-tools/resize-image-to-100kb/",
    testedIntro: "Four real photos run through this page's tool with Under 100 KB selected:",
    tested: [
      { input: PORTRAIT, result: "85.9 KB · 512 × 600 px (unchanged) · quality 95%" },
      { input: DOCUMENT, result: "96.9 KB · 725 × 996 px · quality 61%" },
      { input: CITY, result: "96.4 KB · 1,019 × 719 px · quality 60%" },
      { input: CAMERA, result: "97.4 KB · 1,734 × 1,156 px · quality 54%" },
    ],
    uses: [
      "Profile photos on job portals and university applications.",
      "Scanned certificates and documents on portals with a 100 KB limit.",
      "Photos for email and chat, where smaller files send faster.",
    ],
    tips: [
      "A passport-size photo is usually far below 100 KB already, so it comes out at high quality with no change in size.",
      "For a scanned page, crop the edges first and check in the preview that small text is still readable.",
      "If the result must also be at least 50 KB, choose 50–100 KB in the size list.",
      "PNG, WebP and other photos open too; the download is always a JPG, the format portals accept.",
    ],
    facts: [
      { label: "Target", value: "Under 100 KB: at most 100,000 bytes, so it passes whether the form counts 1,000 or 1,024 bytes per KB" },
      { label: "Typical result", value: "A 10-megapixel photo comes out about 1,700 px wide; a 512 × 600 px portrait keeps 95% quality" },
      { label: "Output", value: "JPG (JPEG), with location and camera details removed" },
    ],
    faqs: [
      {
        question: "How do I reduce a photo to 100 KB?",
        answer:
          "Choose the photo; Under 100 KB is already selected. The tool keeps the highest JPEG quality that fits and reduces the width and height only when the photo is still too big at 50% quality. Then tap Download JPG.",
      },
      {
        question: "What size in pixels is a 100 KB photo?",
        answer:
          "It depends on the detail in the photo. In our tests, a photo of a newspaper page came out 725 × 996 pixels, a city photo 1,019 × 719 and a 10-megapixel camera photo 1,734 × 1,156, all just under 100 KB.",
      },
      {
        question: "My photo is already under 100 KB. What happens?",
        answer:
          "It is saved as a JPG at up to 95% quality without changing its size in pixels. In our test, a 512 × 600 pixel portrait came out at 85.9 KB.",
      },
      {
        question: "Can I convert a PNG to a JPG under 100 KB?",
        answer:
          "Yes. Open the PNG here; the result is always a JPG under the size you chose. Most portals that set KB limits ask for JPG anyway.",
      },
      PRIVACY_FAQ,
    ],
  },
  {
    ...common,
    id: "resize-image-to-200kb",
    slug: "resize-image-to-200kb",
    presetId: "200kb",
    sizeLabel: "200 KB",
    title: "Resize Image to 200 KB",
    navLabel: "200 KB",
    pageTitle: "Resize Image to 200KB – Compress Photo to 200 KB Online",
    h1: "Resize Image to 200 KB",
    intro:
      "Compress a phone or camera photo to under 200 KB while keeping it large: in our test a 10-megapixel photo came out about 2,450 pixels wide. Works on any device, and nothing is uploaded.",
    badgeTitle: "Resize Image to 200 KB",
    shortDescription: "Compress large phone photos to under 200 KB for uploads and email, without uploading them.",
    metaDescription:
      "Resize an image to 200 KB online: compress large phone photos to under 200 KB for uploads and email, keeping good size and quality. Free, no upload.",
    primaryKeyword: "resize image to 200kb",
    secondaryKeywords: ["compress image to 200kb", "reduce photo size to 200kb", "jpg to 200kb", "compress jpeg to 200kb"],
    canonicalUrl: "https://tooltiva.net/image-tools/resize-image-to-200kb/",
    testedIntro: "Four real photos run through this page's tool with Under 200 KB selected:",
    tested: [
      { input: PORTRAIT, result: "85.9 KB · 512 × 600 px (unchanged) · quality 95%" },
      { input: DOCUMENT, result: "192.8 KB · 818 × 1,125 px (unchanged) · quality 80%" },
      { input: CITY, result: "185.3 KB · 1,142 × 806 px (unchanged) · quality 82%" },
      { input: CAMERA, result: "191.9 KB · 2,453 × 1,635 px · quality 57%" },
    ],
    uses: [
      "Websites and portals that reject uploads over 200 KB.",
      "Photos in documents, reports and presentations that should stay light.",
      "Product and listing photos on marketplaces with upload limits.",
    ],
    tips: [
      "In our tests, photos up to about 1,100 pixels wide fitted under 200 KB without losing any pixels.",
      "Phone photos of 12 megapixels or more are scaled down; set an exact width and height if the site asks for one.",
      "For the smallest change, compare the preview with the original before you download.",
      "Need it smaller still? The 100 KB and 50 KB options are in the same size list.",
    ],
    facts: [
      { label: "Target", value: "Under 200 KB: at most 200,000 bytes, so it passes whether the site counts 1,000 or 1,024 bytes per KB" },
      { label: "Typical result", value: "Photos up to about 1,100 px wide keep their size at about 80% quality; a 10-megapixel photo comes out about 2,450 px wide" },
      { label: "Output", value: "JPG (JPEG), with location and camera details removed" },
    ],
    faqs: [
      {
        question: "How do I compress an image to 200 KB?",
        answer:
          "Choose the photo; Under 200 KB is already selected. The tool uses the highest JPEG quality that fits and reduces the dimensions only if needed. Check the preview, then tap Download JPG.",
      },
      {
        question: "How many pixels fit in 200 KB?",
        answer:
          "In our tests, a 1,142 × 806 pixel city photo and an 818 × 1,125 pixel photo of a newspaper page fitted at about 80% quality without losing pixels, and a 10-megapixel camera photo came out 2,453 × 1,635 pixels.",
      },
      {
        question: "Why did my photo get smaller in pixels?",
        answer:
          "A phone or camera photo is often several megabytes, so lowering the JPEG quality alone cannot reach 200 KB without visible damage. Below 50% quality the tool reduces the width and height instead, which keeps the photo clean.",
      },
      PRIVACY_FAQ,
    ],
  },
  {
    ...common,
    id: "resize-image-20kb-to-50kb",
    slug: "resize-image-20kb-to-50kb",
    presetId: "20-50kb",
    sizeLabel: "20–50 KB",
    title: "Resize Image to 20–50 KB",
    navLabel: "20–50 KB",
    pageTitle: "Resize Photo Between 20KB and 50KB – 20 to 50 KB Online",
    h1: "Resize Image to 20–50 KB",
    intro:
      "Make a photo between 20 KB and 50 KB, the range many application forms ask for. Photos that are too big are compressed, and photos that are too small are brought up past the 20 KB minimum. Nothing is uploaded.",
    badgeTitle: "Resize Image to 20–50 KB",
    shortDescription: "Make a photo between 20 KB and 50 KB for application forms, without uploading it.",
    metaDescription:
      "Resize a photo to between 20 KB and 50 KB for forms: large photos are compressed and small ones raised above 20 KB. Free, works on phones, no upload.",
    primaryKeyword: "resize image 20kb to 50kb",
    secondaryKeywords: ["photo size 20kb to 50kb", "resize photo between 20kb and 50kb", "increase photo size to 20kb", "20kb to 50kb photo size in pixels"],
    canonicalUrl: "https://tooltiva.net/image-tools/resize-image-20kb-to-50kb/",
    testedIntro: "Real photos run through this page's tool with 20–50 KB selected, including one that started below the minimum:",
    tested: [
      { input: "Small portrait, 200 × 234 px, 7.8 KB", result: "37.4 KB · 200 × 234 px (unchanged) · quality 100%" },
      { input: PORTRAIT, result: "48.1 KB · 512 × 600 px (unchanged) · quality 61%" },
      { input: CITY, result: "48.2 KB · 721 × 509 px · quality 52%" },
      { input: CAMERA, result: "48.1 KB · 1,104 × 736 px · quality 56%" },
    ],
    uses: [
      "Application forms that reject photos under 20 KB as well as over 50 KB.",
      "Photos that are too small, such as a tiny scan or a picture saved from a chat, that must reach the 20 KB minimum.",
    ],
    tips: [
      "The tool aims for the best quality inside the range, so most results land just under 50 KB.",
      "A photo that is too small gets its quality raised first; only if that is not enough are pixels added, which does not add detail.",
      "With exact pixels set, a file that still falls short is padded with empty data inside the file; the picture itself is unchanged.",
      "If the form gives a different range, such as 10–20 KB, pick it in the size list or choose Custom.",
    ],
    facts: [
      { label: "Target", value: "At least 20 KB (20,480 bytes) and at most 50 KB (50,000 bytes), so it passes either way of counting KB" },
      { label: "Too-small photos", value: "Quality raised to the top, then pixels added if needed; at fixed pixels, padding inside the file" },
      { label: "Output", value: "JPG (JPEG), with location and camera details removed" },
    ],
    faqs: [
      {
        question: "How do I make a photo between 20 KB and 50 KB?",
        answer:
          "Choose the photo; 20–50 KB is already selected. A large photo is compressed and, if needed, scaled down until it is under 50 KB; a small one is raised above 20 KB. Then tap Download JPG.",
      },
      {
        question: "My photo is only 8 KB. How do I increase it to 20 KB?",
        answer:
          "Open it here with 20–50 KB selected. The tool raises the JPEG quality first; in our test a 7.8 KB, 200 × 234 pixel photo came out at 37.4 KB with no change in pixels. If quality alone is not enough, the photo is enlarged, which adds pixels but no detail.",
      },
      {
        question: "Why is the result close to 50 KB instead of 20 KB?",
        answer:
          "Inside the range, a bigger file means better quality, so the tool keeps the best version that is still under 50 KB. Any size between 20 and 50 KB is accepted by such forms.",
      },
      {
        question: "Does 20 KB mean 20,000 or 20,480 bytes?",
        answer:
          "Forms differ, so the tool satisfies both: the minimum is counted as 20,480 bytes (1 KB = 1,024) and the maximum as 50,000 bytes (1 KB = 1,000).",
      },
      PRIVACY_FAQ,
    ],
  },
];

export function getKbSizePage(slug: string): KbSizePage | undefined {
  return KB_SIZE_PAGES.find((p) => p.slug === slug);
}

export function kbSizePath(page: KbSizePage): string {
  return `/image-tools/${page.slug}/`;
}
