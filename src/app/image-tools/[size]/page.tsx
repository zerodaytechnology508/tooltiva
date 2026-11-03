import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata";
import { KB_SIZE_PAGES, getKbSizePage, kbSizePath, type KbSizePage, type KbTestRow } from "@/lib/kb-sizes";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { ResizeImageClient } from "@/components/tools/ResizeImageClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return KB_SIZE_PAGES.map((page) => ({ size: page.slug }));
}

type Params = { params: Promise<{ size: string }> };

export async function generateMetadata({ params }: Params) {
  const page = getKbSizePage((await params).size);
  if (!page) return {};
  return buildPageMetadata({ title: page.pageTitle, description: page.metaDescription, path: kbSizePath(page) });
}

const PRESET_LABELS: Record<string, string> = {
  "20kb": "Under 20 KB",
  "50kb": "Under 50 KB",
  "100kb": "Under 100 KB",
  "200kb": "Under 200 KB",
  "500kb": "Under 500 KB",
  "10-20kb": "10–20 KB",
  "20-50kb": "20–50 KB",
  "50-100kb": "50–100 KB",
};

const TESTED_ON = "3 November 2026";

function ResultTable({ caption, rows, inputHeading }: { caption: string; rows: KbTestRow[]; inputHeading: string }) {
  return (
    <div
      className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"
      tabIndex={0}
      role="region"
      aria-label={`${caption}, scrolls sideways on small screens`}
    >
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{inputHeading}</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.input}>
              <td>{row.input}</td>
              <td>{row.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OtherSizes({ current }: { current: KbSizePage }) {
  return (
    <section aria-labelledby="other-sizes" className="border-t border-slate-200 pt-10 dark:border-slate-800">
      <h2 id="other-sizes" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Other sizes and tools
      </h2>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {KB_SIZE_PAGES.filter((p) => p.slug !== current.slug).map((p) => (
          <li key={p.slug}>
            <Link
              href={kbSizePath(p)}
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-600/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
            >
              <span className="font-semibold text-slate-900 dark:text-white">{p.title}</span>
              <span className="mt-1 text-sm text-slate-600 dark:text-slate-400">{p.shortDescription}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/image-tools/resize-image-to-kb/"
            className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-600/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
          >
            <span className="font-semibold text-slate-900 dark:text-white">Resize Image to KB (any size)</span>
            <span className="mt-1 text-sm text-slate-600 dark:text-slate-400">Your own size or range in KB, such as 10–20 KB or 30 KB.</span>
          </Link>
        </li>
        <li>
          <Link
            href="/image-tools/signature-resizer/"
            className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-600/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
          >
            <span className="font-semibold text-slate-900 dark:text-white">Signature Resizer</span>
            <span className="mt-1 text-sm text-slate-600 dark:text-slate-400">Signatures to 10–20 KB, pixels or cm, with the paper made white.</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}

export default async function KbSizeToolPage({ params }: Params) {
  const page = getKbSizePage((await params).size);
  if (!page) notFound();
  const presetLabel = PRESET_LABELS[page.presetId];

  return (
    <ToolPageLayout
      tool={page}
      related={<OtherSizes current={page} />}
      content={
        <>
          <ContentSection title={`How to resize an image to ${page.sizeLabel}`}>
            <ol>
              <li>
                <strong>Choose the photo:</strong> tap Choose image, drop it on the page or paste it. On a phone you can
                pick it from the gallery or take a new one.
              </li>
              <li>
                <strong>{presetLabel} is already selected.</strong> If the form gives a different limit or a range, pick
                it from the size list or choose Custom.
              </li>
              <li>
                <strong>Set pixels if the form asks for them:</strong> choose Exact size in pixels and enter the width and
                height. The edges are trimmed evenly, never stretched.
              </li>
              <li>
                <strong>Download the JPG:</strong> check the size and the preview, then save the file and upload it to
                your form.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title={`Tested: what photos look like at ${page.sizeLabel}`}>
            <p>{page.testedIntro}</p>
            <ResultTable caption={`Results of resizing real photos to ${page.sizeLabel}`} rows={page.tested} inputHeading="Photo" />
            <p className="mt-3 text-sm">
              Measured on {TESTED_ON} with this tool in Chrome. Sizes are shown as on Windows (1 KB = 1,024 bytes); your
              result depends on how much detail the photo has.
            </p>
          </ContentSection>

          {page.pixelTests && (
            <ContentSection title={`Exact pixel sizes at ${page.sizeLabel}`}>
              <p>
                Forms often give pixels as well as KB. The same portrait, cropped to sizes that forms ask for, with{" "}
                {presetLabel} selected:
              </p>
              <ResultTable caption={`Passport-size pixel dimensions at ${page.sizeLabel}`} rows={page.pixelTests} inputHeading="Size in pixels" />
              <p className="mt-3 text-sm">
                Centimetres to pixels: pixels = cm ÷ 2.54 × DPI. If the form also checks the DPI, set it afterwards with{" "}
                <Link href="/image-tools/change-image-dpi/">Change Image DPI</Link>; the size in KB stays the same. More on
                how KB, pixels and cm differ in{" "}
                <Link href="/guides/photo-signature-size-online-form/">photo and signature sizes for online forms</Link>.
              </p>
            </ContentSection>
          )}

          <ContentSection title={`When forms ask for ${page.sizeLabel}`}>
            <ul>
              {page.uses.map((use) => (
                <li key={use}>{use}</li>
              ))}
            </ul>
            <p>The instructions for your form or portal always come first: check its size, format and pixel rules.</p>
          </ContentSection>

          <ContentSection title={`Tips for a clear photo at ${page.sizeLabel}`}>
            <ul>
              {page.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <p>
              Other ways to shrink a photo, on Windows, iPhone or Android, are in{" "}
              <Link href="/guides/reduce-photo-size-in-kb/">how to reduce a photo&apos;s size in KB</Link>.
            </p>
          </ContentSection>
        </>
      }
    >
      <ResizeImageClient initialPreset={page.presetId} />
    </ToolPageLayout>
  );
}
