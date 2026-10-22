"use client";

import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQItem } from "@/lib/types";

export function FAQAccordion({ items, title = "Frequently asked questions" }: { items: FAQItem[]; title?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First answer open by default
  const baseId = useId();

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section aria-labelledby={`${baseId}-title`} className="max-w-3xl">
      <h2 id={`${baseId}-title`} className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
        {title}
      </h2>

      <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {items.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const panelId = `${baseId}-panel-${idx}`;
          const buttonId = `${baseId}-button-${idx}`;
          return (
            <div key={idx}>
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-base font-semibold text-slate-900 hover:text-brand-800 dark:text-slate-100 dark:hover:text-brand-300"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="pb-5 text-base leading-7 text-slate-700 dark:text-slate-300"
              >
                {faq.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
