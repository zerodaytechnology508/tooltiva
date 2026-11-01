import React from "react";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/guides-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { GuideLayout, guideArticleMeta } from "@/components/GuideLayout";

const guide = getGuideBySlug("import-contacts-from-excel-to-phone")!;

export const metadata = buildPageMetadata({
  title: guide.pageTitle,
  description: guide.metaDescription,
  path: `/guides/${guide.slug}/`,
  article: guideArticleMeta(guide),
});

const SHEET = `Name           | Phone           | Email
Ayesha Khan    | 0300 1234567    | ayesha@example.com
Bilal Ahmed    | +92 321 7654321 |
Chen Wei       | +86 138 0013 8000 | chen@example.com`;

export default function Guide() {
  return (
    <GuideLayout guide={guide}>
      <p>
        Phones cannot read an Excel file as a contact list. What every phone, and Google Contacts, does read is a VCF
        file (also called a vCard): one file that can hold hundreds of contacts. So the job has two steps: turn the
        Excel sheet into a VCF file, then import that file on the phone.
      </p>

      <h2>Before you start: check the sheet</h2>
      <p>Put one contact on each row, with a heading row on top. For example:</p>
      <pre tabIndex={0}>
        <code>{SHEET}</code>
      </pre>
      <ul>
        <li>
          <strong>Names:</strong> one Name column works, or separate First name and Last name columns. Names in Urdu,
          Arabic or any other script are fine.
        </li>
        <li>
          <strong>Phone numbers:</strong> a number such as <code>03001234567</code> typed into an ordinary Excel cell
          loses its first zero. Format the Phone column as Text before typing (select it, press Ctrl+1, choose Text), or
          type numbers with the country code, such as <code>+92 300 1234567</code>.
        </li>
        <li>
          <strong>Several numbers for one person</strong> can go in one cell separated by a slash or comma, or in
          separate columns such as Mobile and Work.
        </li>
      </ul>
      <p>
        If the list came from several sources, remove repeated people first with{" "}
        <Link href="/tools/remove-duplicates-csv/">Remove Duplicate Rows</Link>, comparing by the phone column.
      </p>

      <h2>Step 1: convert the Excel sheet to a VCF file</h2>
      <ol>
        <li>
          Open the <Link href="/tools/csv-to-vcf/">Excel to VCF converter</Link> and choose your Excel file (.xlsx). A
          CSV file works too. The file is read in your browser and is not uploaded.
        </li>
        <li>
          Check the column matching: the tool guesses which column is the name, phone, email and company. Change any
          that are wrong.
        </li>
        <li>
          Turn on <strong>Add country code to local numbers</strong> and enter yours, such as +92 for Pakistan. Local numbers like{" "}
          <code>0300 1234567</code> are rewritten as <code>+923001234567</code>; numbers that already start with + are
          left alone.
        </li>
        <li>Download the VCF file. It holds every contact from the sheet.</li>
      </ol>

      <h2>Step 2: import the VCF file on your phone</h2>
      <h3>Android</h3>
      <ul>
        <li>
          <strong>Google Contacts app:</strong> tap <strong>Fix &amp; manage</strong>, then <strong>Import from
          file</strong>, choose the Google account to save to, and select the VCF file.
        </li>
        <li>
          <strong>Samsung Contacts app:</strong> open the menu, tap <strong>Manage contacts</strong>, then{" "}
          <strong>Import contacts</strong>, and pick the VCF file from your phone&apos;s storage.
        </li>
        <li>
          You can also open the VCF from the Files or Downloads app, or from a WhatsApp chat, and choose Contacts to
          import it.
        </li>
      </ul>
      <h3>iPhone</h3>
      <ul>
        <li>
          Send the VCF file to yourself by email, AirDrop or WhatsApp, or save it in the Files app. Tap it and choose{" "}
          <strong>Add All Contacts</strong>.
        </li>
        <li>
          Or sign in to iCloud.com on a computer, open Contacts, and import the VCF file there. It syncs to every
          Apple device on the same account.
        </li>
      </ul>
      <h3>Google Contacts on a computer</h3>
      <p>
        Open contacts.google.com, choose <strong>Import</strong>, select the VCF file and confirm. The contacts sync to
        every Android phone signed in to that Google account, and they get a label with the import date, so you can find
        or remove them as a group later.
      </p>

      <h2>Make the contacts show up in WhatsApp</h2>
      <p>
        WhatsApp uses the contacts saved on your phone, so there is nothing to import into WhatsApp itself. Once the VCF
        is imported, open WhatsApp and start a new chat; on Android, use the menu&apos;s <strong>Refresh</strong> option
        if a new contact is missing. Numbers saved in full international format, with + and the country code, are the
        ones WhatsApp matches reliably, which is why the country code step above matters.
      </p>

      <h2>Common problems</h2>
      <ul>
        <li>
          <strong>Numbers show as 9.23E+11 in Excel:</strong> that is only how Excel displays a long number in a narrow
          column; the converter reads the full number from an .xlsx file. In a CSV saved from such a sheet, the digits
          may really be lost, which the converter warns about.
        </li>
        <li>
          <strong>Names appear as ?? or strange characters:</strong> the CSV was saved in an old encoding. Open the .xlsx
          file instead, or save as CSV UTF-8. More in{" "}
          <Link href="/guides/csv-strange-characters-encoding/">fixing strange characters in a CSV</Link>.
        </li>
        <li>
          <strong>Every contact appears twice:</strong> the list was imported twice, or the phone already had those
          contacts. Google Contacts and most phones offer a Merge &amp; fix or Merge duplicates option.
        </li>
        <li>
          <strong>Only one contact was imported:</strong> some desktop programs, such as older Outlook versions, read
          only the first contact of a VCF file. Import on the phone or in Google Contacts instead.
        </li>
      </ul>

      <h2>Summary</h2>
      <p>
        Check that the phone column keeps every digit, convert the Excel sheet to one VCF file with your country code
        added, and import that file with Google Contacts, the Samsung Contacts app, or Add All Contacts on an iPhone. To
        go the other way and see a phone&apos;s contacts in Excel, export them as a VCF file and use{" "}
        <Link href="/tools/vcf-to-csv/">VCF to CSV</Link>, or read{" "}
        <Link href="/guides/open-vcf-file/">how to open a VCF file</Link>.
      </p>
    </GuideLayout>
  );
}
