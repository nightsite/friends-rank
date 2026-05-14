import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { createAppNotification } from "@/lib/app-notifications";
import { notifyUser } from "@/lib/web-push";
import { RANK_MAX, RANK_MIN, rankLabel } from "@/lib/ranks";
import { checkAndNotifyPromotion } from "@/lib/rank-promotion";
import { awardXp, XP_RULES } from "@/lib/xp";

export const runtime = "nodejs";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const COMMENT_MAX = 400;

type Body = {
  profileSlug?: unknown;
  rank?: unknown;
  stars?: unknown;
  comment?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileSlug = String(body.profileSlug ?? "").trim().toLowerCase();
  const rank = Number(body.rank ?? body.stars);
  const comment = String(body.comment ?? "").trim().slice(0, COMMENT_MAX);

  if (!profileSlug) {
    return NextResponse.json({ error: "Zielprofil fehlt." }, { status: 400 });
  }
  if (!Number.isInteger(rank) || rank < RANK_MIN || rank > RANK_MAX) {
    return NextResponse.json(
      { error: `Rank must be between ${RANK_MIN} and ${RANK_MAX}.` },
      { status: 400 },
    );
  }

  const ratee = await prisma.user.findUnique({ where: { slug: profileSlug } });
  if (!ratee) return NextResponse.json({ error: "Profil nicht gefunden." }, { status: 404 });
  if (ratee.id === session.userId) {
    return NextResponse.json({ error: "Du kannst dein eigenes Profil nicht ranken." }, { status: 400 });
  }

  const existing = await prisma.profileRating.findUnique({
    where: { raterId_rateeId: { raterId: session.userId, rateeId: ratee.id } },
  });
  if (existing) {
    const waitMs = WEEK_MS - (Date.now() - new Date(existing.updatedAt).getTime());
    if (waitMs > 0) {
      const days = Math.ceil(waitMs / (24 * 60 * 60 * 1000));
      return NextResponse.json(
        { error: `Du kannst dieses Profil erst in ${days} Tag${days === 1 ? "" : "en"} erneut ranken.` },
        { status: 429 },
      );
    }
  }

  await prisma.profileRating.upsert({
    where: { raterId_rateeId: { raterId: session.userId, rateeId: ratee.id } },
    create: {
      raterId: session.userId,
      rateeId: ratee.id,
      stars: rank,
      comment,
    },
    update: {
      stars: rank,
      comment,
    },
  });

  const rater = await prisma.user.findUnique({ where: { id: session.userId } });
  if (rater) {
    const bodyText = `${rankLabel(rank)}${comment ? ` · ${comment.slice(0, 80)}` : ""}`;
    void createAppNotification({
      userId: ratee.id,
      kind: "profile_rating_received",
      title: `${rater.displayName} hat dein Profil gerankt`,
      body: bodyText,
      href: `/u/${ratee.slug}`,
    }).catch(() => {});
    void notifyUser({
      userId: ratee.id,
      title: `${rater.displayName} hat dein Profil gerankt`,
      body: bodyText,
      url: `/u/${ratee.slug}`,
    }).catch(() => {});
    const challengerBonus = rank === RANK_MAX ? XP_RULES.topRankBonus : 0;
    void awardXp(rater.id, XP_RULES.giveProfileRating + challengerBonus, "rating a profile").catch(() => {});
    void awardXp(ratee.id, XP_RULES.receiveProfileRating + challengerBonus, "profile rating received").catch(() => {});
  }

  // Promotion check on overall profile rank.
  void (async () => {
    try {
      const agg = await prisma.profileRating.aggregate({
        where: { rateeId: ratee.id },
        _avg: { stars: true },
      });
      const avg = agg._avg.stars != null ? Number(agg._avg.stars) : null;
      if (avg == null) return;
      await checkAndNotifyPromotion({
        userId: ratee.id,
        scope: "profile",
        rank: avg,
        scopeLabel: "Profile",
        href: `/u/${ratee.slug}`,
      });
    } catch {
      /* non-fatal */
    }
  })();

  return NextResponse.json({ ok: true });
}
