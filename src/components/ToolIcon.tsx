import React from "react";
import { ArrowLeftRight, Code2, FileSpreadsheet, Table2, Terminal, type LucideProps } from "lucide-react";

const ICONS = {
  FileSpreadsheet,
  ArrowLeftRight,
  Code2,
  Table2,
} as const;

/** The registry's icon name as a Lucide icon (decorative: hidden from screen readers). */
export function ToolIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Terminal;
  return <Icon aria-hidden="true" {...props} />;
}
