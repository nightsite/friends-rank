"use client";

import { useEffect, useState } from "react";
import { fireConfetti, fireSparkles } from "@/lib/confetti";

type Variant = "promotion" | "achievement" | "levelup";

type Props = {
  id: string;
  title: string;
  body: string;
  variant: Variant;
  ackEndpoint: string;
};

const VARIANT: Record<Variant, { emoji: string; border: string; bg: string; ring: string }> = {
  promotion: {
    emoji: "🚀",
    border: "border-amber-500/60",
    bg: "from-amber-500/25 to-rose-500/15",
    ring: "ring-amber-400/40",
  },
  achievement: {
    emoji: "🏅",
    border: "border-violet-500/60",
    bg: "from-violet-500/25 to-fuchsia-500/15",
    ring: "ring-violet-400/40",
  },
  levelup: {
    emoji: "✨",
    border: "border-emerald-500/60",
    bg: "from-emerald-500/25 to-teal-500/15",
    ring: "ring-emerald-400/40",
  },
};

export function NotificationToast({ id, title, body, variant, ackEndpoint }: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (variant === "promotion") {
      fireConfetti({ count: 120 });
      fireSparkles({ count: 80, tint: "#fbbf24" });
    } else if (variant === "levelup") {
      fireSparkles({ count: 70, tint: "#34d399" });
    } else {
      fireSparkles({ count: 50, tint: "#a78bfa" });
    }
    const hideTimer = setTimeout(() => setOpen(false), 7200);
    const ackTimer = setTimeout(() => {
      try {
        fetch(ackEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    }, 600);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(ackTimer);
    };
  }, [id, ackEndpoint, variant]);

  if (!open) return null;

  const v = VARIANT[variant];
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[max(1.5rem,env(safe-area-inset-top))] z-[80] flex justify-center px-4"
    >
      <div
        className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border ${v.border} bg-gradient-to-br ${v.bg} bg-zinc-950/95 px-4 py-3 shadow-2xl shadow-black/40 ring-1 ${v.ring} backdrop-blur-md`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl drop-shadow" aria-hidden>
            {v.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold text-white">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-200">{body}</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setOpen(false)}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
