import { prisma } from "./prisma";
import { rankScore } from "./ranks";

/** ISO week key like "2026-W20". */
export function isoWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type ChampionSummary = {
  weekKey: string;
  user: {
    id: string;
    slug: string;
    displayName: string;
    avatarUrl: string | null;
  };
  score: number;
  votes: number;
  isNew: boolean;
};

/**
 * Computes (and persists once per week) the weekly profile champion.
 * Champion = user with highest average rank score from ratings updated in the last 7 days.
 */
export async function getOrCrownWeeklyChampion(now: Date = new Date()): Promise<ChampionSummary | null> {
  const weekKey = isoWeekKey(now);
  try {
    const existing = await prisma.weeklyChampion.findUnique({
      where: { weekKey },
      include: { user: true },
    });
    if (existing) {
      return {
        weekKey,
        user: {
          id: existing.user.id,
          slug: existing.user.slug,
          displayName: existing.user.displayName,
          avatarUrl: existing.user.avatarUrl,
        },
        score: Number(existing.score),
        votes: existing.votes,
        isNew: false,
      };
    }

    const since = new Date(now.getTime() - WEEK_MS);
    const recent = await prisma.rating.findMany({
      where: { updatedAt: { gte: since } },
      select: { rateeId: true, stars: true },
    });
    if (recent.length === 0) return null;

    const by = new Map<string, { sum: number; count: number }>();
    for (const r of recent) {
      const prev = by.get(r.rateeId) ?? { sum: 0, count: 0 };
      prev.sum += rankScore(r.stars);
      prev.count += 1;
      by.set(r.rateeId, prev);
    }
    const ranked = [...by.entries()]
      .filter(([, v]) => v.count >= 2)
      .map(([id, v]) => ({ id, avg: v.sum / v.count, votes: v.count }))
      .sort((a, b) => b.avg - a.avg || b.votes - a.votes);
    if (ranked.length === 0) return null;
    const top = ranked[0];
    const user = await prisma.user.findUnique({ where: { id: top.id } });
    if (!user) return null;

    await prisma.weeklyChampion.create({
      data: {
        userId: user.id,
        weekKey,
        score: top.avg,
        votes: top.votes,
      },
    });
    return {
      weekKey,
      user: {
        id: user.id,
        slug: user.slug,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      score: top.avg,
      votes: top.votes,
      isNew: true,
    };
  } catch {
    return null;
  }
}
