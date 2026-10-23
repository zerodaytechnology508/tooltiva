import React from "react";

/**
 * The Tooltiva mark: a "T" built from a table. The header row is the bar of the T,
 * the middle column its stem, and the lighter cells on each side complete the grid.
 * The same drawing is used for the favicon, app icons, public/logo.svg and the
 * social preview image.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="7.5" fill="#15803d" />
      <rect x="6.5" y="7" width="19" height="5" rx="1.6" fill="#fff" />
      <rect x="13.5" y="12" width="5" height="13" rx="1.6" fill="#fff" />
      <g fill="#fff" fillOpacity=".38">
        <rect x="6.5" y="13.5" width="5.5" height="4.6" rx="1.2" />
        <rect x="6.5" y="19.6" width="5.5" height="4.6" rx="1.2" />
        <rect x="20" y="13.5" width="5.5" height="4.6" rx="1.2" />
        <rect x="20" y="19.6" width="5.5" height="4.6" rx="1.2" />
      </g>
    </svg>
  );
}
