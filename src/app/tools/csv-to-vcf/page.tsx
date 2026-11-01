import React from "react";
import Link from "next/link";
import { getToolBySlug, toolPath } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { ToolPageLayout, ContentSection } from "@/components/ToolPageLayout";
import { CSVToVCFClient } from "@/components/tools/CSVToVCFClient";

const tool = getToolBySlug("csv-to-vcf")!;

export const metadata = buildPageMetadata({
  title: tool.pageTitle,
  description: tool.metaDescription,
  path: toolPath(tool),
});

export default function CSVToVCFPage() {
  return (
    <ToolPageLayout
      tool={tool}
      content={
        <>
          <ContentSection title="How to convert CSV to VCF">
            <ol>
              <li>
                <strong>Open your contact list:</strong> drop the CSV file on the page, choose it with Open CSV file, or
                paste the rows.
              </li>
              <li>
                <strong>Check the columns:</strong> name, phone, email and company columns are matched from your column
                names, such as Name, Mobile No. or WhatsApp. Change any that are wrong.
              </li>
              <li>
                <strong>Add your country code if needed:</strong> for example +92, so 0300 1234567 is saved as
                +923001234567.
              </li>
              <li>
                <strong>Download the VCF</strong> and import it into your phone or Google Contacts.
              </li>
            </ol>
          </ContentSection>

          <ContentSection title="Convert Excel contacts to VCF">
            <p>
              Open the Excel file (.xlsx) here directly: the first sheet is read with every value as Excel shows it, so
              phone numbers keep all their digits and names in Urdu, Arabic and other scripts stay intact. If the
              contacts are on another sheet, move that sheet to the front in Excel first.
            </p>
            <ul>
              <li>
                <strong>Google Sheets:</strong> choose File, Download, and pick Microsoft Excel (.xlsx) or
                Comma-separated values (.csv).
              </li>
              <li>
                <strong>A CSV from Excel:</strong> save it with File, Save As, <strong>CSV UTF-8 (Comma delimited)</strong>
                so non-English names survive.
              </li>
            </ul>
            <p>
              If a phone number in a CSV was already turned into 9.23001E+11 by Excel, the tool tells you, because those
              digits are lost and need fixing in the sheet first. An .xlsx file does not have this problem when the
              numbers are stored in full.
            </p>
          </ContentSection>

          <ContentSection title="What the conversion looks like">
            <p>A row from a contact sheet, and the contact it becomes in the VCF file:</p>
            <pre tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <code className="bg-transparent p-0">{`Name,Mobile No.,Email,Company
Ayesha Khan,0300 1234567,ayesha@example.com,Khan Traders`}</code>
            </pre>
            <pre tabIndex={0} className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <code className="bg-transparent p-0">{`BEGIN:VCARD
VERSION:3.0
N:;Ayesha Khan;;;
FN:Ayesha Khan
ORG:Khan Traders
TEL;TYPE=CELL:+923001234567
EMAIL;TYPE=INTERNET:ayesha@example.com
END:VCARD`}</code>
            </pre>
          </ContentSection>

          <ContentSection title="Import the VCF file into your phone">
            <ul>
              <li>
                <strong>Android:</strong> open the Contacts app, choose <strong>Fix &amp; manage</strong>, then{" "}
                <strong>Import from file</strong>, and select the VCF.
              </li>
              <li>
                <strong>iPhone:</strong> email the file to yourself or save it in Files, tap it, and choose{" "}
                <strong>Add All Contacts</strong>.
              </li>
              <li>
                <strong>Google Contacts:</strong> on contacts.google.com choose <strong>Import</strong> and select the
                file. The contacts then appear on every phone signed in to that Google account.
              </li>
            </ul>
          </ContentSection>

          <ContentSection title="Clean the list before you import it">
            <p>
              Importing a list twice, or a list with repeated people, fills a phone with duplicates that are tedious to
              delete one by one. Run the sheet through{" "}
              <Link href="/tools/remove-duplicates-csv/">Remove Duplicate Rows</Link> first, comparing the phone column.
              If the contacts are spread over several files,{" "}
              <Link href="/tools/merge-csv/">merge the CSV files</Link> before converting. To go the other way, the{" "}
              <Link href="/tools/vcf-to-csv/">VCF to CSV converter</Link> turns a phone&apos;s contacts back into a sheet.
            </p>
          </ContentSection>
        </>
      }
    >
      <CSVToVCFClient />
    </ToolPageLayout>
  );
}
