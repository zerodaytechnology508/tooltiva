import React from "react";
import { Mail, Bug, Lightbulb } from "lucide-react";
import { buildPageMetadata } from "@/lib/metadata";
import { SITE } from "@/lib/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = buildPageMetadata({
  title: "Contact Tooltiva",
  description: `Contact Tooltiva support at ${SITE.supportEmail} for questions, bug reports, tool requests and privacy inquiries.`,
  path: "/contact/",
});

const TOPICS = [
  {
    icon: Bug,
    title: "Report a problem",
    text: "Tell us which tool you used, what you expected and what happened. A small sample of the input that shows the problem helps, but remove any personal or confidential data first.",
  },
  {
    icon: Lightbulb,
    title: "Suggest a tool",
    text: "Describe the file task you want to do. Requests for CSV, JSON and other data-file tools help us decide what to build next.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: "Contact" }]} />

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Contact Tooltiva</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
        Questions, bug reports, tool requests and privacy inquiries all go to one inbox. We read every message.
      </p>

      <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50/70 p-6 dark:border-brand-900 dark:bg-brand-950/40">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 dark:bg-slate-900 dark:text-brand-300">
            <Mail aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Email support</h2>
            <p className="mt-1 text-base leading-7 text-slate-700 dark:text-slate-300">
              <a
                href={`mailto:${SITE.supportEmail}`}
                className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
              >
                {SITE.supportEmail}
              </a>
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Please don&apos;t email files that contain personal or confidential data. Tooltiva&apos;s tools work in
              your browser, so we never need your files to help you.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {TOPICS.map(({ icon: Icon, title, text }) => (
          <section key={title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-2 text-base leading-7 text-slate-700 dark:text-slate-300">{text}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-400">
        Tooltiva is developed and maintained by {SITE.publisher}.
      </p>
    </div>
  );
}
