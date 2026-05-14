"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_EMOJIS, type AllowedEmoji } from "@/lib/reactions";

export type ReactionTotals = Partial<Record<AllowedEmoji, number>>;

type Props = {
  ratingId: string;
  totals: ReactionTotals;
  /** Emojis the current viewer has already reacted with. */
  mine: AllowedEmoji[];
};

export function ReactionBar({ ratingId, totals, mine }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticTotals, setOptimisticTotals] = useState<ReactionTotals>(totals);
  const [optimisticMine, setOptimisticMine] = useState<AllowedEmoji[]>(mine);

  function toggle(emoji: AllowedEmoji) {
    if (pending) return;
    const isMine = optimisticMine.includes(emoji);
    setOptimisticMine((prev) =>
      isMine ? prev.filter((e) => e !== emoji) : [...prev, emoji],
    );
    setOptimisticTotals((prev) => ({
      ...prev,
      [emoji]: Math.max(0, (prev[emoji] ?? 0) + (isMine ? -1 : 1)),
    }));
    startTransition(async () => {
      const res = await fetch(`/api/ratings/${ratingId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) {
        setOptimisticMine((prev) =>
          isMine ? [...prev, emoji] : prev.filter((e) => e !== emoji),
        );
        setOptimisticTotals((prev) => ({
          ...prev,
          [emoji]: Math.max(0, (prev[emoji] ?? 0) + (isMine ? 1 : -1)),
        }));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ALLOWED_EMOJIS.map((e) => {
        const count = optimisticTotals[e] ?? 0;
        const active = optimisticMine.includes(e);
        return (
          <button
            key={e}
            type="button"
            onClick={() => toggle(e)}
            aria-pressed={active}
            className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition touch-manipulation ${
              active
                ? "border-amber-500/50 bg-amber-500/15 text-amber-100"
                : "border-zinc-700/70 bg-zinc-950/40 text-zinc-300 hover:border-zinc-500/80 hover:bg-zinc-900/60"
            } ${pending ? "opacity-80" : ""}`}
          >
            <span aria-hidden>{e}</span>
            <span className="font-mono text-xs tabular-nums text-zinc-400">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
