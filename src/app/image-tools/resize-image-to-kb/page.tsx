import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { ResizeImageClient } from "@/components/tools/ResizeImageClient";

const tool = getToolBySlug("resize-image-to-kb")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function ResizeImageToKBPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to resize an image to a size in KB">
            <p>
              This image resizer in KB works like an image KB converter: you choose the file size, and it finds the
              best quality and dimensions to reach it. Use it to turn a JPG into a 20 KB file, compress a photo to 50
              KB, or keep it between two limits.
            </p>
            <ol>
              <li>
                <strong>Choose the photo:</strong> tap Choose image, drop it on the page, or paste it with Ctrl+V. On a
                phone you can pick it from the gallery or take a new one.
              </li>
              <li>
                <strong>Pick the target size:</strong> Under 20 KB, 50 KB, 100 KB, 200 KB or 500 KB, a range such as
                10–20 KB, or your own numbers.
              </li>
              <li>
                <strong>Set dimensions if the form asks for them:</strong> keep the proportions, or enter an exact width
                and height in pixels.
              </li>
              <li>
                <strong>Download the JPG:</strong> check the new size and the preview, then save the file and upload it
                to your form.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Common file size limits">
            <p>
              Online forms set their own limits, and the instructions on the form always come first. These are the
              limits people most often look for:
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Target size</th>
                    <th scope="col">Often asked for</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>10–20 KB</td>
                    <td>Signatures and thumb impressions on job and exam application forms</td>
                  </tr>
                  <tr>
                    <td>20–50 KB</td>
                    <td>Passport-size photos on application forms</td>
                  </tr>
                  <tr>
                    <td>Under 100–200 KB</td>
                    <td>Profile photos and scanned certificates</td>
                  </tr>
                  <tr>
                    <td>Under 500 KB</td>
                    <td>Photos for email, chat apps and websites with upload limits</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              For a signature with its own size rules, the{" "}
              <Link href="/image-tools/signature-resizer/">signature resizer</Link> also crops the paper and cleans the
              background.
            </p>
          </ContentSection>

          <ContentSection title="How the size is reached without ruining the photo">
            <p>
              A JPEG file gets smaller in two ways: stronger compression (lower quality) or fewer pixels. Too much
              compression makes faces blotchy and text smeared, so the tool first looks for the highest quality that
              fits. Only when quality would drop too far does it reduce the dimensions, step by step, until the file is
              inside your target.
            </p>
            <p>
              The result is the sharpest version that fits. A 12-megapixel phone photo cannot stay 4,000 pixels wide at
              20 KB, but at 600 to 1,000 pixels wide, depending on how much detail it has, it still looks clean at the
              size forms display it.
            </p>
          </ContentSection>

          <ContentSection title="Increase a photo's size in KB">
            <p>
              Some forms reject files that are too small, with messages such as &quot;size should be at least 20 KB&quot;.
              Choose a range like 20–50 KB and the tool raises the quality and, if needed, the dimensions until the
              file is big enough. Enlarging adds pixels but cannot add detail that was not in the photo. When the
              dimensions are fixed, empty data is added inside the JPEG file instead, which raises the size without
              changing the picture.
            </p>
          </ContentSection>

          <ContentSection title="Works on iPhone and Android">
            <p>
              Everything runs in your phone&apos;s browser, so there is no app to install and nothing is uploaded.
              iPhones usually hand photos to the browser as JPEG. If a photo is stored as HEIC and your browser cannot
              open it, set <strong>Settings &gt; Camera &gt; Formats</strong> to <strong>Most Compatible</strong>, or
              share the photo as JPEG first.
            </p>
          </ContentSection>
        </>
      }
    >
      <ResizeImageClient />
    </ToolPageLayout>
  );
}
