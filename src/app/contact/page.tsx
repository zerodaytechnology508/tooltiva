import React from "react";
import { buildPageMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Info, Terminal } from "lucide-react";

export const metadata = buildPageMetadata({
  title: "Contact & Feedback",
  description: "Contact information and feedback details for Tooltiva. The static site currently has no connected submission form or verified support inbox.",
  path: "/contact/",
});

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Breadcrumbs items={[{ name: "Contact & Feedback" }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Contact & Feedback
        </h1>
        <p className="text-lg leading-8 text-slate-600 dark:text-slate-400">
          Tooltiva is a static site and currently has no connected message-delivery service. The details below explain the feedback limitation and the product&apos;s relationship to CodingTangent.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Feedback availability
          </h2>
          <p className="text-base leading-7 text-slate-700 dark:text-slate-300">
            This static site has no connected feedback form or verified support inbox. Feedback cannot currently be submitted through Tooltiva. Do not include sensitive information in a message sent elsewhere.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Product Maker
          </h2>
          <p className="text-base leading-7 text-slate-700 dark:text-slate-300">
            Tooltiva is developed and maintained as an independent product initiative by CodingTangent.
          </p>
        </div>
      </div>
    </div>
  );
}
