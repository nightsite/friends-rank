"use client";

import { useState } from "react";

type Props = {
  endpoint: string;
  onDone?: () => void;
  label?: string;
};

export function RatingDeleteButton({ endpoint, onDone, label = "Löschen" }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Löschen.");
        return;
      }
      onDone?.();
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="inline-flex min-h-8 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 text-[11px] font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-60"
      >
        {busy ? "Löscht..." : label}
      </button>
      {error ? <span className="text-[10px] text-red-400">{error}</span> : null}
    </div>
  );
}

