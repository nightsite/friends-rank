"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RANK_MAX, RANK_MIN, RANK_OPTIONS } from "@/lib/ranks";
import { RankBadge } from "@/components/RankBadge";

type Props = {
  profileSlug: string;
  initialRatingId?: string | null;
};

export function ProfileRatingForm({ profileSlug, initialRatingId = null }: Props) {
  const router = useRouter();
  const [rank, setRank] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (rank < RANK_MIN || rank > RANK_MAX) {
      setErr("Wähle einen gültigen Rank.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSlug, rank, comment }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Profil-Rating fehlgeschlagen.");
        return;
      }
      setMsg("Profil-Rating gespeichert.");
      setComment("");
      setRank(0);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!initialRatingId) return;
    setErr(null);
    setMsg(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/profile-ratings/${initialRatingId}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Profil-Rating konnte nicht gelöscht werden.");
        return;
      }
      setMsg("Profil-Rating gelöscht.");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Rank
        <select
          value={rank || ""}
          onChange={(e) => setRank(Number(e.target.value))}
          className="mt-2 h-11 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/60 px-3 text-sm text-zinc-100"
        >
          <option value="">Rank wählen...</option>
          {RANK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {rank ? (
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <span>Ausgewählt:</span>
          <RankBadge value={rank} size="sm" />
        </div>
      ) : null}
      <textarea
        className="min-h-[80px] w-full rounded-xl border border-zinc-700/70 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
        maxLength={400}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Profil-Feedback schreiben..."
      />
      {err ? (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      ) : null}
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={loading || deleting}>
          {loading ? "Speichert..." : "Profil-Rank speichern"}
        </Button>
        {initialRatingId ? (
          <Button variant="ghost" type="button" onClick={remove} disabled={loading || deleting}>
            {deleting ? "Löscht..." : "Rating löschen"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
