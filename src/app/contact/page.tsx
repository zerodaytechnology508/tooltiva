import React from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Mail, Terminal, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact & Feedback - Tooltiva",
  description: "Get in touch with the Tooltiva team and CodingTangent for tool requests, feedback, or defect reports.",
  alternates: {
    canonical: "https://tooltiva.net/contact/",
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Breadcrumbs items={[{ name: "Contact & Feedback" }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Contact & Feedback
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Have an idea for a new browser-based tool, noticed a bug, or have a suggestion? We value practical feedback from users and developers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            General Inquiries & Bug Reports
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Send bug reports, suggestions, or edge cases to our engineering inbox:
          </p>
          <a
            href="mailto:support@codingtangent.com"
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline block"
          >
            support@codingtangent.com
          </a>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Product Maker
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Tooltiva is engineered and owned by CodingTangent. Explore other software initiatives or agency engineering projects:
          </p>
          <a
            href="https://codingtangent.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 inline-flex items-center gap-1 underline underline-offset-2"
          >
            Visit CodingTangent
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
