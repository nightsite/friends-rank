import Link from "next/link";
import { formatRelative } from "@/lib/format-time";
import { getRoastOfTheDay } from "@/lib/roast";
import { RankBadge } from "@/components/RankBadge";

export async function RoastOfTheDay() {
  const roast = await getRoastOfTheDay();
  if (!roast) return null;

  return (
    <section
      aria-labelledby="roast-heading"
      className="overflow-hidden rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-500/10 to-zinc-950/80 p-5"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl" aria-hidden>
          🌶️
        </span>
        <div className="min-w-0 flex-1">
          <p
            id="roast-heading"
            className="text-[11px] font-medium uppercase tracking-widest text-rose-300"
          >
            Roast of the day
          </p>
          <blockquote className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">
            “{roast.body}”
          </blockquote>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
            <span className="font-medium text-zinc-200">{roast.raterName}</span>
            <span>→</span>
            <Link href={`/u/${roast.rateeSlug}`} className="text-amber-300 hover:text-amber-200">
              {roast.rateeName}
            </Link>
            <Link
              href={`/leaderboard/${roast.categorySlug}`}
              className="rounded-full border border-zinc-700/70 px-2 py-0.5 hover:border-zinc-500"
            >
              {roast.categoryName}
            </Link>
            <RankBadge value={roast.stars} size="sm" />
            <span className="ml-auto">{formatRelative(roast.updatedAt)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
