import React from "react";
import Link from "next/link";
import { IMAGE_TOOLS, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolCard } from "@/components/ToolCard";
import { KB_SIZE_PAGES, kbSizePath } from "@/lib/kb-sizes";

export const metadata = buildPageMetadata({
  title: "Photo and Signature Resizer in KB – Free Image Tools",
  description:
    "Free image tools in your browser: resize photos to 20KB, 50KB or any size in KB, and resize signatures for online forms. Your photos are never uploaded.",
  path: "/image-tools/",
});

export default function ImageToolsHubPage() {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tooltiva image tools",
    url: absoluteUrl("/image-tools/"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        ...IMAGE_TOOLS.map((tool) => ({ name: tool.title, url: absoluteUrl(toolPath(tool)) })),
        ...KB_SIZE_PAGES.map((page) => ({ name: page.title, url: absoluteUrl(kbSizePath(page)) })),
      ].map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
    },
  };
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Image Tools", item: absoluteUrl("/image-tools/") },
    ],
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }} />
      <Breadcrumbs items={[{ name: "Image Tools" }]} />

      <div className="mt-4 max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Image Tools for Photos and Signatures</h1>
        <p className="text-lg leading-8 text-slate-600 dark:text-slate-400">
          A free photo and signature resizer for online forms: get each file to the exact size the form asks for, in
          KB, in pixels, or both. Everything runs in your browser, on a phone or a computer, and your photos never leave your
          device.
        </p>
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {IMAGE_TOOLS.map((tool) => (
          <li key={tool.id}>
            <ToolCard tool={tool} headingLevel="h2" />
          </li>
        ))}
      </ul>

      <section aria-labelledby="common-sizes" className="mt-12">
        <h2 id="common-sizes" className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          Resize a photo to a common size
        </h2>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-400">
          The sizes forms ask for most, each with results we measured on real photos.
        </p>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {KB_SIZE_PAGES.map((page) => (
            <li key={page.slug}>
              <Link
                href={kbSizePath(page)}
                className="flex h-full min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-semibold text-slate-900 transition-colors hover:border-brand-600/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800/60"
              >
                {page.title.replace(/ KB$/, "\u00a0KB")}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sizes" className="content-prose mt-16">
        <h2 id="sizes" className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          File size, pixels and centimetres: what forms ask for
        </h2>
        <p className="mt-4">
          Application forms describe an image in up to three ways, and they measure different things. A photo can meet
          one and fail another, so check each number the form gives:
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens">
          <table>
            <thead>
              <tr>
                <th scope="col">The form says</th>
                <th scope="col">What it measures</th>
                <th scope="col">How to meet it</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>20 KB, 10–50 KB, under 100 KB</td>
                <td>The size of the file on disk</td>
                <td>Choose the size range; quality and dimensions are adjusted to land inside it</td>
              </tr>
              <tr>
                <td>200 × 230 pixels</td>
                <td>The width and height of the image</td>
                <td>Set the exact pixels; the photo is cropped or fitted to that shape</td>
              </tr>
              <tr>
                <td>3.5 × 4.5 cm, 200 DPI</td>
                <td>The printed size, at a given resolution</td>
                <td>For a signature, enter the centimetres and DPI. For a photo, convert to pixels: centimetres ÷ 2.54 × DPI, so 3.5 × 4.5 cm at 200 DPI is 276 × 354 pixels</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Forms also differ on whether 1 KB means 1,000 or 1,024 bytes. Aiming a little inside the range, for example 18
          KB for a 20 KB limit, avoids being rejected for a few bytes.
        </p>
      </section>

      <section aria-labelledby="why" className="content-prose mt-16">
        <h2 id="why" className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          Why use these image tools
        </h2>
        <ul className="mt-4">
          <li>
            <strong>Private:</strong> ID photos and signatures are personal. They are processed on your device and
            never uploaded.
          </li>
          <li>
            <strong>Exact:</strong> the file lands inside the size range you choose, such as 10–20 KB, so forms accept
            it the first time.
          </li>
          <li>
            <strong>Sharp:</strong> quality is kept as high as the size allows, and pixels are reduced only when
            needed.
          </li>
        </ul>
        <p>
          New to resizing for forms? Read{" "}
          <Link href="/guides/reduce-photo-size-in-kb/">how to reduce a photo&apos;s size in KB</Link> on a phone, a
          laptop or in Paint, and what forms mean by KB, pixels and centimetres in{" "}
          <Link href="/guides/photo-signature-size-online-form/">photo and signature size for online forms</Link>. Working with spreadsheets or data files instead? See the{" "}
          <Link href="/tools/">CSV, Excel and JSON tools</Link>.
        </p>
      </section>
    </div>
  );
}
