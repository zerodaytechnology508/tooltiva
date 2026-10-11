import React from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Service - Tooltiva",
  description: "Terms of service and fair usage guidelines for Tooltiva online tools.",
  alternates: {
    canonical: "https://tooltiva.net/terms/",
  },
  openGraph: {
    title: "Terms of Service - Tooltiva",
    description:
      "Terms of service and fair usage guidelines for Tooltiva online tools.",
    url: "https://tooltiva.net/terms/",
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Breadcrumbs items={[{ name: "Terms of Service" }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Last updated: October 10, 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-8 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or using Tooltiva (accessible at <code>tooltiva.net</code>), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Permitted Use & In-Browser Execution
          </h2>
          <p>
            Tooltiva provides web-based data conversion and formatting utilities for personal, academic, and commercial purposes. You are free to use our tools to process your own data files without charge. Because processing occurs entirely within your browser runtime, you remain solely responsible for maintaining local backups of your data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Disclaimer of Warranties
          </h2>
          <p>
            Tooltiva and all associated software utilities are provided on an <strong>&quot;as is&quot; and &quot;as available&quot; basis</strong>, without warranties of any kind, whether express or implied. While we take great care to ensure functional correctness and RFC standard compliance, we do not guarantee that file conversions or auto-repair operations will be error-free or uninterrupted. Users are encouraged to inspect live table previews and verify critical data before production deployment.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Limitation of Liability
          </h2>
          <p>
            In no event shall Tooltiva, its owner CodingTangent, or its operators be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use or inability to use our tools or any data loss resulting therefrom.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Governing Law
          </h2>
          <p>
            These terms shall be governed and construed in accordance with the laws applicable to CodingTangent&apos;s primary jurisdiction, without regard to its conflict of law provisions.
          </p>
        </section>
      </div>
    </div>
  );
}
