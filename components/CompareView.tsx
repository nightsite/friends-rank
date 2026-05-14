import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/RankBadge";

export type CompareSide = {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  overallRank: number;
  /** Rank score per category slug (1..19) */
  perCategory: Record<string, { rank: number; votes: number }>;
};

export type CompareCategory = {
  slug: string;
  name: string;
  emoji: string;
};

type Props = {
  a: CompareSide;
  b: CompareSide;
  categories: CompareCategory[];
};

function fmtDelta(a: number, b: number) {
  const diff = a - b;
  if (Math.abs(diff) < 0.5) return { txt: "tied", className: "text-zinc-400" };
  if (diff > 0) return { txt: `+${diff.toFixed(1)}`, className: "text-emerald-300" };
  return { txt: diff.toFixed(1), className: "text-rose-300" };
}

export function CompareView({ a, b, categories }: Props) {
  const overall = fmtDelta(a.overallRank, b.overallRank);
  let aWins = 0;
  let bWins = 0;
  for (const cat of categories) {
    const ra = a.perCategory[cat.slug]?.rank ?? 0;
    const rb = b.perCategory[cat.slug]?.rank ?? 0;
    if (Math.abs(ra - rb) >= 0.5) {
      if (ra > rb) aWins++;
      else bWins++;
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {[a, b].map((side) => (
          <Link
            key={side.id}
            href={`/u/${side.slug}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-zinc-700/60 bg-zinc-950/50 p-4 text-center hover:border-amber-500/40"
          >
            <Avatar
              name={side.displayName}
              url={side.avatarUrl}
              size="lg"
              rankValue={side.overallRank || undefined}
              animate
            />
            <p className="font-display text-base font-semibold text-white group-hover:text-amber-300">
              {side.displayName}
            </p>
            {side.overallRank ? (
              <RankBadge value={side.overallRank} size="sm" />
            ) : (
              <span className="text-[11px] text-zinc-500">Unranked</span>
            )}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-zinc-700/60 bg-zinc-950/40 p-3 text-center">
        <span className={`font-display text-xl font-semibold ${aWins >= bWins ? "text-amber-200" : "text-zinc-400"}`}>
          {aWins}
        </span>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">Wins · overall delta</span>
          <span className={`text-sm font-medium ${overall.className}`}>{overall.txt}</span>
        </div>
        <span className={`font-display text-xl font-semibold ${bWins > aWins ? "text-amber-200" : "text-zinc-400"}`}>
          {bWins}
        </span>
      </div>

      <ul className="space-y-2">
        {categories.map((cat) => {
          const ra = a.perCategory[cat.slug]?.rank ?? 0;
          const rb = b.perCategory[cat.slug]?.rank ?? 0;
          const delta = fmtDelta(ra, rb);
          const winner = ra > rb ? "a" : rb > ra ? "b" : "tie";
          return (
            <li
              key={cat.slug}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2"
            >
              <div className={`flex items-center justify-end gap-2 ${winner === "a" ? "" : "opacity-70"}`}>
                {ra ? <RankBadge value={ra} size="sm" /> : <span className="text-xs text-zinc-500">--</span>}
                {a.perCategory[cat.slug]?.votes ? (
                  <span className="text-[10px] text-zinc-500">({a.perCategory[cat.slug]?.votes})</span>
                ) : null}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base" aria-hidden>
                  {cat.emoji}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                  {cat.name}
                </span>
                <span className={`text-[10px] font-medium ${delta.className}`}>{delta.txt}</span>
              </div>
              <div className={`flex items-center gap-2 ${winner === "b" ? "" : "opacity-70"}`}>
                {b.perCategory[cat.slug]?.votes ? (
                  <span className="text-[10px] text-zinc-500">({b.perCategory[cat.slug]?.votes})</span>
                ) : null}
                {rb ? <RankBadge value={rb} size="sm" /> : <span className="text-xs text-zinc-500">--</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
