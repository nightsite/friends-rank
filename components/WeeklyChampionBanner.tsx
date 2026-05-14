import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { getOrCrownWeeklyChampion } from "@/lib/weekly-champion";
import { WeeklyChampionConfetti } from "@/components/WeeklyChampionConfetti";

type Props = {
  viewerId?: string | null;
};

export async function WeeklyChampionBanner({ viewerId }: Props) {
  const champion = await getOrCrownWeeklyChampion();
  if (!champion) return null;

  const youAreChampion = !!viewerId && viewerId === champion.user.id;

  return (
    <section
      aria-labelledby="weekly-champion-heading"
      className="champion-banner relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-zinc-950/80 p-5 shadow-lg shadow-amber-900/15"
    >
      <WeeklyChampionConfetti weekKey={champion.weekKey} viewerIsChampion={youAreChampion} />
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-3xl drop-shadow" aria-hidden>
          👑
        </span>
        <Avatar
          name={champion.user.displayName}
          url={champion.user.avatarUrl}
          size="md"
          animate
        />
        <div className="min-w-0 flex-1">
          <p
            id="weekly-champion-heading"
            className="text-[11px] font-medium uppercase tracking-widest text-amber-300"
          >
            Champion of {champion.weekKey}
          </p>
          <Link
            href={`/u/${champion.user.slug}`}
            className="font-display text-xl font-semibold text-white hover:text-amber-200"
          >
            {champion.user.displayName}
          </Link>
          <p className="mt-0.5 text-xs text-zinc-400">
            {champion.votes} weekly votes ·{" "}
            <span className="text-amber-300">{champion.score.toFixed(2)} avg score</span>
            {youAreChampion ? " · that's you 👑" : ""}
          </p>
        </div>
        <Link
          href={`/u/${champion.user.slug}`}
          className="hidden whitespace-nowrap rounded-full border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/10 sm:inline-block"
        >
          Visit profile →
        </Link>
      </div>
    </section>
  );
}
