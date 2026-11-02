import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("reduce-photo-size-in-kb")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <h2>What decides a photo&apos;s size in KB</h2>
      <p>
        A phone photo is usually 2 to 5 MB, while online forms often ask for 20 KB, 50 KB or 100 KB: a hundred times
        smaller. Two things make a JPEG file smaller:
      </p>
      <ul>
        <li>
          <strong>Fewer pixels:</strong> a 4000 × 3000 photo has 12 million pixels; a passport-style photo for a form
          needs only a few hundred pixels on each side.
        </li>
        <li>
          <strong>Stronger JPEG compression:</strong> lower quality settings store each pixel with less detail. Too
          much makes faces blurry and blocky.
        </li>
      </ul>
      <p>
        Hitting an exact limit means balancing the two, which is why changing the dimensions by hand often takes
        several tries.
      </p>

      <h2>Method 1: in the browser, on any phone or laptop</h2>
      <ol>
        <li>
          Open <Link href="/image-tools/resize-image-to-kb/">Resize Image to KB</Link> and tap{" "}
          <strong>Choose image</strong>, or drop the photo on the page. It is processed on your device, not uploaded.
        </li>
        <li>
          Under <strong>Target file size</strong>, pick the limit the form gives, such as <strong>Under 20 KB</strong>,{" "}
          <strong>20–50 KB</strong> or <strong>Under 100 KB</strong>, or enter your own minimum and maximum under
          Custom.
        </li>
        <li>
          If the form also gives pixel dimensions, such as 200 × 230, turn on <strong>Exact size in pixels</strong> and
          enter them.
        </li>
        <li>
          Tap <strong>Download JPG</strong>. The result shows its exact size, and it stays inside the range whether
          the form counts 1 KB as 1,000 or 1,024 bytes.
        </li>
      </ol>
      <p>
        This works the same in Chrome on Android, Safari on iPhone and any desktop browser. For a scanned or
        photographed signature, use the <Link href="/image-tools/signature-resizer/">Signature Resizer</Link> instead:
        it also trims the empty space and turns the paper pure white.
      </p>

      <h2>Method 2: on a Windows laptop with Paint</h2>
      <ol>
        <li>Right-click the photo, choose Open with, then Paint.</li>
        <li>
          Choose <strong>Resize</strong> (Ctrl+W), select <strong>Pixels</strong>, keep{" "}
          <strong>Maintain aspect ratio</strong> ticked, and enter a smaller width, such as 600.
        </li>
        <li>
          Choose <strong>File</strong>, <strong>Save as</strong>, <strong>JPEG picture</strong>, and save under a new
          name.
        </li>
        <li>Right-click the new file, choose Properties, and check its size. If it is still too big, resize again.</li>
      </ol>
      <p>
        Paint has no quality setting and cannot aim at a size, so expect a few rounds, and it cannot make a file
        bigger if the form sets a minimum.
      </p>

      <h2>Method 3: on an iPhone</h2>
      <p>
        The Photos app has no setting for file size. Open the browser method above in Safari and choose the photo from
        your library: Safari normally hands it over as a JPEG. If the tool says it cannot read a HEIC photo, change
        Settings → Camera → Formats to <strong>Most Compatible</strong> for new photos, or share the photo as JPEG
        first.
      </p>

      <h2>Method 4: on a Samsung or other Android phone</h2>
      <p>
        In the Samsung Gallery app, open the photo, tap the three-dot menu and choose <strong>Resize image</strong>,
        then pick a smaller percentage; a resized copy is saved next to the original. Other gallery apps differ, and
        none aim at a size in KB, so the browser method is the most direct on any Android phone.
      </p>

      <h2>When the photo is too small: increase the size in KB</h2>
      <p>
        Some forms set a minimum as well, such as 20–50 KB, and reject a file of 12 KB. Choose a range with a minimum
        in Resize Image to KB: when the photo is already smaller, it raises the quality and, if needed, the dimensions
        until the file is inside the range.
      </p>

      <h2>Tips for a photo that passes the form&apos;s checks</h2>
      <ul>
        <li>Crop to the head and shoulders before resizing, so the pixels go to the face, not the background.</li>
        <li>Use the original photo, not a screenshot of it, which is already blurrier.</li>
        <li>
          Check what the form asks for besides KB: some give pixels (such as 200 × 230) or centimetres (such as 3.5 ×
          4.5 cm). The <Link href="/image-tools/">image tools page</Link> explains how KB, pixels and centimetres
          differ.
        </li>
        <li>Save the result as JPG; most forms do not accept PNG or HEIC.</li>
      </ul>

      <h2>Summary</h2>
      <p>
        For a size in KB, use a tool that aims at the limit: Resize Image to KB in the browser works on every phone
        and laptop and also raises a photo that is too small. Paint on Windows and the Samsung Gallery app shrink
        photos too, but by dimensions only, so check the size afterwards.
      </p>
    </GuideLayout>
  );
}
