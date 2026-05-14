import { prisma } from "./prisma";

export type CrewMember = {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  favoriteTags: string | null;
  mood: string | null;
  lastSeenAt: Date | null;
  avgRank: number;
  ratingCount: number;
};

export async function getCrew(): Promise<CrewMember[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        slug: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        favoriteTags: true,
        mood: true,
        lastSeenAt: true,
      },
    });
    const grouped = await prisma.rating.groupBy({
      by: ["rateeId"],
      _avg: { stars: true },
      _count: { _all: true },
    });
    const byId = new Map(grouped.map((g) => [g.rateeId, g]));
    return users.map((u) => {
      const g = byId.get(u.id);
      return {
        ...u,
        avgRank: g?._avg.stars != null ? Number(g._avg.stars) : 0,
        ratingCount: g?._count._all ?? 0,
      };
    });
  } catch {
    return [];
  }
}

export function crewNeighbors(
  crew: CrewMember[],
  currentSlug: string,
): { prev: string | null; next: string | null } {
  const idx = crew.findIndex((u) => u.slug === currentSlug);
  if (idx < 0 || crew.length < 2) return { prev: null, next: null };
  const prev = crew[(idx - 1 + crew.length) % crew.length].slug;
  const next = crew[(idx + 1) % crew.length].slug;
  return { prev, next };
}
