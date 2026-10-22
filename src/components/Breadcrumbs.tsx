import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
        <li>
          <Link href="/" className="rounded hover:text-slate-900 hover:underline dark:hover:text-white">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-600" />
            {item.href ? (
              <Link href={item.href} className="rounded hover:text-slate-900 hover:underline dark:hover:text-white">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-slate-900 dark:text-slate-200">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
