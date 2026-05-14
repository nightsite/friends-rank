import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/Avatar";
import { ProfileRatingForm } from "@/components/ProfileRatingForm";
import { formatRelative } from "@/lib/format-time";
import { findPresetImage } from "@/lib/profile-presets";
import { FollowButton } from "@/components/FollowButton";
import { ProfileWall } from "@/components/ProfileWall";
import { RankBadge } from "@/components/RankBadge";
import { SwipeProfileNav } from "@/components/SwipeProfileNav";
import { crewNeighbors, getCrew } from "@/lib/crew";
import { OnlineDot } from "@/components/OnlineDot";
import { MoodLine } from "@/components/MoodLine";
import { LastSeenLine } from "@/components/LastSeenLine";
import { isOnline } from "@/lib/presence";
import { LevelXpBar } from "@/components/LevelXpBar";
import { getTitlesForUser } from "@/lib/titles";
import { computeProfileTldr } from "@/lib/ai-tldr";
import { VaultNotePad } from "@/components/VaultNotePad";
import { ThemeSongPlayer } from "@/components/ThemeSongPlayer";
import { ShareableCardButton } from "@/components/ShareableCardButton";
import { ProfileQrCode } from "@/components/ProfileQrCode";
import { EmptyState } from "@/components/EmptyState";
import { RatingDeleteButton } from "@/components/RatingDeleteButton";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const user = await prisma.user.findUnique({
    where: { slug },
    select: { displayName: true, bio: true, slug: true },
  });
  if (!user) return { title: "Profile not found · Friends Rank" };
  const title = `${user.displayName} · Friends Rank`;
  const description = user.bio?.trim() || `${user.displayName}'s Friends Rank profile.`;
  const ogUrl = `/api/og/profile?slug=${encodeURIComponent(user.slug)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/u/${user.slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

function splitTags(raw: string | null) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export default async function PublicProfilePage({ params }: Props) {
  const session = await requireSession();
  if (!session) redirect("/login");
  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { slug },
    include: {
      followsReceived: true,
      followsGiven: true,
      profileRatingsReceived: {
        include: { rater: true },
        orderBy: { updatedAt: "desc" },
        take: 12,
      },
      profilePostsReceived: {
        include: {
          author: true,
          reactions: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!user) notFound();

  const [categories, groupedCategoryRanks, crew, titles, tldr] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.rating.groupBy({
      by: ["categoryId"],
      where: { rateeId: user.id },
      _avg: { stars: true },
      _count: { _all: true },
    }),
    getCrew(),
    getTitlesForUser(user.id),
    computeProfileTldr(user.id),
  ]);

  const myVaultNote =
    session.userId !== user.id
      ? await prisma.vaultNote
          .findUnique({
            where: { ownerId_targetId: { ownerId: session.userId, targetId: user.id } },
          })
          .catch(() => null)
      : null;
  const myProfileRating =
    session.userId !== user.id
      ? await prisma.profileRating
          .findUnique({
            where: { raterId_rateeId: { raterId: session.userId, rateeId: user.id } },
            select: { id: true },
          })
          .catch(() => null)
      : null;
  const { prev, next } = crewNeighbors(crew, user.slug);
  const overallRank = crew.find((c) => c.id === user.id)?.avgRank ?? 0;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const categoryRanks = groupedCategoryRanks
    .map((g) => {
      const category = categoryMap.get(g.categoryId);
      if (!category || g._avg.stars == null) return null;
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        avgRank: Number(g._avg.stars),
        votes: g._count._all,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.avgRank ?? 0) - (a?.avgRank ?? 0)) as {
    id: string;
    name: string;
    slug: string;
    avgRank: number;
    votes: number;
  }[];

  const avg =
    user.profileRatingsReceived.length > 0
      ? user.profileRatingsReceived.reduce((acc, x) => acc + x.stars, 0) /
        user.profileRatingsReceived.length
      : 0;

  const canRate = session.userId !== user.id;
  const isFollowing = user.followsReceived.some((f) => f.followerId === session.userId);
  const bg = user.bgImageUrl || findPresetImage(user.bgPreset) || user.bannerUrl || null;
  const tags = splitTags(user.favoriteTags);
  const cardTone =
    user.cardStyle === "solid"
      ? "bg-zinc-900/90 border-zinc-700/90"
      : user.cardStyle === "outline"
        ? "bg-transparent border-zinc-600/80"
        : "glass-panel border-zinc-700/50";

  return (
    <PageShell
      title={`Profil von ${user.displayName}`}
      description="Öffentliches Profil mit Visuals, Bio, Tags und Profil-Ratings."
      actions={<Link href="/" className="text-sm font-medium text-amber-300">Start</Link>}
    >
      <SwipeProfileNav prev={prev} next={next} />
      <Card hover={false} className={`overflow-hidden ${cardTone}`}>
        {bg ? (
          <div className="hero-banner relative -m-5 mb-0 h-56 overflow-hidden sm:-m-6 sm:h-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bg}
              alt={`${user.displayName} background`}
              className="h-full w-full object-cover"
              style={{
                filter: `blur(${user.bgBlur}px) brightness(${user.bgBrightness}%)`,
              }}
            />
          </div>
        ) : null}

        <div className={`flex flex-wrap items-end gap-4 ${bg ? "-mt-12 sm:-mt-16" : ""}`}>
          <span className="relative inline-flex">
            <Avatar
              name={user.displayName}
              url={user.avatarUrl}
              size="xl"
              rankValue={overallRank || undefined}
            />
            {isOnline(user.lastSeenAt) ? (
              <span className="absolute bottom-1 right-1">
                <OnlineDot online size="md" />
              </span>
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-zinc-500">@{user.slug}</p>
            <h2 className="font-display text-2xl font-semibold text-white">{user.displayName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <LastSeenLine lastSeenAt={user.lastSeenAt} />
              <MoodLine mood={user.mood} />
            </div>
            {overallRank ? (
              <div className="mt-1.5">
                <RankBadge value={overallRank} size="sm" />
              </div>
            ) : null}
            {titles.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {titles.map((t) => (
                  <li
                    key={t.slug}
                    title={t.description}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200"
                  >
                    <span aria-hidden>{t.emoji}</span>
                    {t.label}
                  </li>
                ))}
              </ul>
            ) : null}
            <LevelXpBar xp={user.xp} className="mt-3 max-w-xs" size="sm" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {user.themeAudioUrl ? (
                <ThemeSongPlayer src={user.themeAudioUrl} displayName={user.displayName} />
              ) : null}
              <ShareableCardButton slug={user.slug} displayName={user.displayName} />
              {session.userId === user.id ? (
                <ProfileQrCode
                  path={`/u/${user.slug}`}
                  url={process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/u/${user.slug}` : null}
                  displayName={user.displayName}
                />
              ) : null}
            </div>
            {user.bio ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{user.bio}</p>
            ) : null}
            {user.pinnedPost ? (
              <p
                className="mt-3 rounded-lg border px-3 py-2 text-sm italic"
                style={{
                  borderColor: `${user.accentColor ?? "#f59e0b"}66`,
                  color: user.accentColor ?? "#fcd34d",
                }}
              >
                &ldquo;{user.pinnedPost}&rdquo;
              </p>
            ) : null}
            {tags.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-zinc-700/70 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-300"
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Card>

      {tldr ? (
        <Card hover={false} className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-zinc-950/60">
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden>
              🧠
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-widest text-amber-300">
                Crew TL;DR
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-100">{tldr.oneLiner}</p>
              {tldr.bullets.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                  {tldr.bullets.map((b, i) => (
                    <li key={i}>• {b}</li>
                  ))}
                </ul>
              ) : null}
              {tldr.topTags.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {tldr.topTags.map((t) => (
                    <li
                      key={t.slug}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-100"
                    >
                      <span aria-hidden>{t.emoji}</span>
                      {t.label} <span className="text-amber-300/80">×{t.count}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
                Auto-Zusammenfassung · {tldr.ratingsCount} Ratings analysiert
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {session.userId !== user.id ? (
        <Card hover={false} className="border-amber-500/30">
          <h3 className="font-display text-lg font-semibold text-white">🔒 Deine privaten Vault-Notizen</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Nur für dich sichtbar. Speichert automatisch beim Tippen.
          </p>
          <div className="mt-3">
            <VaultNotePad
              targetSlug={user.slug}
              targetDisplayName={user.displayName}
              initialBody={myVaultNote?.body ?? ""}
            />
          </div>
        </Card>
      ) : null}

      <div className={`grid gap-4 ${canRate ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        <Card hover={false} className="border-zinc-700/50">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Profil-Score</p>
          <div className="mt-2">{avg ? <RankBadge value={avg} size="lg" /> : <span className="text-zinc-500">--</span>}</div>
          <p className="text-sm text-zinc-400">
            {user.profileRatingsReceived.length} Vote{user.profileRatingsReceived.length === 1 ? "" : "s"}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {user.followsReceived.length} Follower{user.followsReceived.length === 1 ? "" : "s"} ·{" "}
            {user.followsGiven.length} Following
          </p>
          {session.userId !== user.id ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FollowButton slug={user.slug} initialFollowing={isFollowing} />
              <Link
                href={`/compare?a=me&b=${user.slug}`}
                className="inline-flex min-h-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
              >
                Mit mir vergleichen ↔
              </Link>
            </div>
          ) : null}
        </Card>
        {canRate ? (
          <Card hover={false} className="border-zinc-700/50">
            <h3 className="font-display text-lg font-semibold text-white">Dieses Profil ranken</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Du kannst alle 7 Tage genau einen Rank für dieses Profil abgeben.
            </p>
            <div className="mt-3">
              <ProfileRatingForm profileSlug={user.slug} initialRatingId={myProfileRating?.id ?? null} />
            </div>
          </Card>
        ) : null}
      </div>

      <Card hover={false} className="border-zinc-700/50">
        <h3 className="font-display text-lg font-semibold text-white">Kategorie-Ranks</h3>
        <p className="mt-1 text-xs text-zinc-500">So performt dieses Profil pro Kategorie.</p>
        {categoryRanks.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              variant="ratings"
              title="Noch keine Kategorie-Ranks"
              hint="Sobald Freunde dieses Profil in einer Kategorie ranken, erscheint es hier."
            />
          </div>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {categoryRanks.map((row) => (
              <li key={row.id} className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/leaderboard/${row.slug}`} className="text-sm font-medium text-zinc-100 hover:text-amber-300">
                    {row.name}
                  </Link>
                  <RankBadge value={row.avgRank} size="sm" />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {row.votes} Vote{row.votes === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h3 className="font-display text-lg font-semibold text-white">Wall</h3>
        <p className="mt-1 text-xs text-zinc-500">Hinterlasse Kommentare auf dem Profil und reagiere auf Posts.</p>
        <div className="mt-4">
          <ProfileWall
            targetSlug={user.slug}
            viewerId={session.userId}
            posts={user.profilePostsReceived.map((p) => ({
              id: p.id,
              body: p.body,
              createdAt: p.createdAt.toISOString(),
              authorId: p.authorId,
              authorName: p.author.displayName,
              authorAvatarUrl: p.author.avatarUrl,
              reactions: p.reactions.map((r) => ({
                id: r.id,
                emoji: r.emoji,
                userId: r.userId,
              })),
            }))}
          />
        </div>
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h3 className="font-display text-lg font-semibold text-white">Neuestes Profil-Feedback</h3>
        {user.profileRatingsReceived.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Noch keine Profil-Ratings.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {user.profileRatingsReceived.map((r) => (
              <li key={r.id} className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-zinc-300">
                    <span className="font-medium text-white">{r.rater.displayName}</span> ·{" "}
                    <RankBadge value={r.stars} size="sm" className="align-middle" />
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{formatRelative(new Date(r.updatedAt))}</span>
                    {session.isAdmin ? (
                      <RatingDeleteButton endpoint={`/api/profile-ratings/${r.id}`} label="Admin löschen" />
                    ) : null}
                  </div>
                </div>
                {r.comment ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{r.comment}</p>
                ) : (
                  <p className="mt-2 text-sm italic text-zinc-500">Kein geschriebener Kommentar.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h3 className="font-display text-lg font-semibold text-white">Letzte Timeline</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          {user.profilePostsReceived.slice(0, 5).map((post) => (
            <li key={`p-${post.id}`} className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2">
              <span className="font-medium text-zinc-100">{post.author.displayName}</span> hat auf der Wall gepostet ·{" "}
              <span className="text-zinc-500">{formatRelative(new Date(post.createdAt))}</span>
            </li>
          ))}
          {user.profileRatingsReceived.slice(0, 5).map((r) => (
            <li key={`r-${r.id}`} className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2">
              <span className="font-medium text-zinc-100">{r.rater.displayName}</span> hat das Profil gerankt{" "}
              <RankBadge value={r.stars} size="sm" className="mx-1 align-middle" /> ·{" "}
              <span className="text-zinc-500">{formatRelative(new Date(r.updatedAt))}</span>
            </li>
          ))}
        </ul>
      </Card>
    </PageShell>
  );
}
