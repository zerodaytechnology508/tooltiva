import React from "react";
import { ArrowLeftRight, BookUser, Code2, Combine, Contact, CopyMinus, Database, ImageDown, Signature, FileSpreadsheet, GitCompare, Scissors, Table2, Terminal, type LucideProps } from "lucide-react";

const ICONS = {
  FileSpreadsheet,
  ArrowLeftRight,
  Code2,
  Table2,
  Scissors,
  Combine,
  CopyMinus,
  ImageDown,
  Signature,
  BookUser,
  Contact,
  GitCompare,
  Database,
} as const;

/** The registry's icon name as a Lucide icon (decorative: hidden from screen readers). */
export function ToolIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Terminal;
  return <Icon aria-hidden="true" {...props} />;
}
