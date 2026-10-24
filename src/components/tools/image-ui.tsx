"use client";

import React, { useEffect, useRef, useState } from "react";
import { ImageUp, Sparkles } from "lucide-react";
import { buttonClass, primaryButtonClass } from "@/components/tools/csv-ui";

/** Shared building blocks for the image tools. */

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

/**
 * Drop zone with "Choose image", a sample loader, and paste support (Ctrl+V of a
 * copied image). Calls `onFile` with the chosen file; nothing is uploaded.
 */
export function ImageFileInput({
  onFile,
  sample,
  sampleLabel = "Try a sample photo",
}: {
  onFile: (file: File) => void;
  sample: () => Promise<File>;
  sampleLabel?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) onFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
        dragging ? "border-brand-600 bg-brand-50 dark:bg-brand-950/40" : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
      }`}
    >
      <ImageUp aria-hidden="true" className="h-8 w-8 text-brand-700 dark:text-brand-400" />
      <p className="text-base font-semibold text-slate-900 dark:text-white">Drop a photo here</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        JPG, PNG or WebP · or paste with Ctrl+V · the photo stays on your device
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => input.current?.click()} className={primaryButtonClass}>
          <ImageUp aria-hidden="true" className="h-4 w-4" />
          Choose image
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              onFile(await sample());
            } finally {
              setBusy(false);
            }
          }}
          className={buttonClass}
        >
          <Sparkles aria-hidden="true" className="h-4 w-4 text-brand-700 dark:text-brand-400" />
          {busy ? "Preparing…" : sampleLabel}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        aria-label="Choose an image"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

/** A preview of a Blob or File as an <img>, releasing the object URL when it changes. */
export function BlobPreview({ blob, alt, className = "" }: { blob: Blob; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element -- a local object URL, not an optimisable asset
  return <img src={url} alt={alt} className={className} />;
}
