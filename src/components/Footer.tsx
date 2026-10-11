import React from "react";
import Link from "next/link";
import { ShieldCheck, Terminal } from "lucide-react";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Commitment */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-sm">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Tooltiva
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              Fast, practical, and privacy-first online tools designed for developers, analysts, and digital creators.
              CSV and JSON tool processing runs directly in your browser.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>100% In-Browser Execution • Zero Server File Uploads</span>
            </div>
          </div>

          {/* Column 2: Data Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Data & CSV Tools
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/tools/csv-delimiter-converter/"
                  className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  CSV Delimiter Converter
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/csv-to-json/"
                  className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  CSV ⇄ JSON Converter
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/json-formatter/"
                  className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  JSON Formatter & Fixer
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Trust */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Platform & Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about/"
                  className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  About Tooltiva
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy/"
                  className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms/"
                  className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/contact/"
                  className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Contact & Feedback
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Discreet CodingTangent Attribution */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            © {new Date().getFullYear()} Tooltiva (tooltiva.net). All rights reserved.
            <AnalyticsConsent />
          </div>
          <div className="flex items-center gap-1.5">
            <span>A product initiative by</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              CodingTangent
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
