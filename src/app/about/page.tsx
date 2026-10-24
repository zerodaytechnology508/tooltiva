import React from "react";
import { buildPageMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { AUTHOR } from "@/lib/authors";
import { DATA_TOOLS, IMAGE_TOOLS } from "@/lib/tools-registry";
import { GUIDES } from "@/lib/guides-registry";
import { SITE } from "@/lib/site";
import { Shield, Zap } from "lucide-react";

export const metadata = buildPageMetadata({
  title: "About Tooltiva",
  description: "Learn about Tooltiva, our privacy-first operating principles, and our maker CodingTangent. Practical tools running 100% in your browser.",
  path: "/about/",
});

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Breadcrumbs items={[{ name: "About Tooltiva" }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
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
          <p className="text-base leading-7 text-slate-700 dark:text-slate-300">
            Many online converters process your data by uploading it to their servers. That is a real risk when the file is a customer list, a database export or an API response containing tokens.
          </p>
          <p className="text-base leading-7 text-slate-700 dark:text-slate-300">
            Tooltiva does the work in your browser instead. Every tool is built around <strong>client-side processing</strong>: your files and text are converted on your own device and never uploaded.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">What you can do with Tooltiva</h2>
          <ul className="list-disc space-y-2 pl-6 text-base leading-7 text-slate-700 dark:text-slate-300">
            <li>
              <Link href="/tools/" className="font-medium text-brand-700 underline underline-offset-2 dark:text-brand-400">
                {DATA_TOOLS.length} CSV and JSON tools
              </Link>{" "}
              to view, split, merge and clean spreadsheets, convert between CSV, JSON and VCF contacts, and format or fix
              JSON.
            </li>
            <li>
              <Link href="/image-tools/" className="font-medium text-brand-700 underline underline-offset-2 dark:text-brand-400">
                {IMAGE_TOOLS.length} image tools
              </Link>{" "}
              to get photos and signatures to the exact size in KB, pixels or centimetres that online forms ask for.
            </li>
            <li>
              <Link href="/guides/" className="font-medium text-brand-700 underline underline-offset-2 dark:text-brand-400">
                {GUIDES.length} guides
              </Link>{" "}
              that explain common problems, such as a CSV opening in one column or Excel removing leading zeros, and
              how to fix them.
            </li>
          </ul>
          <p className="text-base leading-7 text-slate-700 dark:text-slate-300">
            Everything is free to use without an account. Tooltiva may show advertising to cover its costs; ads never
            have access to the files you open in a tool.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Core Operating Principles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-700" />
                Privacy by Design
              </h3>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                Files, text and photos stay on your device while the tools process them locally. Optional analytics runs only if you accept it or turn it on in Privacy settings, and it never receives tool content.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                No Deceptive Claims
              </h3>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                We never promise impossible outcomes or make exaggerated claims. When automatic repairs are made, we display an explicit audit log.
              </p>
            </div>
          </div>
        </section>

        <section id="author" className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Who builds Tooltiva</h2>
          <p className="text-base leading-7 text-slate-700 dark:text-slate-300">
            <strong>{AUTHOR.name}</strong>, {AUTHOR.role}. {AUTHOR.bio}
          </p>
          <p className="text-base leading-7 text-slate-700 dark:text-slate-300">
            Every tool is tested against real-world files, including malformed ones, before it is published, and the{" "}
            <Link href="/guides/" className="font-medium text-brand-700 underline underline-offset-2 dark:text-brand-400">
              guides
            </Link>{" "}
            describe only what has been checked. Corrections and suggestions are welcome at support@tooltiva.net.
          </p>
        </section>

        {/* Ownership Disclosure */}
        <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 not-prose space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Ownership & Maintenance
          </h2>
          <p className="text-xs sm:text-base leading-7 text-slate-700 dark:text-slate-300">
            Tooltiva is developed and maintained as a dedicated product initiative by{" "}
            <span className="font-semibold text-brand-700 dark:text-brand-400">
              CodingTangent
            </span>
            {" "}(
            <a
              href={SITE.publisherProfile}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-700 underline underline-offset-2 dark:text-brand-400"
            >
              CodingTangent on Facebook
            </a>
            ). While CodingTangent oversees engineering, infrastructure, and feature updates, Tooltiva operates as an independent platform with its own identity and roadmap.
          </p>
        </section>
      </div>
    </div>
  );
}
