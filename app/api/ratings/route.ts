import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { CATEGORY_SLUGS, COMMENT_MAX } from "@/lib/constants";
import { getSessionOptions, type SessionData } from "@/lib/session-config";
import { validateMediaDataUrl } from "@/lib/media-validation";
import { notifyRated } from "@/lib/web-push";
import { createAppNotification } from "@/lib/app-notifications";
import { RANK_MAX, RANK_MIN, rankLabel } from "@/lib/ranks";
import { checkAndNotifyPromotion } from "@/lib/rank-promotion";
import { awardXp, XP_RULES } from "@/lib/xp";
import { checkRatingAchievements } from "@/lib/achievements";
import { normalizeReasons } from "@/lib/reason-tags";
import { maybeCompleteChallenge } from "@/lib/daily-challenge";

export const runtime = "nodejs";

type Body = {
  rateeSlug?: string;
  categorySlug?: string;
  rank?: number;
  stars?: number;
  comment?: string;
  reasons?: unknown;
  imageData?: unknown;
  audioData?: unknown;
  audioMs?: unknown;
};

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(
    request,
    res,
    getSessionOptions(),
  );

  if (!session.userId || !session.slug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rateeSlug = String(body.rateeSlug || "").toLowerCase();
  const categorySlug = String(body.categorySlug || "").toLowerCase();
  const rank = Number(body.rank ?? body.stars);
  const comment = String(body.comment ?? "").slice(0, COMMENT_MAX);

  if (rateeSlug === session.slug) {
    return NextResponse.json({ error: "Du kannst dich nicht selbst bewerten." }, { status: 400 });
  }
  if (
    !CATEGORY_SLUGS.includes(
      categorySlug as (typeof CATEGORY_SLUGS)[number],
    )
  ) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!Number.isInteger(rank) || rank < RANK_MIN || rank > RANK_MAX) {
    return NextResponse.json(
      { error: `Rank muss zwischen ${RANK_MIN} und ${RANK_MAX} liegen.` },
      { status: 400 },
    );
  }

  let reasonsCsv: string | null = null;
  if (body.reasons !== undefined) {
    const v = normalizeReasons(body.reasons);
    if (v && typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    reasonsCsv = (v as string | null) ?? null;
  }

  let imageData: string | null = null;
  let imageMime: string | null = null;
  if (body.imageData) {
    const v = validateMediaDataUrl(body.imageData, "comment-image");
    if (v && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    if (v) {
      imageData = String(body.imageData);
      imageMime = v.mime;
    }
  }

  let audioData: string | null = null;
  let audioMime: string | null = null;
  let audioMs: number | null = null;
  if (body.audioData) {
    const v = validateMediaDataUrl(body.audioData, "comment-audio");
    if (v && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    if (v) {
      audioData = String(body.audioData);
      audioMime = v.mime;
      const ms = Number(body.audioMs);
      audioMs = Number.isFinite(ms) && ms > 0 ? Math.min(60_000, Math.round(ms)) : null;
    }
  }

  const [rater, ratee, category] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.user.findUnique({ where: { slug: rateeSlug } }),
    prisma.category.findUnique({ where: { slug: categorySlug } }),
  ]);

  if (!rater || !ratee || !category) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  await prisma.rating.upsert({
    where: {
      raterId_rateeId_categoryId: {
        raterId: rater.id,
        rateeId: ratee.id,
        categoryId: category.id,
      },
    },
    create: {
      raterId: rater.id,
      rateeId: ratee.id,
      categoryId: category.id,
      stars: rank,
      comment,
      reasons: reasonsCsv,
      imageData,
      imageMime,
      audioData,
      audioMime,
      audioMs,
    },
    update: {
      stars: rank,
      comment,
      reasons: reasonsCsv,
      imageData,
      imageMime,
      audioData,
      audioMime,
      audioMs,
    },
  });

  // Fire-and-forget push notification — don't block the response.
  void notifyRated({
    rateeId: ratee.id,
    fromName: rater.displayName,
    categoryName: category.name,
    rank,
  }).catch(() => {});
  void createAppNotification({
    userId: ratee.id,
    kind: "rating_received",
    title: `${rater.displayName} rated you`,
    body: `${category.name} · ${rankLabel(rank)}`,
    href: "/me",
  }).catch(() => {});

  // XP: rater + ratee, with a Challenger bonus on top.
  const challengerBonus = rank === RANK_MAX ? XP_RULES.topRankBonus : 0;
  void awardXp(rater.id, XP_RULES.giveRating + challengerBonus, "giving a rating").catch(() => {});
  void awardXp(ratee.id, XP_RULES.receiveRating + challengerBonus, "receiving a rating").catch(() => {});

  // Achievement checks (hidden + visible) fire-and-forget.
  void checkRatingAchievements({
    userId: rater.id,
    hour: new Date().getHours(),
    rank,
    rateeId: ratee.id,
  }).catch(() => {});

  // Daily challenge progress check.
  void maybeCompleteChallenge(rater.id).catch(() => {});

  // Promotion check: compute fresh avg for this ratee+category and notify on tier up.
  void (async () => {
    try {
      const agg = await prisma.rating.aggregate({
        where: { rateeId: ratee.id, categoryId: category.id },
        _avg: { stars: true },
      });
      const avg = agg._avg.stars != null ? Number(agg._avg.stars) : null;
      if (avg == null) return;
      await checkAndNotifyPromotion({
        userId: ratee.id,
        scope: `category:${category.slug}`,
        rank: avg,
        scopeLabel: category.name,
        href: `/leaderboard/${category.slug}`,
      });
    } catch {
      /* non-fatal */
    }
  })();

  return res;
}
