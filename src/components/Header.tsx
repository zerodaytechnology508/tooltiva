"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Moon, Sun, Menu, X } from "lucide-react";
import { TOOLS } from "@/lib/tools-registry";
import { BrandMark } from "@/components/BrandMark";
import { ToolIcon } from "@/components/ToolIcon";

const navLinkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white";

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsMenu = useRef<HTMLDivElement>(null);
  const toolsButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // The Tools menu closes on Escape (focus returns to its button) and on a click outside it.
  useEffect(() => {
    if (!toolsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!toolsMenu.current?.contains(event.target as Node)) setToolsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setToolsOpen(false);
        toolsButton.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [toolsOpen]);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.theme = next ? "dark" : "light";
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this page.
    }
    setIsDark(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Tooltiva home">
          <BrandMark className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Tooltiva</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <div
            ref={toolsMenu}
            className="relative"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setToolsOpen(false);
            }}
          >
            <button
              ref={toolsButton}
              type="button"
              aria-expanded={toolsOpen}
              aria-controls="tools-menu"
              onClick={() => setToolsOpen((open) => !open)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Tools
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 transition-transform ${toolsOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              id="tools-menu"
              hidden={!toolsOpen}
              className="absolute left-0 top-full mt-2 w-[40rem] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <ul className="grid grid-cols-2 gap-1">
                {TOOLS.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/tools/${tool.slug}/`}
                      onClick={() => setToolsOpen(false)}
                      className="flex gap-3 rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        <ToolIcon name={tool.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{tool.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-sm leading-5 text-slate-600 dark:text-slate-400">
                          {tool.shortDescription}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-2 border-t border-slate-200 px-3 pt-3 dark:border-slate-800">
                <Link
                  href="/tools/"
                  onClick={() => setToolsOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400"
                >
                  All tools by category
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
          <Link
            href="/tools/csv-viewer/"
            className={navLinkClass}
          >
            CSV Viewer
          </Link>
          <Link
            href="/tools/csv-to-json/"
            className={navLinkClass}
          >
            CSV to JSON
          </Link>
          <Link
            href="/tools/json-formatter/"
            className={navLinkClass}
          >
            JSON Formatter
          </Link>
          <span aria-hidden="true" className="mx-2 h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <Link
            href="/about/"
            className={navLinkClass}
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="rounded-lg border border-slate-200 p-2.5 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            className="rounded-lg border border-slate-200 p-2.5 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X aria-hidden="true" className="h-4 w-4" /> : <Menu aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 lg:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          <ul className="space-y-1">
            <li>
              <Link
                href="/tools/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
              >
                All tools
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </li>
            {TOOLS.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/tools/${tool.slug}/`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ToolIcon name={tool.icon} className="h-5 w-5 text-brand-700 dark:text-brand-400" />
                  {tool.title}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-800">
              <Link
                href="/about/"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                About Tooltiva
              </Link>
            </li>
            <li>
              <Link
                href="/privacy/"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Privacy Policy
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
