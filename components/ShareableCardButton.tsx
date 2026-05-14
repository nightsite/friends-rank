"use client";

import { useState } from "react";

type Props = {
  slug: string;
  displayName: string;
};

export function ShareableCardButton({ slug, displayName }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const cardUrl = `/api/og/profile?slug=${encodeURIComponent(slug)}&v=story`;
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/u/${slug}` : `/u/${slug}`;

  async function createLocalFallbackCard(): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas-unavailable");

    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#0a0a0a");
    bg.addColorStop(1, "#1f2937");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(540, 500, 80, 540, 500, 620);
    glow.addColorStop(0, "rgba(251,191,36,0.26)");
    glow.addColorStop(1, "rgba(251,191,36,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "700 54px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FRIENDS RANK", 540, 220);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 108px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(displayName, 540, 930);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "600 50px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(`@${slug}`, 540, 1010);

    ctx.fillStyle = "#fef3c7";
    ctx.font = "600 42px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("Rate your crew. Level up together.", 540, 1160);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("canvas-to-blob-failed"));
          return;
        }
        resolve(blob);
      }, "image/png");
    });
  }

  async function shareCard() {
    setMsg(null);
    setBusy(true);
    try {
      let blob: Blob;
      const res = await fetch(cardUrl, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        blob = await createLocalFallbackCard();
        setMsg(`Server-Card fehlgeschlagen (HTTP ${res.status}) - lokale Card erstellt.`);
      } else {
        blob = await res.blob();
        if (!blob.type.startsWith("image/")) {
          blob = await createLocalFallbackCard();
          setMsg("Server-Card ungültig - lokale Card erstellt.");
        }
      }
      const file = new File([blob], `${slug}-friends-rank.png`, { type: blob.type || "image/png" });

      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({
            files: [file],
            title: `${displayName} on Friends Rank`,
            text: `Check out ${displayName}'s Friends Rank profile.`,
            url: profileUrl,
          });
          setMsg("Shared!");
        } catch (err) {
          const aborted =
            err instanceof DOMException && err.name === "AbortError";
          setMsg(aborted ? "Teilen abgebrochen." : "Teilen fehlgeschlagen.");
        }
      } else {
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
        setMsg("Downloaded — drop it in your story.");
      }
    } catch {
      setMsg("Could not generate the share card.");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 3500);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={shareCard}
        disabled={busy}
        className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
      >
        {busy ? "Rendering…" : "📸 Share card"}
      </button>
      {msg ? <span className="text-[11px] text-emerald-300">{msg}</span> : null}
    </div>
  );
}
