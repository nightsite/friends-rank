import { computeChallengeProgress, pickChallengeForDay } from "@/lib/daily-challenge";

type Props = {
  userId: string;
};

export async function DailyChallengeBanner({ userId }: Props) {
  const challenge = pickChallengeForDay();
  const progress = await computeChallengeProgress({ userId, challenge });
  const pct = Math.round((progress.done / Math.max(1, progress.target)) * 100);

  return (
    <section
      aria-labelledby="daily-challenge-heading"
      className={`overflow-hidden rounded-2xl border p-5 ${
        progress.completed
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-zinc-950/80"
          : "border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-zinc-950/80"
      }`}
    >
      <div className="flex flex-wrap items-start gap-4">
        <span className="text-3xl drop-shadow" aria-hidden>
          {challenge.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p
            id="daily-challenge-heading"
            className="text-[11px] font-medium uppercase tracking-widest text-amber-300"
          >
            Daily challenge
          </p>
          <p className="font-display text-lg font-semibold text-white">{challenge.title}</p>
          <p className="mt-0.5 text-xs text-zinc-400">{challenge.description}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-900">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  progress.completed
                    ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                    : "bg-gradient-to-r from-amber-400 to-orange-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-xs font-medium text-zinc-300">
              {progress.done}/{progress.target}
            </span>
          </div>
          {progress.completed ? (
            <p className="mt-2 text-xs font-medium text-emerald-300">
              🎉 Cleared — +75 XP banked.
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-zinc-500">
              Reward: +75 XP and a streak boost.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
