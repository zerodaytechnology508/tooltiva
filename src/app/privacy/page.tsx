import React from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy & Security Policy - Tooltiva",
  description:
    "Tooltiva's Privacy Policy. We process all CSV and JSON files locally in your browser. Zero server uploads, zero cookies, zero tracking.",
  alternates: {
    canonical: "https://tooltiva.net/privacy/",
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Breadcrumbs items={[{ name: "Privacy Policy" }]} />

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Zero-Transmission Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy & Security Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Last updated: October 10, 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-8 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Our Commitment: Local-Only Processing
          </h2>
          <p>
            At Tooltiva (accessible at <code>tooltiva.net</code>), privacy is not an afterthought or a marketing catchphrase—it is the foundational architecture of the platform.
          </p>
          <p>
            <strong>All data processing, spreadsheet parsing, delimiter conversion, and JSON formatting occur 100% locally within your device&apos;s web browser.</strong> Your text and uploaded files are not included in requests to Tooltiva or its hosting provider.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Information We Do NOT Collect
          </h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>We do <strong>not</strong> collect or store your uploaded CSV files or pasted text.</li>
            <li>We do <strong>not</strong> require user registration, passwords, or personal credentials.</li>
            <li>We do <strong>not</strong> use advertising cookies, tracking pixels, or cross-site tracking scripts.</li>
            <li>We do <strong>not</strong> monetize your data or sell usage records to data brokers.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Analytics & Telemetry
          </h2>
          <p>
            No analytics or telemetry script is currently included in the Tooltiva application source. If deployed on Cloudflare Pages, the hosting provider may process ordinary page and asset requests under its own service policies; those requests do not include the CSV or JSON content processed by the tools.
          </p>
          <p>
            The conversion tools do not send user-provided CSV or JSON content to an analytics service.
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Application source contains no analytics script or conversion telemetry call.</li>
            <li>Normal page and static-asset requests are handled by the hosting provider.</li>
            <li>Cloudflare Web Analytics is not enabled by the application source inspected for this validation.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Content Security Policy (CSP) & Defense-in-Depth
          </h2>
          <p>
            To physically guarantee that our client-side applications cannot leak user inputs, Tooltiva enforces a strict HTTP Content Security Policy:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-xs overflow-x-auto text-slate-800 dark:text-slate-200">
            {`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none';`}
          </div>
          <p>
            This policy instructs your web browser to block any unauthorized external network connection, ensuring that even in the theoretical event of a compromised dependency, user data cannot be exfiltrated.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Independent Audit Protocol
          </h2>
          <p>
            You can verify Tooltiva&apos;s local-processing behavior at any time:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li>Open your browser&apos;s Developer Tools by pressing <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-xs">F12</kbd>.</li>
            <li>Navigate to the <strong>Network</strong> tab.</li>
            <li>Paste sensitive data into any Tooltiva tool and click convert.</li>
            <li>Inspect the network log to verify that zero outgoing POST or PUT HTTP requests occur.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            6. Inquiries & Maker Contact
          </h2>
          <p>
            If you have questions regarding Tooltiva&apos;s privacy practices, please contact our operating team at{" "}
            <a href="mailto:privacy@codingtangent.com" className="font-semibold text-brand-600 dark:text-brand-400 underline">
              privacy@codingtangent.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
