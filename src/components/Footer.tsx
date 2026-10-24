import React from "react";
import Link from "next/link";
import { DATA_TOOLS, IMAGE_TOOLS, toolPath } from "@/lib/tools-registry";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";
import { BrandMark } from "@/components/BrandMark";
import { SITE } from "@/lib/site";

const linkClass =
  "text-slate-700 hover:text-brand-800 hover:underline dark:text-slate-300 dark:hover:text-brand-300";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-8 w-8" />
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Tooltiva</span>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
              Free tools for CSV, JSON and image files. Everything you paste or upload is processed in your browser and is
              never uploaded to a server.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Support:{" "}
              <a href="mailto:support@tooltiva.net" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                support@tooltiva.net
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Tools</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link href="/tools/" className={`${linkClass} font-semibold`}>
                  All tools
                </Link>
              </li>
              {DATA_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link href={toolPath(tool)} className={linkClass}>
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
            {IMAGE_TOOLS.length > 0 && (
              <>
                <h2 className="mt-6 text-sm font-semibold text-slate-900 dark:text-white">
                  <Link href="/image-tools/" className="hover:underline">
                    Image Tools
                  </Link>
                </h2>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {IMAGE_TOOLS.map((tool) => (
                    <li key={tool.slug}>
                      <Link href={toolPath(tool)} className={linkClass}>
                        {tool.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Tooltiva</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link href="/guides/" className={linkClass}>
                  Guides
                </Link>
              </li>
              <li>
                <Link href="/about/" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact/" className={linkClass}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy/" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms/" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-8 text-sm text-slate-600 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800 dark:text-slate-400">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
            <p>© {new Date().getFullYear()} Tooltiva. All rights reserved.</p>
            <AnalyticsConsent />
          </div>
          <p>
            A product by{" "}
            <a
              href={SITE.publisherProfile}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-800 hover:underline dark:text-slate-200"
            >
              CodingTangent
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
