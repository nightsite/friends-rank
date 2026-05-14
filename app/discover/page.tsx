import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/Avatar";
import { rankScore } from "@/lib/ranks";
import { RankBadge } from "@/components/RankBadge";
import { OnlineDot } from "@/components/OnlineDot";
import { MoodLine } from "@/components/MoodLine";
import { LastSeenLine } from "@/components/LastSeenLine";
import { isOnline } from "@/lib/presence";
import { EmptyState } from "@/components/EmptyState";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default async function DiscoverPage({ searchParams }: Props) {
  const session = await requireSession();
  if (!session) redirect("/login");
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim().toLowerCase();

  const [users, profileRatings, follows] = await Promise.all([
    prisma.user.findMany({
      include: {
        followsReceived: true,
      },
      orderBy: { displayName: "asc" },
    }),
    prisma.profileRating.findMany({
      include: { ratee: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.follow.findMany(),
  ]);

  const now = Date.now();
  const recentRatings = profileRatings.filter(
    (r) => now - new Date(r.updatedAt).getTime() <= WEEK_MS,
  );
  const priorRatings = profileRatings.filter((r) => {
    const age = now - new Date(r.updatedAt).getTime();
    return age > WEEK_MS && age <= WEEK_MS * 2;
  });

  const searched =
    q.length === 0
      ? users
      : users.filter((u) =>
          `${u.displayName} ${u.slug} ${u.bio ?? ""} ${u.favoriteTags ?? ""}`
            .toLowerCase()
            .includes(q),
        );

  const trending = users
    .map((u) => {
      const votes = profileRatings.filter((r) => r.rateeId === u.id);
      const votesRecent = recentRatings.filter((r) => r.rateeId === u.id);
      const followerCount = u.followsReceived.length;
      return {
        user: u,
        score:
          avg(votes.map((v) => rankScore(v.stars))) * 10 +
          followerCount * 1.7 +
          votesRecent.length,
        avg: avg(votes.map((v) => v.stars)),
        followers: followerCount,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const weeklyLeaderboard = users
    .map((u) => {
      const votes = recentRatings.filter((r) => r.rateeId === u.id).map((r) => r.stars);
      return { user: u, avg: avg(votes), count: votes.length };
    })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, 10);

  const mostImproved = users
    .map((u) => {
      const rNow = recentRatings.filter((r) => r.rateeId === u.id).map((r) => r.stars);
      const rPrev = priorRatings.filter((r) => r.rateeId === u.id).map((r) => r.stars);
      if (rNow.length === 0 || rPrev.length === 0) return null;
      const delta = avg(rNow.map((v) => rankScore(v))) - avg(rPrev.map((v) => rankScore(v)));
      return { user: u, delta, nowAvg: avg(rNow), prevAvg: avg(rPrev) };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.delta ?? 0) - (a?.delta ?? 0))
    .slice(0, 8) as { user: (typeof users)[number]; delta: number; nowAvg: number; prevAvg: number }[];

  const followingIds = new Set(
    follows.filter((f) => f.followerId === session.userId).map((f) => f.followingId),
  );

  return (
    <PageShell
      title="Discover profiles"
      description="Search users, track trending profiles, weekly leaders, and most improved."
    >
      <Card hover={false} className="border-zinc-700/50">
        <form className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, slug, bio, tags..."
            className="min-h-12 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-4 py-3 text-zinc-100"
          />
          <button className="min-h-12 rounded-xl border border-zinc-600/80 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-100">
            Search
          </button>
        </form>
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-lg font-semibold text-white">Search results</h2>
        {searched.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              variant="search"
              title={q ? `Nothing matched "${q}"` : "Start typing to find your crew"}
              hint={q ? "Try a name, slug, mood word, or favorite tag." : "We'll surface profiles that match your search."}
            />
          </div>
        ) : null}
        <ul className={`grid gap-3 sm:grid-cols-2 ${searched.length > 0 ? "mt-3" : "hidden"}`}>
          {searched.map((u) => {
            const online = isOnline(u.lastSeenAt);
            return (
              <li key={u.id} className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-3">
                <div className="flex items-center gap-3">
                  <span className="relative inline-flex">
                    <Avatar name={u.displayName} url={u.avatarUrl} size="sm" />
                    {online ? (
                      <span className="absolute -bottom-0.5 -right-0.5">
                        <OnlineDot online size="xs" />
                      </span>
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/u/${u.slug}`} className="text-sm font-medium text-zinc-100 hover:text-amber-300">
                      {u.displayName}
                    </Link>
                    <p className="text-xs text-zinc-500">@{u.slug}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
                      <LastSeenLine lastSeenAt={u.lastSeenAt} />
                      <MoodLine mood={u.mood} />
                    </div>
                  </div>
                  {followingIds.has(u.id) ? (
                    <span className="rounded-full border border-emerald-500/40 px-2 py-1 text-[10px] text-emerald-300">
                      Following
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card hover={false} className="border-zinc-700/50">
          <h2 className="font-display text-lg font-semibold text-white">Trending profiles</h2>
          <ul className="mt-3 space-y-2">
            {trending.map((row, idx) => (
              <li key={row.user.id} className="flex items-center gap-3 rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2">
                <span className="w-6 text-xs text-zinc-500">#{idx + 1}</span>
                <span className="relative inline-flex">
                  <Avatar name={row.user.displayName} url={row.user.avatarUrl} size="sm" />
                  {isOnline(row.user.lastSeenAt) ? (
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <OnlineDot online size="xs" />
                    </span>
                  ) : null}
                </span>
                <Link href={`/u/${row.user.slug}`} className="min-w-0 flex-1 truncate text-sm text-zinc-100 hover:text-amber-300">
                  {row.user.displayName}
                </Link>
                {row.avg ? <RankBadge value={row.avg} size="sm" /> : <span className="text-xs text-zinc-500">--</span>}
              </li>
            ))}
          </ul>
        </Card>

        <Card hover={false} className="border-zinc-700/50">
          <h2 className="font-display text-lg font-semibold text-white">Weekly profile leaderboard</h2>
          <ul className="mt-3 space-y-2">
            {weeklyLeaderboard.map((row, idx) => (
              <li key={row.user.id} className="flex items-center gap-3 rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2">
                <span className="w-6 text-xs text-zinc-500">#{idx + 1}</span>
                <span className="relative inline-flex">
                  <Avatar name={row.user.displayName} url={row.user.avatarUrl} size="sm" />
                  {isOnline(row.user.lastSeenAt) ? (
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <OnlineDot online size="xs" />
                    </span>
                  ) : null}
                </span>
                <Link href={`/u/${row.user.slug}`} className="min-w-0 flex-1 truncate text-sm text-zinc-100 hover:text-amber-300">
                  {row.user.displayName}
                </Link>
                <span className="inline-flex items-center gap-1">
                  <RankBadge value={row.avg} size="sm" />
                  <span className="text-xs text-zinc-400">({row.count})</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-lg font-semibold text-white">Most improved (7d vs prior 7d)</h2>
        <ul className="mt-3 space-y-2">
          {mostImproved.length === 0 ? (
            <li className="text-sm text-zinc-500">Not enough data yet.</li>
          ) : (
            mostImproved.map((row) => (
              <li key={row.user.id} className="flex items-center gap-3 rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2">
                <Avatar name={row.user.displayName} url={row.user.avatarUrl} size="sm" />
                <Link href={`/u/${row.user.slug}`} className="min-w-0 flex-1 truncate text-sm text-zinc-100 hover:text-amber-300">
                  {row.user.displayName}
                </Link>
                <span className={`text-xs font-medium ${row.delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {row.delta >= 0 ? "+" : ""}
                  {row.delta.toFixed(2)}
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </PageShell>
  );
}
