import React from "react";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/metadata";
import { SITE } from "@/lib/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "The terms for using Tooltiva's free CSV, JSON and image tools and guides: acceptable use, your files, accuracy, advertising, liability and contact details.",
  path: "/terms/",
});

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Agreement to these terms",
    body: (
      <p>
        By using Tooltiva at <code>tooltiva.net</code>, you agree to these Terms of Service and to the{" "}
        <Link href="/privacy/">Privacy Policy</Link>. If you do not agree, please do not use the site.
      </p>
    ),
  },
  {
    title: "2. The service",
    body: (
      <p>
        Tooltiva offers free online tools for CSV, JSON, contact (VCF) and image files, and guides about common
        file problems. The tools run in your web browser: files, text and photos you open are processed on your own
        device and are not uploaded to our servers. No account is needed. We may add, change or remove tools at any
        time.
      </p>
    ),
  },
  {
    title: "3. Acceptable use",
    body: (
      <>
        <p>You may use Tooltiva for personal, educational and commercial work. You agree not to:</p>
        <ul>
          <li>use the tools to process content you have no right to use, or for any unlawful purpose;</li>
          <li>attempt to disrupt the site, overload it with automated requests, or bypass its security;</li>
          <li>copy or republish the site&apos;s guides or page text as your own.</li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Your files and content",
    body: (
      <p>
        You keep all rights to the files and text you open in a tool. Because processing happens in your browser, we do
        not receive, store or look at that content, and we cannot recover it. Keep your original files until you have
        checked each result.
      </p>
    ),
  },
  {
    title: "5. Accuracy of results",
    body: (
      <p>
        We test every tool with real and malformed files and describe only behaviour we have checked, but no software is
        free of errors. Results are provided without a guarantee that they are complete or correct for your purpose.
        Check the preview and the output before you rely on them, for example before importing contacts or submitting a
        form. Requirements in guides, such as file size limits, can change; the official instructions of the form or
        program always come first.
      </p>
    ),
  },
  {
    title: "6. Advertising and links to other sites",
    body: (
      <p>
        Tooltiva may show advertising, including ads served by Google, as described in the Privacy Policy. Ads and links
        to other websites are provided for convenience; we are not responsible for the content, products or practices of
        those sites.
      </p>
    ),
  },
  {
    title: "7. Intellectual property",
    body: (
      <p>
        The Tooltiva name, logo, site design, guides and page text belong to {SITE.publisher}. The output files you
        create with the tools are yours.
      </p>
    ),
  },
  {
    title: "8. Disclaimer and limitation of liability",
    body: (
      <p>
        Tooltiva is provided <strong>&quot;as is&quot; and &quot;as available&quot;</strong>, without warranties of any
        kind, express or implied. To the extent the law allows, {SITE.publisher} and the operators of Tooltiva are not
        liable for any indirect, incidental, special or consequential damages, or for any loss of data, arising from the
        use of, or inability to use, the site or its tools.
      </p>
    ),
  },
  {
    title: "9. Changes to these terms",
    body: (
      <p>
        We may update these terms when the service changes. The date at the top of this page shows the latest version.
        Continuing to use Tooltiva after a change means you accept the updated terms.
      </p>
    ),
  },
  {
    title: "10. Governing law",
    body: (
      <p>
        These terms are governed by the laws applicable in {SITE.publisher}&apos;s primary jurisdiction, without regard
        to conflict-of-law rules.
      </p>
    ),
  },
  {
    title: "11. Contact",
    body: (
      <p>
        Questions about these terms: <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>, or see the{" "}
        <Link href="/contact/">Contact page</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: "Terms of Service" }]} />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Terms of Service</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Last updated: October 24, 2026</p>
      </div>
      <div className="content-prose space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{section.title}</h2>
            {section.body}
          </section>
        ))}
      </div>
    </div>
  );
}
