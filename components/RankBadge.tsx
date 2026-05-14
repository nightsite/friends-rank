"use client";

import { rankLabel } from "@/lib/ranks";

type Props = {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
};

function tierFromRank(value: number): "bronze" | "silver" | "gold" | "dia" | "platin" | "master" | "challenger" {
  const v = Math.max(1, Math.min(19, Math.round(value)));
  if (v === 19) return "challenger";
  const idx = Math.floor((v - 1) / 3);
  if (idx === 0) return "bronze";
  if (idx === 1) return "silver";
  if (idx === 2) return "gold";
  if (idx === 3) return "dia";
  if (idx === 4) return "platin";
  return "master";
}

function tierIcon(tier: ReturnType<typeof tierFromRank>): string {
  if (tier === "bronze") return "🥉";
  if (tier === "silver") return "🥈";
  if (tier === "gold") return "🥇";
  if (tier === "dia") return "💎";
  if (tier === "platin") return "🔷";
  if (tier === "master") return "🧠";
  return "⚡";
}

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

export function RankBadge({ value, className = "", size = "md", animated = true }: Props) {
  const tier = tierFromRank(value);
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide",
        "rank-badge",
        `rank-badge--${tier}`,
        animated ? "rank-badge-animated" : "",
        SIZE_CLASS[size],
        className,
      ].join(" ")}
      aria-label={`Rank ${rankLabel(value)}`}
      title={rankLabel(value)}
    >
      <span aria-hidden>{tierIcon(tier)}</span>
      {rankLabel(value)}
    </span>
  );
}
