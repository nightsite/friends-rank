import { prisma } from "./prisma";
import { rankScore } from "./ranks";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type CategoryMovement = {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  recentAvg: number;
  priorAvg: number;
  delta: number;
  recentVotes: number;
};

export type DigestData = {
  climbers: CategoryMovement[];
  sliders: CategoryMovement[];
  quote: {
    id: string;
    body: string;
    raterName: string;
    rateeName: string;
    categoryName: string;
    reactionCount: number;
    createdAt: string;
  } | null;
};

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export async function getDigestData(now: Date = new Date()): Promise<DigestData> {
  const recentSince = new Date(now.getTime() - WEEK_MS);
  const priorSince = new Date(now.getTime() - 2 * WEEK_MS);

  // Keep queries mostly sequential here to avoid connection spikes on low pool limits.
  const users = await prisma.user.findMany();
  const categories = await prisma.category.findMany();
  const ratings = await prisma.rating.findMany({
    where: { updatedAt: { gte: priorSince } },
    include: { ratee: true, category: true, rater: true },
  });
  const candidateReplies = await prisma.rating.findMany({
    where: { createdAt: { gte: recentSince } },
    include: {
      rater: true,
      ratee: true,
      category: true,
      reactions: true,
    },
  });

  const moves: CategoryMovement[] = [];
  for (const cat of categories) {
    for (const u of users) {
      const recent = ratings
        .filter((r) => r.categoryId === cat.id && r.rateeId === u.id && r.updatedAt >= recentSince)
        .map((r) => rankScore(r.stars));
      const prior = ratings
        .filter(
          (r) =>
            r.categoryId === cat.id &&
            r.rateeId === u.id &&
            r.updatedAt < recentSince &&
            r.updatedAt >= priorSince,
        )
        .map((r) => rankScore(r.stars));
      if (recent.length === 0 || prior.length === 0) continue;
      const ra = avg(recent);
      const pa = avg(prior);
      moves.push({
        categoryId: cat.id,
        categorySlug: cat.slug,
        categoryName: cat.name,
        userId: u.id,
        userName: u.displayName,
        avatarUrl: u.avatarUrl,
        recentAvg: ra,
        priorAvg: pa,
        delta: ra - pa,
        recentVotes: recent.length,
      });
    }
  }

  const climbers = [...moves].filter((m) => m.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
  const sliders = [...moves].filter((m) => m.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5);

  let bestQuote: DigestData["quote"] = null;
  let bestScore = -1;
  for (const r of candidateReplies) {
    if (!r.comment) continue;
    const score = r.reactions.length * 10 + r.comment.length / 200;
    if (score > bestScore) {
      bestScore = score;
      bestQuote = {
        id: r.id,
        body: r.comment.length > 220 ? r.comment.slice(0, 217) + "…" : r.comment,
        raterName: r.rater.displayName,
        rateeName: r.ratee.displayName,
        categoryName: r.category.name,
        reactionCount: r.reactions.length,
        createdAt: r.createdAt.toISOString(),
      };
    }
  }

  return { climbers, sliders, quote: bestQuote };
}
