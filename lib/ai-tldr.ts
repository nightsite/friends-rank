import { prisma } from "./prisma";
import { rankLabel, rankScore } from "./ranks";
import { getReasonTag, parseReasons } from "./reason-tags";

export type ProfileTldr = {
  oneLiner: string;
  bullets: string[];
  topTags: { slug: string; label: string; emoji: string; count: number }[];
  topCategory: { slug: string; name: string; avgRank: number } | null;
  ratingsCount: number;
};

const POSITIVE_HINTS = [
  "goat",
  "cracked",
  "insane",
  "elite",
  "godlike",
  "demon",
  "monster",
  "wild",
  "beast",
  "clutch",
  "fire",
  "smooth",
  "clean",
  "🔥",
];

const NEGATIVE_HINTS = ["cooked", "washed", "mid", "ass", "bot", "bricked", "trash", "L"];

/**
 * Heuristic profile summary built purely from existing ratings.
 * No external API required — works offline and during tests.
 */
export async function computeProfileTldr(userId: string): Promise<ProfileTldr | null> {
  try {
    const ratings = await prisma.rating.findMany({
      where: { rateeId: userId },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
      take: 40,
    });
    if (ratings.length === 0) return null;

    const tagCounts = new Map<string, number>();
    let positive = 0;
    let negative = 0;
    for (const r of ratings) {
      for (const t of parseReasons(r.reasons)) {
        tagCounts.set(t.slug, (tagCounts.get(t.slug) ?? 0) + 1);
      }
      if (r.comment) {
        const text = r.comment.toLowerCase();
        for (const h of POSITIVE_HINTS) if (text.includes(h)) positive++;
        for (const h of NEGATIVE_HINTS) if (text.includes(h)) negative++;
      }
    }

    const tagsSorted = [...tagCounts.entries()]
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const topTags = tagsSorted
      .map((x) => {
        const tag = getReasonTag(x.slug);
        if (!tag) return null;
        return { slug: tag.slug, label: tag.label, emoji: tag.emoji, count: x.count };
      })
      .filter((t): t is NonNullable<typeof t> => Boolean(t));

    const byCat = new Map<string, { sum: number; count: number; name: string; slug: string }>();
    for (const r of ratings) {
      const k = r.category.slug;
      const prev = byCat.get(k) ?? { sum: 0, count: 0, name: r.category.name, slug: k };
      prev.sum += rankScore(r.stars);
      prev.count += 1;
      byCat.set(k, prev);
    }
    const sortedCats = [...byCat.values()]
      .filter((c) => c.count > 0)
      .map((c) => ({ slug: c.slug, name: c.name, avgRank: c.sum / c.count }))
      .sort((a, b) => b.avgRank - a.avgRank);
    const topCategory = sortedCats[0] ?? null;

    const avgRankPts = ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length;
    const overallLabel = rankLabel(Math.round(avgRankPts));

    const sentiment =
      positive > negative * 1.4
        ? "the crew is hyped"
        : negative > positive * 1.4
          ? "the crew is roasting"
          : "the crew is mixed";

    const oneLiner =
      topCategory && topTags.length > 0
        ? `Sits around ${overallLabel}; shines in ${topCategory.name} and gets called out for ${topTags
            .slice(0, 2)
            .map((t) => t.label.toLowerCase())
            .join(" & ")}. ${sentiment[0].toUpperCase() + sentiment.slice(1)}.`
        : `Sits around ${overallLabel}. ${sentiment[0].toUpperCase() + sentiment.slice(1)}.`;

    const bullets: string[] = [];
    if (topCategory) {
      bullets.push(
        `Best vibe: ${topCategory.name} (${ratings.filter((r) => r.category.slug === topCategory.slug).length} ratings).`,
      );
    }
    if (topTags.length > 0) {
      bullets.push(
        `Most mentioned: ${topTags
          .slice(0, 3)
          .map((t) => `${t.emoji} ${t.label} ×${t.count}`)
          .join(", ")}.`,
      );
    }
    if (positive + negative > 0) {
      bullets.push(`Comment energy: ${positive} hype mentions vs ${negative} roasts.`);
    }

    return {
      oneLiner,
      bullets,
      topTags,
      topCategory,
      ratingsCount: ratings.length,
    };
  } catch {
    return null;
  }
}
