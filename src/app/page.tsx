import React from "react";
import Link from "next/link";
import { TOOLS } from "@/lib/tools-registry";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import {
  FileSpreadsheet,
  ArrowLeftRight,
  Code2,
  Zap,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Terminal,
} from "lucide-react";

export const metadata = {
  title: "Tooltiva - Free, Fast, Privacy-First Online Tools",
  description:
    "Free online developer and data tools. Convert CSV delimiters, transform CSV to JSON, format and auto-fix JSON. 100% in-browser processing with zero server uploads.",
  alternates: {
    canonical: "https://tooltiva.net/",
  },
};

export default function HomePage() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Tooltiva",
    "url": "https://tooltiva.net/",
    "description": "Fast, private in-browser online tools for developers and creators.",
    "publisher": {
      "@type": "Organization",
      "name": "CodingTangent",
    },
  };

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "FileSpreadsheet":
        return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
      case "ArrowLeftRight":
        return <ArrowLeftRight className="w-6 h-6 text-blue-500" />;
      case "Code2":
        return <Code2 className="w-6 h-6 text-indigo-500" />;
      default:
        return <Terminal className="w-6 h-6 text-brand-500" />;
    }
  };

  return (
    <div className="space-y-16 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-xs text-brand-800 dark:text-brand-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Launch Cluster: In-Browser Data & CSV Utilities</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          Practical Online Tools.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-400">
            CSV & JSON Processed In-Browser.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Clean, fast, ad-free utilities for spreadsheets, data conversions, and code formatting.
          CSV and JSON content is processed locally in your browser and is never uploaded by the tools.
        </p>

        {/* Global Privacy Verification Badge */}
        <div className="max-w-3xl mx-auto pt-2">
          <PrivacyBadge />
        </div>
      </section>

      {/* Tools Grid Section */}
      <section id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Available Tools
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Engineered for speed, privacy, and functional correctness.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {TOOLS.length} Active Tools
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}/`}
              className="group relative flex flex-col justify-between p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-brand-500/60 dark:hover:border-brand-500/60 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getToolIcon(tool.icon)}
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {tool.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {tool.shortDescription}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-brand-700 dark:text-brand-400">
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature Principles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Why Choose Tooltiva?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Built on transparent engineering principles to replace bloated, ad-ridden utility websites.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Zero Cloud Uploads
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your spreadsheets, API tokens, and confidential customer lists never leave your device. All parsing runs locally in browser RAM.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Ads or Paywalls
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                No pop-ups, no artificial limits on rows, and no subscriptions. Get your files converted instantly with clean, respectful UX.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Never Silent Modifications
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatic syntax repairs and delimiter transformations provide explicit change logs and interactive table previews before export.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
