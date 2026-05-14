"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  url?: string | null;
  path: string;
  displayName: string;
};

export function ProfileQrCode({ url, path, displayName }: Props) {
  const [svg, setSvg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>(url || path);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (url && /^https?:/.test(url)) {
      setResolvedUrl(url);
    } else if (typeof window !== "undefined") {
      setResolvedUrl(`${window.location.origin}${path}`);
    }
  }, [url, path]);

  useEffect(() => {
    if (!open) return;
    if (svg) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("@/lib/qr");
        const out = mod.renderQrSvg(resolvedUrl, { scale: 8, quiet: 4 });
        if (!cancelled) setSvg(out);
      } catch {
        if (!cancelled) setSvg(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, resolvedUrl, svg]);

  async function downloadPng() {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;
    const xml = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const objUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const SIZE = 768;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(objUrl);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const dl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dl;
        a.download = `${displayName}-qr.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(dl);
      }, "image/png");
    };
    img.src = objUrl;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-zinc-700/70 bg-zinc-900/60 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-amber-500/40"
      >
        🔳 QR
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-amber-500/40 bg-zinc-950/95 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-widest text-amber-300">Scan to open</p>
            <p className="mt-1 font-display text-lg font-semibold text-white">{displayName}</p>
            <div
              ref={containerRef}
              className="mx-auto mt-4 flex h-64 w-64 items-center justify-center rounded-2xl bg-white p-3"
            >
              {svg ? (
                <div
                  className="h-full w-full"
                  dangerouslySetInnerHTML={{ __html: svg }}
                  aria-label={`QR code for ${resolvedUrl}`}
                />
              ) : (
                <span className="text-xs text-zinc-500">Rendering…</span>
              )}
            </div>
            <p className="mt-3 break-all text-[11px] text-zinc-500">{resolvedUrl}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={downloadPng}
                className="min-h-10 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
              >
                ⬇ PNG
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-10 rounded-xl border border-zinc-700/70 bg-zinc-900/60 px-3 text-xs font-semibold text-zinc-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
