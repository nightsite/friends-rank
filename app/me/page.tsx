import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { ReviewTimestamp } from "@/components/ReviewTimestamp";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/Avatar";
import { ReactionBar, type ReactionTotals } from "@/components/ReactionBar";
import { ReplyThread, type ReplyItem } from "@/components/ReplyThread";
import { isAllowedEmoji, type AllowedEmoji } from "@/lib/reactions";
import { BadgeStrip } from "@/components/BadgeStrip";
import { GlowUpChart } from "@/components/GlowUpChart";
import { computeBadges } from "@/lib/badges";
import { ConfettiOnNewFive } from "@/components/ConfettiOnNewFive";
import { cookies } from "next/headers";
import { RANK_MAX } from "@/lib/ranks";
import { RankBadge } from "@/components/RankBadge";
import { LevelXpBar } from "@/components/LevelXpBar";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { getTitlesForUser } from "@/lib/titles";
import { formatRelative } from "@/lib/format-time";
import { ReasonTagsDisplay } from "@/components/ReasonTagsDisplay";
import { EmptyState } from "@/components/EmptyState";
import { RatingDeleteButton } from "@/components/RatingDeleteButton";

export default async function MePage() {
  const session = await requireSession();
  if (!session) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!me) redirect("/login");

  const ratings = await prisma.rating.findMany({
    where: { rateeId: session.userId },
    include: {
      rater: true,
      category: true,
      reactions: { include: { user: true } },
      replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const byCategory = new Map<string, typeof ratings>();
  for (const r of ratings) {
    const key = r.category.slug;
    const arr = byCategory.get(key) ?? [];
    arr.push(r);
    byCategory.set(key, arr);
  }

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const allUsers = await prisma.user.findMany();
  const allRatings = await prisma.rating.findMany();
  const badges = computeBadges({
    me,
    users: allUsers,
    ratings: allRatings,
    categories,
  });

  const cookieStore = await cookies();
  const lastSeenTopRankId = cookieStore.get("lastSeenTopRankId")?.value ?? null;
  const newestTopRank = ratings.find((r) => r.stars === RANK_MAX);
  const newTopRankId =
    newestTopRank && newestTopRank.id !== lastSeenTopRankId ? newestTopRank.id : null;

  const [achievements, titles] = await Promise.all([
    prisma.achievement.findMany({
      where: { userId: session.userId },
      orderBy: { unlockedAt: "desc" },
    }),
    getTitlesForUser(session.userId),
  ]);

  return (
    <PageShell
      title={`Feedback für ${session.displayName}`}
      description="Was die Crew über dich in den Kategorien sagt. Zeitstempel zeigen Updates - nutze es als Push, nicht als Urteil."
    >
      {newTopRankId ? <ConfettiOnNewFive ratingId={newTopRankId} cookieName="lastSeenTopRankId" /> : null}
      <Card hover={false} className="border-zinc-700/50">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={me.displayName} url={me.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Du</p>
            <p className="font-display text-xl font-semibold text-white">{me.displayName}</p>
            {me.bio ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {me.bio}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-zinc-500">
                No bio yet.{" "}
                <Link href="/settings" className="text-amber-400 hover:text-amber-300">
                  In Einstellungen hinzufügen →
                </Link>
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
                🔥 {me.streakCount}-day streak
              </span>
              <span className="text-xs text-zinc-500">
                {me.streakLastDay ? `Zuletzt aktiv ${me.streakLastDay}` : "Melde dich morgen an, um die Streak zu halten"}
              </span>
            </div>
            <LevelXpBar xp={me.xp} className="mt-4 max-w-sm" />
            {titles.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {titles.map((t) => (
                  <li
                    key={t.slug}
                    title={t.description}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200"
                  >
                    <span aria-hidden>{t.emoji}</span>
                    {t.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <BadgeStrip items={badges} className="mt-5" />
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Achievements</h2>
            <p className="text-xs text-zinc-500">
              {achievements.length}/{Object.keys(ACHIEVEMENTS).length} unlocked - einige bleiben hidden, bis du sie triggerst.
            </p>
          </div>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.values(ACHIEVEMENTS).map((def) => {
            const unlocked = achievements.find((a) => a.slug === def.slug);
            return (
              <li
                key={def.slug}
                className={`rounded-2xl border px-3 py-3 ${
                  unlocked
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-zinc-800/80 bg-zinc-950/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-2xl ${unlocked ? "" : "grayscale opacity-40"}`} aria-hidden>
                    {def.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-display text-sm font-semibold ${
                        unlocked ? "text-amber-100" : "text-zinc-400"
                      }`}
                    >
                      {unlocked ? def.title : "??? Hidden achievement"}
                    </p>
                    <p
                      className={`mt-0.5 text-xs leading-relaxed ${
                        unlocked ? "text-zinc-300" : "text-zinc-600"
                      }`}
                    >
                      {unlocked ? def.description : "Unlock-Bedingung ist hidden - triggere sie im Spiel."}
                    </p>
                    {unlocked ? (
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-amber-300/80">
                        Unlocked {formatRelative(new Date(unlocked.unlockedAt))}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Dein Glow-up</h2>
            <p className="text-xs text-zinc-500">
              Wöchentlicher Schnitt pro Kategorie, letzte ~10 Wochen. Steigende Linie = gut.
            </p>
          </div>
          <Link
            href="/digest"
            className="text-xs font-medium text-amber-400/95 hover:text-amber-300"
          >
            Weekly Digest →
          </Link>
        </div>
        <GlowUpChart
          ratings={ratings.map((r) => ({
            rank: r.stars,
            updatedAt: r.updatedAt.toISOString(),
            categorySlug: r.category.slug,
            categoryName: r.category.name,
          }))}
          className="mt-4"
        />
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-lg font-semibold text-white">Deine Kategorie-Ranks</h2>
        <p className="mt-1 text-xs text-zinc-500">Durchschnittlicher Rank pro Kategorie aus erhaltenem Feedback.</p>
        {ratings.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Noch keine Kategorie-Ranks.</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {categories.map((cat) => {
              const list = byCategory.get(cat.slug) ?? [];
              if (list.length === 0) return null;
              const avg = list.reduce((acc, x) => acc + x.stars, 0) / list.length;
              return (
                <li key={cat.id} className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-100">{cat.name}</span>
                    <RankBadge value={avg} size="sm" />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {list.length} Vote{list.length === 1 ? "" : "s"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {ratings.length === 0 ? (
        <EmptyState
          variant="ratings"
          title="Noch kein Feedback"
          hint="Sobald dich Leute ranken, erscheinen hier Ranks und Kommentare mit Zeitstempeln."
          actionLabel="Crew ranken →"
          actionHref="/"
        />
      ) : (
        <div className="space-y-10">
          {categories.map((cat) => {
            const list = byCategory.get(cat.slug) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={cat.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold text-white">{cat.name}</h2>
                  <div className="flex items-center gap-2">
                    <Badge tone="violet">
                      {list.length} Review{list.length === 1 ? "" : "s"}
                    </Badge>
                    <Link
                      href={`/leaderboard/${cat.slug}`}
                      className="text-sm font-medium text-amber-400/95 hover:text-amber-300"
                    >
                      Leaderboard →
                    </Link>
                  </div>
                </div>
                <ul className="space-y-4">
                  {list.map((r) => {
                    const totals: ReactionTotals = {};
                    const mine: AllowedEmoji[] = [];
                    for (const reaction of r.reactions) {
                      if (!isAllowedEmoji(reaction.emoji)) continue;
                      totals[reaction.emoji] = (totals[reaction.emoji] ?? 0) + 1;
                      if (reaction.userId === session.userId) mine.push(reaction.emoji);
                    }
                    const replies: ReplyItem[] = r.replies.map((rep) => ({
                      id: rep.id,
                      body: rep.body,
                      createdAt: rep.createdAt.toISOString(),
                      imageData: rep.imageData,
                      audioData: rep.audioData,
                      audioMs: rep.audioMs,
                      authorId: rep.authorId,
                      authorName: rep.author.displayName,
                      authorAvatarUrl: rep.author.avatarUrl,
                    }));
                    return (
                      <li key={r.id}>
                        <Card className="border-zinc-700/50">
                          <div className="flex flex-wrap items-start gap-3">
                            <Avatar name={r.rater.displayName} url={r.rater.avatarUrl} size="md" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-zinc-400">Von</p>
                              <Link
                                href={`/u/${r.rater.slug}`}
                                className="font-display text-lg font-semibold text-white hover:text-amber-300"
                              >
                                {r.rater.displayName}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2">
                              <RankBadge value={r.stars} size="sm" className="shrink-0" />
                              {session.isAdmin ? (
                                <RatingDeleteButton endpoint={`/api/ratings/${r.id}`} label="Admin löschen" />
                              ) : null}
                            </div>
                          </div>
                          <ReviewTimestamp
                            createdAt={r.createdAt.toISOString()}
                            updatedAt={r.updatedAt.toISOString()}
                            className="mt-3 border-t border-zinc-800/80 pt-3"
                          />
                          {r.comment ? (
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                              {r.comment}
                            </p>
                          ) : (
                            <p className="mt-4 text-sm italic text-zinc-500">Kein geschriebener Kommentar.</p>
                          )}
                          <ReasonTagsDisplay reasons={r.reasons} className="mt-3" />
                          {r.imageData ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.imageData}
                              alt="Attachment"
                              className="mt-3 max-h-80 rounded-xl border border-zinc-800/70 object-cover"
                            />
                          ) : null}
                          {r.audioData ? (
                            <audio controls src={r.audioData} className="mt-3 w-full max-w-sm" />
                          ) : null}
                          <div className="mt-4">
                            <ReactionBar ratingId={r.id} totals={totals} mine={mine} />
                          </div>
                          <div className="mt-4 border-t border-zinc-800/80 pt-4">
                            <ReplyThread
                              ratingId={r.id}
                              viewerId={session.userId}
                              replies={replies}
                            />
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
