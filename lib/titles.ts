import { prisma } from "./prisma";
import { isoWeekKey } from "./weekly-champion";

export type Title = {
  slug: string;
  label: string;
  emoji: string;
  description: string;
  tier: "category" | "overall" | "champion";
};

const TITLE_BY_CATEGORY: Record<string, { label: string; emoji: string }> = {
  "face-card": { label: "Aura Lord", emoji: "👁️" },
  gym: { label: "Iron Sovereign", emoji: "💪" },
  gaming: { label: "Game God", emoji: "🎮" },
  status: { label: "Status King", emoji: "👑" },
};

/**
 * Computes title chips visible on a user's profile based on aggregate ranks.
 * Pure server helper, batches a few cheap queries.
 */
export async function getTitlesForUser(userId: string): Promise<Title[]> {
  try {
    const titles: Title[] = [];

    const grouped = await prisma.rating.groupBy({
      by: ["categoryId", "rateeId"],
      _avg: { stars: true },
      _count: { _all: true },
    });

    const categories = await prisma.category.findMany();

    for (const cat of categories) {
      const inCat = grouped
        .filter((g) => g.categoryId === cat.id && g._count._all > 0)
        .sort((a, b) => Number(b._avg.stars ?? 0) - Number(a._avg.stars ?? 0));
      if (inCat[0]?.rateeId === userId) {
        const meta = TITLE_BY_CATEGORY[cat.slug];
        if (meta) {
          titles.push({
            slug: `top-${cat.slug}`,
            label: meta.label,
            emoji: meta.emoji,
            description: `#1 in ${cat.name}.`,
            tier: "category",
          });
        }
      }
    }

    // Overall by avg across all categories
    const overall = grouped.reduce<Map<string, { sum: number; count: number }>>((acc, g) => {
      const k = g.rateeId;
      const prev = acc.get(k) ?? { sum: 0, count: 0 };
      prev.sum += Number(g._avg.stars ?? 0) * (g._count._all ?? 0);
      prev.count += g._count._all ?? 0;
      acc.set(k, prev);
      return acc;
    }, new Map());

    const overallSorted = [...overall.entries()]
      .filter(([, v]) => v.count > 0)
      .map(([id, v]) => ({ id, avg: v.sum / v.count }))
      .sort((a, b) => b.avg - a.avg);

    if (overallSorted[0]?.id === userId) {
      titles.push({
        slug: "overall-champion",
        label: "The GOAT",
        emoji: "🐐",
        description: "Highest overall average across all categories.",
        tier: "overall",
      });
    }

    // Weekly champion — only show the chip if this user is the *current* week's champion.
    const wk = isoWeekKey();
    const thisWeek = await prisma.weeklyChampion.findUnique({
      where: { weekKey: wk },
    });
    if (thisWeek?.userId === userId) {
      titles.push({
        slug: "weekly-champion",
        label: `Champion ${wk}`,
        emoji: "🏅",
        description: "Crowned weekly champion.",
        tier: "champion",
      });
    }

    return titles;
  } catch {
    return [];
  }
}

export function getCategoryTitleMeta(categorySlug: string) {
  return TITLE_BY_CATEGORY[categorySlug] ?? null;
}
