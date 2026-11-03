import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { ChangeDpiClient } from "@/components/tools/ChangeDpiClient";

const tool = getToolBySlug("change-image-dpi")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

const PRINT_TABLE: { name: string; px: string; sizes: string[] }[] = [
  { name: "Phone photo (12 megapixels)", px: "4,000 × 3,000", sizes: ["141.1 × 105.8", "67.7 × 50.8", "50.8 × 38.1", "33.9 × 25.4"] },
  { name: "Photo for a 4 × 6 inch print", px: "1,200 × 1,800", sizes: ["42.3 × 63.5", "20.3 × 30.5", "15.2 × 22.9", "10.2 × 15.2"] },
  { name: "Passport-size photo", px: "413 × 531", sizes: ["14.6 × 18.7", "7.0 × 9.0", "5.2 × 6.7", "3.5 × 4.5"] },
];

export default function ChangeImageDpiPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to change the DPI of an image">
            <ol>
              <li>
                <strong>Choose the image:</strong> a JPG or PNG from your phone or computer. You can also drop it on the
                page or paste it with Ctrl+V.
              </li>
              <li>
                <strong>Check the current DPI:</strong> the tool shows the DPI stored in the file, where it is stored, and
                the size it prints at.
              </li>
              <li>
                <strong>Pick the new DPI:</strong> 300 for photo printing, 200 or 300 when a form asks for it, 72 or 96 for
                screens, or any value under Custom.
              </li>
              <li>
                <strong>Download:</strong> the new file has the same pixels and quality, with the new DPI and print size.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="What changing the DPI changes, and what it doesn't">
            <p>
              DPI (dots per inch, also written PPI) is a number stored in the image file. It tells a printer, or a
              program such as Word, how many pixels to put in each inch of paper. The picture itself is a grid of
              pixels and does not change.
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label="What changes with DPI, scrolls sideways on small screens">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Property</th>
                    <th scope="col">After changing the DPI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Print size (cm or inches)</td>
                    <td>Changes: print size = pixels ÷ DPI</td>
                  </tr>
                  <tr>
                    <td>Width and height in pixels</td>
                    <td>Stay the same</td>
                  </tr>
                  <tr>
                    <td>Quality and sharpness</td>
                    <td>Stay the same: the picture is not re-saved</td>
                  </tr>
                  <tr>
                    <td>File size in KB</td>
                    <td>Changes by a few bytes at most</td>
                  </tr>
                  <tr>
                    <td>How it looks on screen</td>
                    <td>Stays the same: screens show pixels, not DPI</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ContentSection>

          <ContentSection title="Print size at common DPI values">
            <p>The same pixels print smaller as the DPI goes up. Sizes in centimetres, width × height:</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label="Print sizes by DPI, scrolls sideways on small screens">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Image</th>
                    <th scope="col">Pixels</th>
                    <th scope="col">72 DPI</th>
                    <th scope="col">150 DPI</th>
                    <th scope="col">200 DPI</th>
                    <th scope="col">300 DPI</th>
                  </tr>
                </thead>
                <tbody>
                  {PRINT_TABLE.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.px}</td>
                      {row.sizes.map((size, i) => (
                        <td key={i}>{size}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              The formula: centimetres = pixels ÷ DPI × 2.54. For the pixels a print size needs, use pixels = centimetres
              ÷ 2.54 × DPI; the tool shows this for passport photos, signatures, 4 × 6 inch prints and A4.
            </p>
          </ContentSection>

          <ContentSection title="DPI for online forms">
            <p>
              Some application forms describe the photo or signature in centimetres at a given DPI, such as 3.5 × 4.5 cm
              at 200 DPI, which is 276 × 354 pixels. Get the pixels and the KB size right first, then check that the
              file states the DPI:
            </p>
            <ul>
              <li>
                For a photo, set the exact pixels and the size limit with{" "}
                <Link href="/image-tools/resize-image-to-kb/">Resize Image to KB</Link>, then set the DPI here.
              </li>
              <li>
                For a signature, the <Link href="/image-tools/signature-resizer/">Signature Resizer</Link> takes the size
                in centimetres with a DPI and writes both into the file.
              </li>
            </ul>
            <p>
              Changing the DPI does not change the size in KB, so a file that met the limit still meets it. How KB,
              pixels and centimetres relate is explained in{" "}
              <Link href="/guides/photo-signature-size-online-form/">photo and signature size for online forms</Link>.
            </p>
          </ContentSection>

          <ContentSection title="How to check the DPI of an image">
            <ul>
              <li>
                <strong>Here:</strong> open the image above. The current DPI and where it is stored are shown before you
                change anything.
              </li>
              <li>
                <strong>Windows:</strong> right-click the file, choose Properties, open the Details tab and read
                Horizontal resolution and Vertical resolution.
              </li>
              <li>
                <strong>Mac:</strong> open the image in Preview, choose Tools, then Show Inspector, and read Image DPI.
              </li>
            </ul>
            <p>
              A JPG can store its DPI in several places, most often the JFIF header, EXIF data and Photoshop data, and
              programs read different ones. That is why two programs can disagree. This tool writes the same value into
              the JFIF, EXIF and Photoshop fields.
            </p>
          </ContentSection>

          <ContentSection title="Changing the DPI is not the same as adding detail">
            <p>
              Setting 300 DPI makes the same pixels print smaller; it cannot make a small image sharp at a large size. If
              the table in the tool says an image has too few pixels for the print size you need, use a larger original:
              a photo taken at full resolution or a better scan. Tools that &ldquo;increase DPI&rdquo; by enlarging an
              image add pixels, but not real detail.
            </p>
          </ContentSection>
        </>
      }
    >
      <ChangeDpiClient />
    </ToolPageLayout>
  );
}
