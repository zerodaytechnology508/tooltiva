import React from "react";

/**
 * The Tooltiva mark: a terminal prompt on a solid brand square. The same
 * drawing is used for the favicon and the social preview image.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" fill="#15803d" />
      <path d="M9.5 11.5 14 16l-4.5 4.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 21h6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
