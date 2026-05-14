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

  async function shareCard() {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch(cardUrl);
      if (!res.ok) throw new Error("card-fetch-failed");
      const blob = await res.blob();
      const file = new File([blob], `${slug}-friends-rank.png`, { type: blob.type || "image/png" });

      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `${displayName} on Friends Rank`,
          text: `Check out ${displayName}'s Friends Rank profile.`,
          url: profileUrl,
        });
        setMsg("Shared!");
      } else {
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objUrl);
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
