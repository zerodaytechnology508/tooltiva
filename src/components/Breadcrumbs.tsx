import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {item.name}
            </Link>
          ) : (
            <span className="font-medium text-slate-900 dark:text-slate-200">
              {item.name}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
