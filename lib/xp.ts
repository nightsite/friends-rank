import { prisma } from "./prisma";
import { createAppNotification } from "./app-notifications";
import { notifyUser } from "./web-push";

/**
 * XP curve:
 *   Level N starts at totalXp = (N - 1)^2 * 100.
 *   L1: 0,  L2: 100,  L3: 400,  L4: 900,  L5: 1600,  L6: 2500, …
 */
const XP_PER_LEVEL_SCALE = 100;

export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (level - 1) * XP_PER_LEVEL_SCALE;
}

export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / XP_PER_LEVEL_SCALE)) + 1;
}

export type XpBreakdown = {
  xp: number;
  level: number;
  intoLevel: number;
  spanForNextLevel: number;
  progress: number; // 0..1
  xpToNext: number;
};

export function xpBreakdown(xp: number): XpBreakdown {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = levelFromXp(safeXp);
  const floor = totalXpForLevel(level);
  const ceil = totalXpForLevel(level + 1);
  const span = Math.max(1, ceil - floor);
  const into = Math.max(0, safeXp - floor);
  const progress = Math.min(1, into / span);
  return {
    xp: safeXp,
    level,
    intoLevel: into,
    spanForNextLevel: span,
    progress,
    xpToNext: Math.max(0, ceil - safeXp),
  };
}

export const XP_RULES = {
  giveRating: 10,
  receiveRating: 5,
  topRankBonus: 50, // when given/received Challenger (rank 19)
  giveProfileRating: 10,
  receiveProfileRating: 5,
  dailyStreakDay: 20,
  promotion: 100,
  achievementUnlock: 30,
  wallPost: 5,
} as const;

/**
 * Adds XP to a user, recomputes level, and (if level increased) creates
 * an in-app notification + a push. Fire-and-forget safe.
 */
export async function awardXp(
  userId: string,
  amount: number,
  reason: string,
): Promise<{ leveledUp: boolean; newLevel: number; newXp: number } | null> {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: Math.round(amount) } },
      select: { xp: true, level: true },
    });
    const newXp = updated.xp;
    const newLevel = levelFromXp(newXp);
    const leveledUp = newLevel > updated.level;
    if (leveledUp) {
      await prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      }).catch(() => undefined);
      const title = `🚀 Level ${newLevel} reached!`;
      const body = `+${Math.round(amount)} XP from ${reason}. You hit Level ${newLevel}.`;
      void createAppNotification({
        userId,
        kind: "level_up",
        title,
        body,
        href: "/me",
      }).catch(() => {});
      void notifyUser({ userId, title, body, url: "/me" }).catch(() => {});
    }
    return { leveledUp, newLevel, newXp };
  } catch {
    return null;
  }
}
