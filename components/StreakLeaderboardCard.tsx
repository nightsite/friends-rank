import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";

type Props = {
  limit?: number;
};

export async function StreakLeaderboardCard({ limit = 5 }: Props) {
  let rows: { id: string; slug: string; displayName: string; avatarUrl: string | null; streakCount: number }[] = [];
  try {
    rows = await prisma.user.findMany({
      where: { streakCount: { gt: 0 } },
      orderBy: { streakCount: "desc" },
      take: limit,
      select: {
        id: true,
        slug: true,
        displayName: true,
        avatarUrl: true,
        streakCount: true,
      },
    });
  } catch {
    rows = [];
  }

  return (
    <section className="glass-panel rounded-2xl border border-zinc-700/50 p-4">
      <div className="flex items-end justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-white">🔥 Streak leaderboard</h2>
        <span className="text-[11px] text-zinc-500">Daily login streaks</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Nobody is on a streak yet — sign in tomorrow to start one.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {rows.map((u, idx) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/40 px-3 py-2"
            >
              <span className="w-6 text-xs text-zinc-500">#{idx + 1}</span>
              <Avatar name={u.displayName} url={u.avatarUrl} size="sm" />
              <Link
                href={`/u/${u.slug}`}
                className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100 hover:text-amber-300"
              >
                {u.displayName}
              </Link>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                {u.streakCount} 🔥
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
