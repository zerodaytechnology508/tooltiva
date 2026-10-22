import React from "react";
import { buildPageMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShieldCheck } from "lucide-react";

export const metadata = buildPageMetadata({
  title: "Privacy & Security Policy",
  description: "Learn how Tooltiva processes CSV and JSON content locally and how Google Analytics measures general website usage.",
  path: "/privacy/",
});

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Breadcrumbs items={[{ name: "Privacy Policy" }]} />

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-xs text-brand-800 dark:text-brand-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
          <span>Local Tool Processing</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Privacy & Security Policy
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Last updated: October 23, 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-8 text-base leading-7 text-slate-700 dark:text-slate-300">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Our Commitment: Local Tool Processing
          </h2>

          <p>
            Tooltiva (accessible at <code>tooltiva.net</code>) provides
            browser-based CSV and JSON tools designed to process the content
            you provide locally in your browser.
          </p>

          <p>
            <strong>
              The parsing, delimiter conversion, formatting, and other
              processing performed by these tools occur locally in your
              browser.
            </strong>{" "}
            Tool content and uploaded files are not deliberately sent to
            Tooltiva&apos;s servers for processing by these tools. However,
            normal website hosting and browser requests may transmit technical
            information needed to load and operate the website.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Tool Content and Personal Information
          </h2>

          <ul className="list-disc list-inside space-y-1.5">
            <li>
              The tools do not deliberately upload or store your CSV files,
              JSON files, or pasted tool content on Tooltiva&apos;s servers.
            </li>
            <li>
              Tooltiva does not require user registration or an account to use
              the current tools.
            </li>
            <li>
              Tool content is not deliberately included in Google Analytics
              events.
            </li>
            <li>
              Tooltiva does not sell the contents of your tool inputs or
              outputs.
            </li>
          </ul>
        </section>

        <section id="analytics" className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Google Analytics and Website Usage
          </h2>

          <p>
            Tooltiva uses Google Analytics 4 with measurement ID{" "}
            <code>G-DLDHVDXG2Q</code> to measure general website usage.
            Analytics is off unless you select “Accept All” or enable Google
            Analytics under “Manage” in the analytics banner or the footer&apos;s
            Privacy settings. The Google tag is loaded from Google&apos;s tag domain
            only after you consent; selecting “Reject” keeps it
            disabled. You can change your choice using Privacy settings in
            the footer at any time.
          </p>

          <p>
            Your choice is stored in this browser&apos;s local storage. If
            browser storage is unavailable, a choice applies only until the
            page is closed. After you allow analytics, Google Analytics may
            receive general usage information such as page views and paths,
            browser and device details, approximate location, and interaction
            events enabled by the Analytics property. Google Analytics may
            use cookies or similar technologies. Google processes information
            under its own terms and privacy policies.
          </p>

          <p>
            Tooltiva&apos;s page-view events use a generic page title and
            pathname without query strings or URL fragments. The initial
            referrer is blank; later page-view referrers are limited to a
            previously visited same-site path. Tooltiva does not deliberately
            send text entered into tool editors, CSV or JSON contents,
            uploaded file names or contents, or conversion results in
            analytics events. Google Analytics may also send automatic
            interaction events, such as scroll events, according to the
            property settings. Those settings should be reviewed to ensure
            they do not collect full URLs or sensitive information.
          </p>

          <p>
            Website analytics helps us understand overall usage, identify
            popular tools, and improve the service. Analytics settings and
            privacy requirements vary by location. Privacy settings let you
            reject analytics or withdraw a previous choice; doing so
            prevents future analytics loading or collection by this
            application, but does not erase information already sent to
            Google or necessarily remove existing browser cookies. This
            disclosure is not a legal compliance guarantee.
          </p>
        </section>

        <section id="advertising" className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Advertising (Google AdSense)
          </h2>

          <p>
            Tooltiva uses Google AdSense to show advertising and keep the tools
            free. Third-party vendors, including Google, use cookies to serve
            ads based on a user&apos;s prior visits to this website or other
            websites. Google&apos;s use of advertising cookies enables it and
            its partners to serve ads to you based on your visit to this site
            and/or other sites on the Internet.
          </p>

          <p>
            You may opt out of personalised advertising by visiting{" "}
            <a href="https://adssettings.google.com/" rel="noopener noreferrer">
              Google Ads Settings
            </a>
            . You can also opt out of some third-party vendors&apos; use of
            cookies for personalised advertising at{" "}
            <a href="https://www.aboutads.info/choices/" rel="noopener noreferrer">
              aboutads.info
            </a>
            . Learn more in{" "}
            <a href="https://policies.google.com/technologies/ads" rel="noopener noreferrer">
              How Google uses cookies in advertising
            </a>
            .
          </p>

          <p>
            Advertising scripts receive page-visit information such as the
            page address, browser and approximate location. They never
            receive the text you paste or the files you open in a tool: tool
            processing stays in your browser.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Security and Content Security Policy
          </h2>

          <p>
            Tooltiva uses a Content Security Policy intended to restrict
            resources that the website can load and contact. Its configured
            policy permits the Google Analytics and Google AdSense resources
            used by the website. This is a defense-in-depth measure, not a guarantee
            that information cannot be exposed.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-xs overflow-x-auto text-slate-800 dark:text-slate-200">
            {`default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.adtrafficquality.google https://fundingchoicesmessages.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googlesyndication.com https://*.adtrafficquality.google https://*.doubleclick.net https://fundingchoicesmessages.google.com; frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com https://www.google.com https://*.adtrafficquality.google https://fundingchoicesmessages.google.com; frame-ancestors 'none'; form-action 'none';`}
          </div>

          <p>
            The policy shown above describes the intended configuration. The
            actual security headers applied to the deployed website should
            be checked independently.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            6. Verifying Local Tool Processing
          </h2>

          <p>
            You can inspect the website&apos;s network activity using your
            browser&apos;s Developer Tools:
          </p>

          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li>
              Open Developer Tools by pressing{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-xs">
                F12
              </kbd>
              .
            </li>
            <li>Open the Network tab.</li>
            <li>
              Enter harmless sample data into one of the tools and run a
              conversion.
            </li>
            <li>
              Inspect network requests to determine whether tool content is
              transmitted. The presence or absence of POST or PUT requests
              alone is not sufficient to establish that no information was
              transmitted.
            </li>
            <li>
              Inspect Google Analytics requests separately to review the
              information sent with analytics events.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            7. Contact and Privacy Inquiries
          </h2>

          <p>
            Tooltiva currently does not have a verified privacy contact
            address or a working message-submission channel. We recommend
            avoiding the submission of personal or sensitive information
            through unverified contact channels. A verified contact method
            should be published so visitors can raise privacy questions or
            requests.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            8. Policy Updates
          </h2>

          <p>
            This policy may be updated when Tooltiva&apos;s functionality,
            analytics configuration, or applicable requirements change.
            Updates will be reflected on this page with a revised date.
          </p>
        </section>
      </div>
    </div>
  );
}
