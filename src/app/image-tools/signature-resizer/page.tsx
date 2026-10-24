import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { SignatureResizerClient } from "@/components/tools/SignatureResizerClient";

const tool = getToolBySlug("signature-resizer")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function SignatureResizerPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to resize a signature for an online form">
            <ol>
              <li>
                <strong>Sign and photograph it:</strong> sign on plain white paper with a dark pen, then take a photo in
                good light or scan it. Fill most of the photo with the signature.
              </li>
              <li>
                <strong>Open the photo here:</strong> the empty space around the signature is trimmed and the paper is
                made pure white.
              </li>
              <li>
                <strong>Set the size the form asks for:</strong> a file size such as 10–20 KB, and, if given, the
                dimensions in pixels or centimetres.
              </li>
              <li>
                <strong>Download and upload:</strong> check the preview, save the JPG and upload it to the form.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Before and after">
            <p>A typical phone photo of a signature, and what the form receives:</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table>
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">Phone photo</th>
                    <th scope="col">After the signature resizer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">File size</th>
                    <td>1–4 MB</td>
                    <td>Inside your range, such as 10–20 KB</td>
                  </tr>
                  <tr>
                    <th scope="row">Dimensions</th>
                    <td>4000 × 3000 px, mostly empty paper</td>
                    <td>Trimmed to the signature, or the exact pixels or cm you set</td>
                  </tr>
                  <tr>
                    <th scope="row">Background</th>
                    <td>Grey or yellowish, with shadows</td>
                    <td>Pure white</td>
                  </tr>
                  <tr>
                    <th scope="row">Hidden details</th>
                    <td>GPS location, phone model</td>
                    <td>Removed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ContentSection>

          <ContentSection title="Signature size in KB, pixels and centimetres">
            <p>Forms describe the signature they want in up to three ways, and this tool handles all three:</p>
            <ul>
              <li>
                <strong>File size in KB:</strong> a maximum such as 20 KB, often with a minimum such as 10 KB. The
                result is always inside the range.
              </li>
              <li>
                <strong>Pixels:</strong> the width and height of the image, such as 140 × 60 px.
              </li>
              <li>
                <strong>Centimetres:</strong> a print size such as 3.5 × 1.5 cm, which depends on the resolution. At
                200 DPI, 3.5 cm is 276 pixels. The DPI is written into the file.
              </li>
            </ul>
            <p>
              Always follow the numbers in the form&apos;s own instructions. When a form gives only a file size, keep
              proportions and let the tool choose the dimensions.
            </p>
          </ContentSection>

          <ContentSection title="Tips for a clean signature photo">
            <ul>
              <li>Use a black or dark blue pen with a firm line; light pencil strokes can disappear.</li>
              <li>Photograph in daylight or under a bright lamp, holding the phone straight above the paper.</li>
              <li>Keep your hand and phone out of the light so they do not cast a shadow over the signature.</li>
              <li>Sign larger than you need; it is reduced to the right size without losing sharpness.</li>
            </ul>
            <p>
              Need your photo at a size in KB as well? Use{" "}
              <Link href="/image-tools/resize-image-to-kb/">Resize Image to KB</Link> for the photo, with the same
              privacy.
            </p>
          </ContentSection>
        </>
      }
    >
      <SignatureResizerClient />
    </ToolPageLayout>
  );
}
