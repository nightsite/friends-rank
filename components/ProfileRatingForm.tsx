"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RANK_MAX, RANK_MIN, RANK_OPTIONS } from "@/lib/ranks";
import { RankBadge } from "@/components/RankBadge";

type Props = {
  profileSlug: string;
};

export function ProfileRatingForm({ profileSlug }: Props) {
  const router = useRouter();
  const [rank, setRank] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (rank < RANK_MIN || rank > RANK_MAX) {
      setErr("Pick a valid rank.");
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
        setErr(data.error || "Could not rate profile.");
        return;
      }
      setMsg("Profile rating saved.");
      setComment("");
      setRank(0);
      router.refresh();
    } finally {
      setLoading(false);
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
          <option value="">Choose rank...</option>
          {RANK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {rank ? (
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <span>Selected:</span>
          <RankBadge value={rank} size="sm" />
        </div>
      ) : null}
      <textarea
        className="min-h-[80px] w-full rounded-xl border border-zinc-700/70 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
        maxLength={400}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Leave profile feedback..."
      />
      {err ? (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      ) : null}
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save profile rank"}
      </Button>
    </form>
  );
}
