"use client";

import { useState } from "react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "h-10 w-10 min-h-10 min-w-10 text-xs rounded-xl",
  md: "h-14 w-14 min-h-[3.5rem] min-w-[3.5rem] text-sm rounded-2xl",
  lg: "h-20 w-20 min-h-20 min-w-20 text-lg rounded-2xl",
  xl: "h-28 w-28 min-h-28 min-w-28 text-xl rounded-3xl",
};

type Tier = "bronze" | "silver" | "gold" | "dia" | "platin" | "master" | "challenger";

function tierFromRank(value: number | undefined): Tier | null {
  if (!value || !Number.isFinite(value) || value <= 0) return null;
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

const RIM_CLASS: Record<Tier, string> = {
  bronze: "avatar-rim avatar-rim--bronze",
  silver: "avatar-rim avatar-rim--silver",
  gold: "avatar-rim avatar-rim--gold",
  dia: "avatar-rim avatar-rim--dia",
  platin: "avatar-rim avatar-rim--platin",
  master: "avatar-rim avatar-rim--master",
  challenger: "avatar-rim avatar-rim--challenger",
};

type Props = {
  name: string;
  url?: string | null;
  size?: Size;
  className?: string;
  animate?: boolean;
  /** Average rank value (1-19). When set, draws a tier-colored ring around the avatar. */
  rankValue?: number;
};

export function Avatar({
  name,
  url,
  size = "md",
  className = "",
  animate = true,
  rankValue,
}: Props) {
  const [broken, setBroken] = useState(false);
  const show = Boolean(url && String(url).trim() && !broken);
  const isAnimated = show
    ? /\.gif(\?|#|$)/i.test(String(url)) || String(url).startsWith("data:image/gif")
    : false;
  const tier = tierFromRank(rankValue);
  const rimClass = tier ? RIM_CLASS[tier] : "ring-2 ring-amber-500/25";
  const animatedGifClass =
    animate && isAnimated && !tier
      ? "ring-amber-400/55 shadow-[0_0_0_4px_rgba(251,191,36,0.10)]"
      : "";

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-zinc-600 to-zinc-900 font-bold tracking-tight text-white ${sizes[size]} ${rimClass} ${animatedGifClass} ${className}`.trim()}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url as string}
          alt={`${name} profile`}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
        />
      ) : null}
      <span
        className={`flex h-full w-full items-center justify-center ${show ? "sr-only" : ""}`}
        aria-hidden={show}
      >
        {initials(name)}
      </span>
    </div>
  );
}
