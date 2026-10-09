"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FAQItem } from "@/lib/types";

export function FAQAccordion({ items, title = "Frequently Asked Questions" }: { items: FAQItem[]; title?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/60 transition-colors"
            >
              <button
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-brand-600 dark:text-brand-400" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
