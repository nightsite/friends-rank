import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_SLUGS } from "@/lib/constants";
import { requireSession } from "@/lib/session";
import { getCategoryMeta } from "@/lib/category-meta";
import { PageShell } from "@/components/ui/PageShell";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/RankBadge";

type Props = { params: Promise<{ slug: string }> };

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default async function LeaderboardPage({ params }: Props) {
  const session = await requireSession();
  if (!session) redirect("/login");

  const { slug } = await params;
  if (!CATEGORY_SLUGS.includes(slug as (typeof CATEGORY_SLUGS)[number])) {
    notFound();
  }

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const meta = getCategoryMeta(category.slug);

  const users = await prisma.user.findMany({ orderBy: { displayName: "asc" } });
  const grouped = await prisma.rating.groupBy({
    by: ["rateeId"],
    where: { categoryId: category.id },
    _avg: { stars: true },
    _count: { _all: true },
  });

  const stats = new Map(
    grouped.map((g) => [
      g.rateeId,
      { avg: g._avg.stars != null ? Number(g._avg.stars) : 0, count: g._count._all },
    ]),
  );

  const rows = users
    .map((u) => ({
      user: u,
      avg: stats.get(u.id)?.avg ?? 0,
      count: stats.get(u.id)?.count ?? 0,
    }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count);

  const empty = rows.every((r) => r.count === 0);
  const podium = rows.slice(0, 3);

  return (
    <PageShell
      title={`${category.name} leaderboard`}
      description="Average rank from everyone who rated. Podium is vibes - ties break on vote count."
      actions={
        <Link
          href={`/category/${category.slug}`}
          className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-xl border border-zinc-600/90 bg-zinc-950/50 px-4 py-2.5 text-sm font-medium text-zinc-100 shadow-sm transition hover:border-zinc-500 hover:bg-zinc-900/70"
        >
          Back to ratings
        </Link>
      }
    >
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          {meta?.emoji ?? "🏆"}
        </span>
        <p className="text-sm text-zinc-500">
          Sorted by average, then votes. You&apos;re highlighted when it&apos;s you.
        </p>
      </div>

      {empty ? (
        <div className="glass-panel rounded-2xl border border-dashed border-zinc-700/80 p-10 text-center text-sm text-zinc-400">
          No ratings yet in this category. Be the first to post scores.
        </div>
      ) : (
        <>
          <section aria-label="Top three">
            <h2 className="sr-only">Podium</h2>
            <div className="flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:items-end sm:gap-4">
              {[podium[0], podium[1], podium[2]].map((row, idx) => {
                if (!row) return null;
                const rank = idx + 1;
                const tall = rank === 1;
                const isSelf = row.user.id === session.userId;
                return (
                  <div
                    key={row.user.id}
                    className={`relative flex flex-col items-center text-center ${
                      tall ? "sm:order-2" : rank === 2 ? "sm:order-1" : "sm:order-3"
                    }`}
                  >
                    <div
                      className={`w-full max-w-sm mx-auto rounded-2xl border bg-gradient-to-b p-4 sm:p-5 ${
                        tall
                          ? "min-h-[200px] border-amber-500/40 from-amber-500/20 to-zinc-950/80 pb-8 shadow-xl shadow-amber-900/10 sm:min-h-[240px]"
                          : "min-h-[140px] border-zinc-600/60 from-zinc-700/25 to-zinc-950/80 sm:min-h-[180px]"
                      } ${isSelf ? "ring-2 ring-amber-400/50" : ""}`}
                    >
                      <span className="text-2xl sm:text-3xl" aria-hidden>
                        {medal(rank)}
                      </span>
                      <div className="mt-3 flex justify-center">
                        <Avatar
                          name={row.user.displayName}
                          url={row.user.avatarUrl}
                          size={tall ? "lg" : "md"}
                        />
                      </div>
                      <Link
                        href={`/u/${row.user.slug}`}
                        className="mt-3 font-display text-lg font-semibold text-white hover:text-amber-300 sm:text-xl"
                      >
                        {row.user.displayName}
                      </Link>
                      <div className="mt-2 flex justify-center">
                        {row.count > 0 ? <RankBadge value={row.avg} size="md" /> : <span className="text-zinc-500">--</span>}
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{row.count} vote{row.count === 1 ? "" : "s"}</p>
                      {isSelf ? (
                        <Badge tone="amber" className="mt-3">
                          You
                        </Badge>
                      ) : null}
                    </div>
                    <span className="mt-2 font-mono text-xs text-zinc-500">#{rank}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-2" aria-label="Full standings">
            <h2 className="font-display text-lg font-semibold text-white">Full table</h2>
            <div className="overflow-x-auto rounded-2xl border border-zinc-700/60 bg-zinc-950/40 [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="bg-zinc-900/90 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Avg rank</th>
                    <th className="px-4 py-3">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const isSelf = row.user.id === session.userId;
                    return (
                      <tr
                        key={row.user.id}
                        className={`border-t border-zinc-800/90 ${
                          isSelf ? "bg-amber-500/10" : "bg-transparent"
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-zinc-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-zinc-100">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar name={row.user.displayName} url={row.user.avatarUrl} size="sm" />
                            <div className="min-w-0">
                              <Link href={`/u/${row.user.slug}`} className="block break-words hover:text-amber-300">
                                {row.user.displayName}
                                {isSelf ? (
                                  <Badge tone="amber" className="ml-2 !py-0">
                                    You
                                  </Badge>
                                ) : null}
                              </Link>
                              {row.user.bio ? (
                                <span className="block truncate text-[11px] font-normal text-zinc-500">
                                  {row.user.bio}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-amber-200/95">
                          {row.count > 0 ? <RankBadge value={row.avg} size="sm" /> : "--"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{row.count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
}
