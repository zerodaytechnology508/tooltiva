import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("photo-signature-size-online-form")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <h2>The three ways a form describes size</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table>
          <thead>
            <tr>
              <th scope="col">The form says</th>
              <th scope="col">What it means</th>
              <th scope="col">What changes it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>20–50 KB, max 100 KB</td>
              <td>How much space the file takes</td>
              <td>Pixel dimensions and JPEG quality</td>
            </tr>
            <tr>
              <td>200 × 230 pixels</td>
              <td>Width and height of the picture</td>
              <td>Cropping and resizing</td>
            </tr>
            <tr>
              <td>3.5 × 4.5 cm at 200 DPI</td>
              <td>Printed size at a given resolution</td>
              <td>Pixels and the DPI stored in the file</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The numbers are independent. A 200 × 230 photo can be 10 KB or 60 KB depending on how strongly it is
        compressed, and a 20 KB file can be any shape. So when a form lists both KB and pixels, the photo has to meet
        both.
      </p>

      <h2>Common requirements</h2>
      <p>
        Every form sets its own rules, and the instructions or advertisement for that form are what count. These are
        typical of what application forms ask for:
      </p>
      <ul>
        <li>
          <strong>Photo:</strong> a recent, front-facing passport-style photo on a plain light background, often between
          20 and 100 KB, sometimes with pixel dimensions such as 200 × 230. Many countries&apos; passport photos are 35 ×
          45 mm.
        </li>
        <li>
          <strong>Signature:</strong> a signature in dark ink on white paper, often 10–20 KB, cropped close to the
          signature, sometimes with a size such as 3.5 × 1.5 cm.
        </li>
        <li>
          <strong>Format:</strong> almost always JPG (also written JPEG). PNG, HEIC and PDF are usually rejected.
        </li>
      </ul>

      <h2>Converting centimetres to pixels</h2>
      <p>
        Pixels = centimetres ÷ 2.54 × DPI. If the form gives centimetres but no DPI, 200 DPI is a common choice; some
        forms ask for 300.
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table>
          <thead>
            <tr>
              <th scope="col">Size</th>
              <th scope="col">At 200 DPI</th>
              <th scope="col">At 300 DPI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Photo 3.5 × 4.5 cm (35 × 45 mm)</td>
              <td>276 × 354 pixels</td>
              <td>413 × 531 pixels</td>
            </tr>
            <tr>
              <td>Signature 3.5 × 1.5 cm</td>
              <td>276 × 118 pixels</td>
              <td>413 × 177 pixels</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Some forms read the DPI stored inside the JPG to check the printed size. The{" "}
        <Link href="/image-tools/signature-resizer/">Signature Resizer</Link> writes it when you choose{" "}
        <strong>Centimetres</strong> and a <strong>Resolution in DPI</strong>. For a photo, set it with{" "}
        <Link href="/image-tools/change-image-dpi/">Change Image DPI</Link>, which leaves the pixels and the size in KB
        unchanged.
      </p>

      <h2>KB: 1,000 or 1,024 bytes?</h2>
      <p>
        Forms do not agree on whether a kilobyte is 1,000 or 1,024 bytes, so a file of exactly 20 KB by one count can
        be rejected by the other. Aim a little inside the range, such as 18 KB for a 20 KB maximum and 22 KB for a 20
        KB minimum. Tooltiva&apos;s image tools stay inside the range under both counts.
      </p>

      <h2>How to make the photo and signature fit</h2>
      <ol>
        <li>
          <strong>Photo:</strong> open <Link href="/image-tools/resize-image-to-kb/">Resize Image to KB</Link>, choose
          the range the form gives (for example 20–50 KB), turn on <strong>Exact size in pixels</strong> if the form
          gives dimensions, and download the JPG. For the most common limits there are ready pages for{" "}
          <Link href="/image-tools/resize-image-to-20kb/">20 KB</Link> and{" "}
          <Link href="/image-tools/resize-image-to-50kb/">50 KB</Link>.
        </li>
        <li>
          <strong>Signature:</strong> sign on plain white paper, photograph or scan it, and open the{" "}
          <Link href="/image-tools/signature-resizer/">Signature Resizer</Link>. It trims the empty space, turns the
          paper pure white, and fits the size in KB, pixels or centimetres.
        </li>
        <li>Check the downloaded file&apos;s size and dimensions before uploading.</li>
      </ol>
      <p>
        Both tools run in your browser on a phone or a laptop, and the photos are not uploaded anywhere. More ways to
        shrink a photo, including Paint and phone gallery apps, are in{" "}
        <Link href="/guides/reduce-photo-size-in-kb/">how to reduce a photo&apos;s size in KB</Link>.
      </p>

      <h2>Common upload errors and what they mean</h2>
      <ul>
        <li>
          <strong>&ldquo;File size should be between 20 KB and 50 KB&rdquo;:</strong> the file is outside the KB range;
          resize it into the range, slightly inside the limits, for example with{" "}
          <Link href="/image-tools/resize-image-20kb-to-50kb/">resize image to 20–50 KB</Link>.
        </li>
        <li>
          <strong>&ldquo;Invalid dimensions&rdquo; or &ldquo;image width/height not allowed&rdquo;:</strong> the pixel size
          does not match; set the exact pixels the form gives.
        </li>
        <li>
          <strong>&ldquo;Only JPG/JPEG files allowed&rdquo;:</strong> the photo is PNG or HEIC; download it again as JPG
          from the tools above.
        </li>
        <li>
          <strong>Photo looks blurry after upload:</strong> it was compressed too hard; allow the maximum KB the form
          permits, or crop to the face first so fewer pixels are needed.
        </li>
        <li>
          <strong>Signature looks faint or grey:</strong> use dark ink on white paper and let the Signature Resizer clean
          the background.
        </li>
      </ul>

      <h2>Summary</h2>
      <p>
        Read the form&apos;s rules for KB, pixels, centimetres and format, meet each one, and keep a small margin inside
        the KB limits. Use Resize Image to KB for the photo and the Signature Resizer for the signature, then check the
        result before you upload.
      </p>
    </GuideLayout>
  );
}
