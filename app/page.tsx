import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { CATEGORY_META, getCategoryMeta } from "@/lib/category-meta";
import type { CategorySlug } from "@/lib/constants";
import { PageShell } from "@/components/ui/PageShell";
import { Badge } from "@/components/ui/Badge";
import { RecentActivity, type ActivityItem } from "@/components/RecentActivity";
import { formatRelative } from "@/lib/format-time";
import { Avatar } from "@/components/Avatar";
import { BadgeStrip } from "@/components/BadgeStrip";
import { computeBadges } from "@/lib/badges";
import { getDigestData, type DigestData } from "@/lib/digest";
import { RankBadge } from "@/components/RankBadge";
import { HoverProfileCard } from "@/components/HoverProfileCard";
import { getCrew } from "@/lib/crew";
import { OnlineDot } from "@/components/OnlineDot";
import { MoodLine } from "@/components/MoodLine";
import { LastSeenLine } from "@/components/LastSeenLine";
import { isOnline } from "@/lib/presence";
import { WeeklyChampionBanner } from "@/components/WeeklyChampionBanner";
import { DailyChallengeBanner } from "@/components/DailyChallengeBanner";
import { RoastOfTheDay } from "@/components/RoastOfTheDay";
import { StreakLeaderboardCard } from "@/components/StreakLeaderboardCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends Rank — Rate your crew. Level up together.",
  description:
    "Rank your crew across Gym, Gaming, Face Card and Status. Climb the ladder from Bronze to Challenger.",
  openGraph: {
    title: "Friends Rank",
    description: "Rate your crew. Level up together.",
    images: [{ url: "/api/og/profile", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Friends Rank",
    description: "Rate your crew. Level up together.",
    images: ["/api/og/profile"],
  },
};

const PEERS = 4;
const TOTAL_PAIRS = 4 * PEERS;

export default async function HomePage() {
  const session = await requireSession();
  if (!session) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!me) redirect("/login");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const categoryIds = categories.map((c) => c.id);
  // Run queries mostly sequentially to avoid hitting low DB pool limits.
  const countsByCategory = await prisma.rating.groupBy({
    by: ["categoryId"],
    where: { raterId: session.userId },
    _count: { _all: true },
  });
  const totalGiven = await prisma.rating.count({ where: { raterId: session.userId } });
  const lastTouch = await prisma.rating.findFirst({
    where: {
      OR: [{ raterId: session.userId }, { rateeId: session.userId }],
    },
    orderBy: { updatedAt: "desc" },
    include: { category: true, rater: true, ratee: true },
  });
  const recentRaw = await prisma.rating.findMany({
    take: 8,
    orderBy: { updatedAt: "desc" },
    include: { rater: true, ratee: true, category: true },
  });
  const allUsers = await prisma.user.findMany();
  const allRatings = await prisma.rating.findMany();
  const digest: DigestData = await getDigestData().catch(() => ({
    climbers: [],
    sliders: [],
    quote: null,
  }));
  const hallGrouped = await prisma.rating.groupBy({
    by: ["categoryId", "rateeId"],
    where: { categoryId: { in: categoryIds } },
    _avg: { stars: true },
    _count: { _all: true },
  });

  const countMap = new Map(countsByCategory.map((c) => [c.categoryId, c._count._all]));

  const userById = new Map(allUsers.map((u) => [u.id, u]));
  const hallRows = categories.map((cat) => {
    const groupedForCategory = hallGrouped
      .filter((g) => g.categoryId === cat.id && g._count._all > 0)
      .sort((a, b) => {
        const diff = Number(b._avg.stars ?? 0) - Number(a._avg.stars ?? 0);
        if (diff !== 0) return diff;
        return b._count._all - a._count._all;
      });
    const top = groupedForCategory[0];
    const topUser = top ? userById.get(top.rateeId) : null;
    return {
      category: cat,
      leader:
        top && topUser
          ? {
              slug: topUser.slug,
              displayName: topUser.displayName,
              avatarUrl: topUser.avatarUrl,
              avg: Number(top._avg.stars ?? 0),
              votes: top._count._all,
            }
          : null,
    };
  });

  const activityItems: ActivityItem[] = recentRaw.map((r) => ({
    id: r.id,
    raterName: r.rater.displayName,
    rateeName: r.ratee.displayName,
    categoryName: r.category.name,
    categorySlug: r.category.slug,
    updatedAt: r.updatedAt.toISOString(),
  }));

  const lastLine = lastTouch
    ? `Last movement: ${lastTouch.category.name} · ${formatRelative(lastTouch.updatedAt)}`
    : "No ratings yet — you can be first.";

  const badges = computeBadges({ me, users: allUsers, ratings: allRatings, categories });

  const crew = (await getCrew()).filter((u) => u.id !== session.userId);

  return (
    <PageShell
      title={`Hey, ${session.displayName}`}
      description="Tap a friend to see their profile, or jump into a category to rank them."
    >
      <WeeklyChampionBanner viewerId={session.userId} />
      <DailyChallengeBanner userId={session.userId} />
      <RoastOfTheDay />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-white">Crew</h2>
          <Link href="/discover" className="text-xs font-medium text-amber-400/95 hover:text-amber-300">
            Open full crew page →
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {crew.map((u) => {
            const online = isOnline(u.lastSeenAt);
            return (
              <li key={u.id}>
                <HoverProfileCard
                  slug={u.slug}
                  displayName={u.displayName}
                  avatarUrl={u.avatarUrl}
                  bio={u.bio}
                  rankValue={u.avgRank || undefined}
                  mood={u.mood}
                  lastSeenAt={u.lastSeenAt}
                >
                  <Link
                    href={`/u/${u.slug}`}
                    className="group flex w-full flex-col items-center gap-2 rounded-2xl border border-zinc-700/60 bg-zinc-950/40 p-4 text-center transition hover:-translate-y-0.5 hover:border-amber-500/40"
                  >
                    <span className="relative inline-flex">
                      <Avatar
                        name={u.displayName}
                        url={u.avatarUrl}
                        size="lg"
                        animate
                        rankValue={u.avgRank || undefined}
                      />
                      {online ? (
                        <span className="absolute bottom-1 right-1">
                          <OnlineDot online size="md" />
                        </span>
                      ) : null}
                    </span>
                    <p className="font-display text-sm font-semibold text-white group-hover:text-amber-300">
                      {u.displayName}
                    </p>
                    <MoodLine mood={u.mood} />
                    <LastSeenLine lastSeenAt={u.lastSeenAt} />
                    {u.avgRank ? (
                      <RankBadge value={u.avgRank} size="sm" />
                    ) : (
                      <p className="text-[11px] text-zinc-500">Unranked</p>
                    )}
                  </Link>
                </HoverProfileCard>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel rounded-2xl border border-zinc-700/50 p-4 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Your progress</p>
          <p className="mt-2 font-display text-3xl font-semibold text-white">
            {totalGiven}
            <span className="text-lg font-normal text-zinc-500">/{TOTAL_PAIRS}</span>
          </p>
          <p className="mt-1 text-sm text-zinc-400">Ranks you&apos;ve given (all categories)</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
              🔥 {me.streakCount}-day streak
            </span>
          </div>
        </div>
        <div className="glass-panel rounded-2xl border border-zinc-700/50 p-4 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Pulse</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{lastLine}</p>
          <BadgeStrip
            items={badges}
            className="mt-3"
            emptyHint="Earn badges by giving honest ratings, holding streaks, or topping a leaderboard."
          />
        </div>
      </div>

      {digest.quote ? (
        <Link
          href="/digest"
          className="block rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-zinc-950/80 p-5 transition hover:border-amber-400/60"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden>
              💬
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-amber-300">
                Quote of the week
              </p>
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-zinc-100">
                &ldquo;{digest.quote.body}&rdquo;
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {digest.quote.raterName} → {digest.quote.rateeName} · {digest.quote.categoryName}
              </p>
            </div>
            <span className="ml-auto whitespace-nowrap text-xs font-medium text-amber-400/95">
              Open digest →
            </span>
          </div>
        </Link>
      ) : null}

      <StreakLeaderboardCard />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-white">Hall of fame</h2>
          <span className="text-xs text-zinc-500">Top avg · min 1 vote</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {hallRows.map(({ category, leader }) => {
            const meta = getCategoryMeta(category.slug);
            return (
              <div
                key={category.id}
                className="glass-panel card-hover flex flex-col gap-2 rounded-2xl border border-zinc-700/50 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xl" aria-hidden>
                    {meta?.emoji ?? "⭐"}
                  </span>
                  <Badge tone="amber">{category.name}</Badge>
                </div>
                {leader ? (
                  <div className="mt-1 flex items-center gap-3">
                    <Avatar name={leader.displayName} url={leader.avatarUrl} size="md" />
                    <div className="min-w-0">
                      <Link
                        href={`/u/${leader.slug}`}
                        className="font-display text-xl font-semibold text-white hover:text-amber-300"
                      >
                        {leader.displayName}
                      </Link>
                      <p className="text-sm text-zinc-400">
                        <span className="mr-1 inline-flex align-middle">
                          <RankBadge value={leader.avg} size="sm" />
                        </span>
                        avg · {leader.votes} vote
                        {leader.votes === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No votes yet in this category.</p>
                )}
                <Link
                  href={`/leaderboard/${category.slug}`}
                  className="mt-1 text-xs font-medium text-amber-400/90 hover:text-amber-300"
                >
                  Open leaderboard →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-white">Categories</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {categories.map((c) => {
            const meta = CATEGORY_META[c.slug as CategorySlug];
            const done = countMap.get(c.id) ?? 0;
            const pct = Math.round((done / PEERS) * 100);
            return (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className={`group relative block overflow-hidden rounded-2xl border border-zinc-700/60 bg-gradient-to-br ${meta.accent} p-[1px] shadow-lg shadow-black/20 transition hover:border-amber-500/35`}
                >
                  <div className="glass-panel h-full rounded-[15px] p-5 card-hover">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-3xl drop-shadow-sm" aria-hidden>
                        {meta.emoji}
                      </span>
                      <Badge tone={done === PEERS ? "emerald" : "neutral"}>
                        {done}/{PEERS} rated
                      </Badge>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-white">{c.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">{meta.tagline}</p>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all group-hover:opacity-95"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="mt-3 inline-flex items-center text-sm font-medium text-amber-400/95 group-hover:text-amber-300">
                      Rate & review
                      <span className="ml-1 transition group-hover:translate-x-0.5" aria-hidden>
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-white">Recent activity</h2>
          <span className="text-xs text-zinc-500">Who rated whom — no comment spoilers</span>
        </div>
        <RecentActivity items={activityItems} />
      </section>
    </PageShell>
  );
}
