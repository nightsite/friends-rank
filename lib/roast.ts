import { prisma } from "./prisma";

export type Roast = {
  ratingId: string;
  body: string;
  raterName: string;
  rateeName: string;
  rateeSlug: string;
  categoryName: string;
  categorySlug: string;
  stars: number;
  updatedAt: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the most "spicy" comment from the last 24 hours. Heuristic:
 *  - rating <= silver tier (i.e. stars <= 6 on the 1-19 ladder)
 *  - non-empty comment
 *  - score = length * exclamation_count, capped
 */
export async function getRoastOfTheDay(now: Date = new Date()): Promise<Roast | null> {
  try {
    const since = new Date(now.getTime() - DAY_MS);
    const candidates = await prisma.rating.findMany({
      where: {
        updatedAt: { gte: since },
        stars: { lte: 6 },
        NOT: { comment: "" },
      },
      include: { rater: true, ratee: true, category: true },
      orderBy: { updatedAt: "desc" },
      take: 25,
    });
    if (candidates.length === 0) return null;
    const scored = candidates
      .map((r) => {
        const exclam = (r.comment.match(/[!?]/g) ?? []).length;
        const cap = (r.comment.match(/[A-Z]/g) ?? []).length;
        const length = Math.min(r.comment.length, 300);
        const score = length * 0.4 + exclam * 12 + cap * 0.6 + (7 - r.stars) * 4;
        return { r, score };
      })
      .sort((a, b) => b.score - a.score);
    const winner = scored[0].r;
    return {
      ratingId: winner.id,
      body: winner.comment,
      raterName: winner.rater.displayName,
      rateeName: winner.ratee.displayName,
      rateeSlug: winner.ratee.slug,
      categoryName: winner.category.name,
      categorySlug: winner.category.slug,
      stars: winner.stars,
      updatedAt: winner.updatedAt,
    };
  } catch {
    return null;
  }
}
