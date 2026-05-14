"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function AdminInviteForm() {
  const [note, setNote] = useState("");
  const [expiresDays, setExpiresDays] = useState(14);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, expiresDays }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        token?: string;
      };
      if (!res.ok || !data.token) {
        setError(data.error || "Could not create invite.");
        return;
      }
      const url = `${window.location.origin}/invite/${data.token}`;
      setResult(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={createInvite} className="space-y-3">
      <input
        className="min-h-11 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional): for who is this invite?"
        maxLength={160}
      />
      <label className="block text-xs text-zinc-500">
        Expires in days
        <input
          type="number"
          min={1}
          max={90}
          value={expiresDays}
          onChange={(e) => setExpiresDays(Number(e.target.value))}
          className="mt-1 min-h-11 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create invite link"}
      </Button>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {result ? (
        <p className="text-sm text-emerald-300">
          Invite URL:{" "}
          <a href={result} className="underline" target="_blank" rel="noreferrer">
            {result}
          </a>
        </p>
      ) : null}
    </form>
  );
}
