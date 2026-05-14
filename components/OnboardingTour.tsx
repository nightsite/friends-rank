"use client";

import { useState } from "react";

type Step = {
  title: string;
  body: string;
  emoji: string;
};

const STEPS: Step[] = [
  {
    emoji: "👋",
    title: "Welcome to Friends Rank",
    body: "Rank your crew across Gym, Gaming, Face Card and Status. Every rating sends a private signal — keep it honest, keep it spicy.",
  },
  {
    emoji: "🎮",
    title: "Climb the ladder",
    body: "Earn XP for every rating, unlock hidden achievements, hold streaks, and climb from Bronze to Challenger. Hit the top of a category and pick up a Title.",
  },
  {
    emoji: "✨",
    title: "Make it yours",
    body: "Drop a profile pic or GIF, set your mood, pick a theme song, and leave private vault notes about each friend. Settings → unlock the looks.",
  },
];

const COOKIE = "onboarded";

export function OnboardingTour() {
  const [open, setOpen] = useState(true);
  const [idx, setIdx] = useState(0);

  function dismiss() {
    setOpen(false);
    try {
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `${COOKIE}=1; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;
  const step = STEPS[idx];
  const last = idx === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-zinc-950/95 p-6 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between">
          <span className="text-3xl" aria-hidden>
            {step.emoji}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-amber-300">
            {idx + 1} / {STEPS.length}
          </span>
        </div>
        <h2 id="onb-title" className="mt-3 font-display text-2xl font-semibold text-white">
          {step.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{step.body}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {idx > 0 ? (
              <button
                type="button"
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                className="min-h-10 rounded-xl border border-zinc-700/70 bg-zinc-900/60 px-3 text-xs font-semibold text-zinc-200"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (last ? dismiss() : setIdx((i) => i + 1))}
              className="min-h-10 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-4 text-xs font-semibold text-zinc-950 shadow"
            >
              {last ? "Let's go" : "Next"}
            </button>
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === idx ? "bg-amber-400" : "bg-zinc-700"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
