import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("open-vcf-file")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

const VCARD = `BEGIN:VCARD
VERSION:3.0
N:Khan;Ayesha;;;
FN:Ayesha Khan
TEL;TYPE=CELL:+92 300 1234567
EMAIL:ayesha@example.com
END:VCARD`;

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <h2>What a VCF file is</h2>
      <p>
        A VCF file, also called a vCard, is a contact file. Phones create one when you export or share contacts, and
        one file can hold a single contact or thousands. It is plain text, with each contact between{" "}
        <code>BEGIN:VCARD</code> and <code>END:VCARD</code>:
      </p>
      <pre tabIndex={0}>
        <code>{VCARD}</code>
      </pre>
      <p>
        Versions 2.1, 3.0 and 4.0 are all in use. Older Android phones write 2.1, often with names encoded so that
        they look unreadable in a text editor; the contacts are still intact.
      </p>

      <h2>Open a VCF file on Android</h2>
      <p>
        Tap the file in the Files or Downloads app, or in a WhatsApp or email message, and choose Contacts to import
        it. If nothing happens, open the Google Contacts app, tap <strong>Fix &amp; manage</strong>, then{" "}
        <strong>Import from file</strong>, and select the VCF. On Samsung phones, the Contacts app has the same option
        under <strong>Manage contacts</strong>, <strong>Import contacts</strong>.
      </p>

      <h2>Open a VCF file on iPhone or Mac</h2>
      <p>
        On an iPhone, tap the VCF file in Mail, Messages, WhatsApp or the Files app. The phone shows the contacts and
        offers <strong>Add All Contacts</strong>. On a Mac, double-click the file: the Contacts app opens and asks
        whether to import all the cards it contains.
      </p>

      <h2>Open a VCF file on Windows</h2>
      <p>
        Windows opens a VCF with whichever program is set for it, often Outlook or the older Windows Contacts. Both are
        made for single business cards: with a file of many contacts, they may show or import only the first one.
      </p>
      <ul>
        <li>
          <strong>To see every contact as a table:</strong> open the file in the{" "}
          <Link href="/tools/vcf-to-csv/">VCF to CSV converter</Link>. It lists all the contacts with their names,
          phone numbers, emails and addresses, in your browser, without uploading the file.
        </li>
        <li>
          <strong>To read the raw text:</strong> right-click the file, choose Open with, then Notepad.
        </li>
        <li>
          <strong>To get the contacts into Outlook or Gmail:</strong> import the file into Google Contacts
          (contacts.google.com, then Import), which reads every contact in the file.
        </li>
      </ul>

      <h2>Open a VCF file in Excel</h2>
      <p>
        Excel cannot read the vCard format. If you open a VCF in Excel, each line of the file lands in one cell of
        column A, so a contact is spread over several rows. To get one row per contact with proper columns:
      </p>
      <ol>
        <li>
          Open the VCF in the <Link href="/tools/vcf-to-csv/">VCF to CSV converter</Link> and check the table.
        </li>
        <li>Download the CSV file.</li>
        <li>
          Open it in Excel with <strong>Data → From Text/CSV</strong> and set the phone columns to Text, so Excel does not
          turn +923001234567 into 9.23E+11. The details are in{" "}
          <Link href="/guides/excel-leading-zeros-csv/">how to stop Excel changing numbers</Link>.
        </li>
      </ol>

      <h2>Common problems</h2>
      <ul>
        <li>
          <strong>Names look like =D9=85=D9=84:</strong> that is quoted-printable encoding from older Android phones.
          The VCF to CSV converter decodes it, so names in Urdu, Arabic and other scripts come out correctly.
        </li>
        <li>
          <strong>The file opens but shows one contact:</strong> the program reads only the first card. Use the
          converter or Google Contacts to see them all.
        </li>
        <li>
          <strong>The file will not open at all:</strong> check the extension is .vcf (not .vcf.txt) and that the
          download finished; a damaged export may need to be made again on the phone.
        </li>
      </ul>

      <h2>Summary</h2>
      <p>
        On a phone or a Mac, tap or double-click the VCF and import the contacts. On Windows and in Excel, convert the
        file to a table with VCF to CSV, because those programs cannot list many contacts from one VCF. To build a VCF
        from a spreadsheet instead, see{" "}
        <Link href="/guides/import-contacts-from-excel-to-phone/">how to import contacts from Excel to your phone</Link>.
      </p>
    </GuideLayout>
  );
}
