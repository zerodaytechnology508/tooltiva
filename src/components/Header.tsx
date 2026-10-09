"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Moon, Sun, Menu, X, Terminal, FileSpreadsheet, ArrowLeftRight, Code2 } from "lucide-react";

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Terminal className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Tooltiva
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    v1.0
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-1 hidden sm:inline">
                  Privacy-First Online Tools
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/tools/csv-delimiter-converter/"
              className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              CSV Delimiter
            </Link>
            <Link
              href="/tools/csv-to-json/"
              className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4 text-blue-500" />
              CSV ⇄ JSON
            </Link>
            <Link
              href="/tools/json-formatter/"
              className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Code2 className="w-4 h-4 text-indigo-500" />
              JSON Formatter
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
            <Link
              href="/about/"
              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy/"
              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Privacy
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="md:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu modal */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          <Link
            href="/tools/csv-delimiter-converter/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            CSV Delimiter Converter
          </Link>
          <Link
            href="/tools/csv-to-json/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeftRight className="w-5 h-5 text-blue-500" />
            CSV ⇄ JSON Converter
          </Link>
          <Link
            href="/tools/json-formatter/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Code2 className="w-5 h-5 text-indigo-500" />
            JSON Formatter & Fixer
          </Link>
          <div className="border-t border-slate-200 dark:border-slate-800 my-2 pt-2">
            <Link
              href="/about/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-400"
            >
              About Tooltiva
            </Link>
            <Link
              href="/privacy/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-400"
            >
              Privacy & Security Policy
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
