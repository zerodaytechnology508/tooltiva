import React from "react";
import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, UserX } from "lucide-react";
import { TOOLS } from "@/lib/tools-registry";
import { buildPageMetadata } from "@/lib/metadata";
import { SITE, absoluteUrl } from "@/lib/site";
import { ToolCard } from "@/components/ToolCard";

export const metadata = buildPageMetadata({
  title: `${SITE.name} — Free CSV & JSON Tools That Run in Your Browser`,
  description: SITE.description,
  path: "/",
  absoluteTitle: true,
});

const PRINCIPLES = [
  {
    icon: Lock,
    title: "Your files stay on your device",
    text: "Every tool runs in your browser. What you paste or upload is never sent to a server, so you can work with customer lists, exports and API responses safely.",
  },
  {
    icon: ShieldCheck,
    title: "No silent changes",
    text: "Values are kept exactly as written. When a tool repairs or converts something, it tells you what changed, and you can review a preview before you export.",
  },
  {
    icon: UserX,
    title: "Free, no sign-up",
    text: "Open a tool and use it. There is no account, no email gate and no upload queue.",
  },
];

export default function HomePage() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl("/"),
    description: SITE.description,
    publisher: {
      "@type": "Organization",
      name: SITE.publisher,
    },
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />

      <section className="mx-auto max-w-3xl pb-14 pt-16 text-center sm:pt-20">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          Free CSV and JSON tools that run in your browser
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
          View, split and merge CSV files, change delimiters, convert between CSV and JSON, and format or fix
          JSON. Your files are processed on your device and never uploaded.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#tools"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-brand-800 dark:bg-brand-500 dark:text-slate-950 dark:hover:bg-brand-400"
          >
            Browse the tools
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
          <Link
            href="/about/"
            className="inline-flex min-h-11 items-center rounded-lg px-5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            How Tooltiva works
          </Link>
        </div>
      </section>

      <section id="tools" aria-labelledby="tools-title" className="scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="tools-title" className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Tools
          </h2>
          <Link href="/tools/" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
            All tools by category
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <li key={tool.id}>
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="principles-title" className="mt-20 border-t border-slate-200 pt-14 dark:border-slate-800">
        <h2 id="principles-title" className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Built to be trusted with your data
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-base leading-7 text-slate-600 dark:text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
