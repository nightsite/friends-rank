"use client";

import { useState } from "react";

type Props = {
  slug: string;
  label: string;
};

export function AdminImpersonateButton({ slug, label }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        let message: string | undefined;
        if (ct.includes("application/json")) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          message = data.error;
        }
        setError(message ?? `Konnte nicht wechseln (HTTP ${res.status}).`);
        return;
      }
      window.location.href = `/u/${slug}`;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
      >
        {busy ? "Wechsle..." : `Als ${label} einloggen`}
      </button>
      {error ? <span className="text-[11px] text-red-400">{error}</span> : null}
    </div>
  );
}

