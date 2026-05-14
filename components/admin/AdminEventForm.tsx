"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function AdminEventForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [themePreset, setThemePreset] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, description, themePreset, badgeLabel, startsAt, endsAt }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Could not save event.");
        return;
      }
      setMsg("Seasonal event saved.");
      setSlug("");
      setTitle("");
      setDescription("");
      setThemePreset("");
      setBadgeLabel("");
      setStartsAt("");
      setEndsAt("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100"
        placeholder="slug (e.g. summer-split-2026)"
        required
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100"
        placeholder="title"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[70px] w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100"
        placeholder="description"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={themePreset}
          onChange={(e) => setThemePreset(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100"
          placeholder="theme preset (optional)"
        />
        <input
          value={badgeLabel}
          onChange={(e) => setBadgeLabel(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100"
          placeholder="badge label (optional)"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-500">
          Starts at
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="text-xs text-zinc-500">
          Ends at
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save event"}
      </Button>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-300">{msg}</p> : null}
    </form>
  );
}
