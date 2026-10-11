import React from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Terminal, Shield, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About Tooltiva - Fast, Private Online Utility Platform",
  description:
    "Learn about Tooltiva, our privacy-first operating principles, and our maker CodingTangent. Practical tools running 100% in your browser.",
  alternates: {
    canonical: "https://tooltiva.net/about/",
  },
  openGraph: {
    title: "About Tooltiva - Fast, Private Online Utility Platform",
    description:
      "Learn about Tooltiva, its privacy-first principles, and its development by CodingTangent as an independent product.",
    url: "https://tooltiva.net/about/",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Breadcrumbs items={[{ name: "About Tooltiva" }]} />

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-xs text-brand-800 dark:text-brand-300 font-medium">
          <Terminal className="w-3.5 h-3.5" />
          <span>Independent Tool Platform</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About Tooltiva
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          Tooltiva is an independent online tool platform built to help developers, data analysts, students, and digital creators complete routine tasks quickly, safely, and without friction.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Our Purpose
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The internet is flooded with online utility websites created solely to extract ad clicks. Most of them are cluttered with intrusive banners, require sign-ups for simple tasks, and—worst of all—upload your files, customer lists, and sensitive code to unknown cloud servers.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Tooltiva was created as a modern alternative: clean, ad-free, and engineered around <strong>client-side browser execution</strong>. When you use Tooltiva, your calculations and file transformations occur locally on your own machine.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Core Operating Principles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Privacy by Design
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                CSV and JSON content stays on your device while the tools process it locally. Optional analytics runs only if you allow it using the footer controls and does not receive tool content.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                No Deceptive Claims
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                We never promise impossible outcomes or make exaggerated claims. When automatic repairs are made, we display an explicit audit log.
              </p>
            </div>
          </div>
        </section>

        {/* Ownership Disclosure */}
        <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 not-prose space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Ownership & Maintenance
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Tooltiva is developed and maintained as a dedicated product initiative by{" "}
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              CodingTangent
            </span>
            . While CodingTangent oversees engineering, infrastructure, and feature updates, Tooltiva operates as an independent platform with its own identity and roadmap.
          </p>
        </section>
      </div>
    </div>
  );
}
