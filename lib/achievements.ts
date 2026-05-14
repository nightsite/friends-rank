import { prisma } from "./prisma";
import { createAppNotification } from "./app-notifications";
import { notifyUser } from "./web-push";
import { awardXp, XP_RULES } from "./xp";

export type AchievementDef = {
  slug: string;
  title: string;
  description: string;
  emoji: string;
};

/**
 * All known achievements. Some are hidden (only revealed once unlocked).
 */
export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  "night-owl": {
    slug: "night-owl",
    emoji: "🦉",
    title: "Night Owl",
    description: "Rated someone between 02:00 and 04:00 local time.",
  },
  "early-bird": {
    slug: "early-bird",
    emoji: "🌅",
    title: "Early Bird",
    description: "Rated someone between 05:00 and 07:00 local time.",
  },
  "speed-runner": {
    slug: "speed-runner",
    emoji: "⚡",
    title: "Speed Runner",
    description: "Submitted 4 ratings within 5 minutes.",
  },
  "all-rounder": {
    slug: "all-rounder",
    emoji: "🎯",
    title: "All-Rounder",
    description: "Rated in every category on the same day.",
  },
  "completionist": {
    slug: "completionist",
    emoji: "📋",
    title: "Completionist",
    description: "Rated every crew member at least once across all categories.",
  },
  "marathoner": {
    slug: "marathoner",
    emoji: "🏃",
    title: "Marathoner",
    description: "Hit a 7-day login streak.",
  },
  "lifetime": {
    slug: "lifetime",
    emoji: "🏆",
    title: "Lifetime",
    description: "Hit a 30-day login streak.",
  },
  "challenger-hit": {
    slug: "challenger-hit",
    emoji: "⚡",
    title: "Lightning Strike",
    description: "Gave or received a Challenger rank.",
  },
  "first-blood": {
    slug: "first-blood",
    emoji: "🩸",
    title: "First Blood",
    description: "First ever rating you submitted.",
  },
  "wall-warrior": {
    slug: "wall-warrior",
    emoji: "🧱",
    title: "Wall Warrior",
    description: "Wrote 10 posts on other profiles.",
  },
};

/**
 * Tries to unlock a single achievement for a user. Idempotent: if already
 * unlocked, no notification is sent. Fire-and-forget safe.
 */
export async function unlockAchievement(
  userId: string,
  slug: keyof typeof ACHIEVEMENTS | string,
  payload?: string,
): Promise<boolean> {
  const def = ACHIEVEMENTS[slug as string];
  if (!def) return false;
  try {
    const existing = await prisma.achievement.findUnique({
      where: { userId_slug: { userId, slug: def.slug } },
    });
    if (existing) return false;
    await prisma.achievement.create({
      data: { userId, slug: def.slug, payload: payload ?? null },
    });
    const title = `${def.emoji} Achievement: ${def.title}`;
    void createAppNotification({
      userId,
      kind: "achievement_unlocked",
      title,
      body: def.description,
      href: "/me",
    }).catch(() => {});
    void notifyUser({ userId, title, body: def.description, url: "/me" }).catch(
      () => {},
    );
    void awardXp(userId, XP_RULES.achievementUnlock, `${def.title}`).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Heuristic post-rating check.  Runs cheap queries to detect newly satisfied
 * achievements. Designed to be invoked fire-and-forget by rating routes.
 */
export async function checkRatingAchievements(args: {
  userId: string;
  now?: Date;
  hour: number; // 0..23 of rater's local time (or server hour fallback)
  rank: number;
  rateeId: string;
}): Promise<void> {
  const { userId, hour, rank } = args;
  try {
    // Night Owl / Early Bird (time-based)
    if (hour >= 2 && hour < 4) await unlockAchievement(userId, "night-owl");
    if (hour >= 5 && hour < 7) await unlockAchievement(userId, "early-bird");

    // Challenger handed out
    if (rank === 19) await unlockAchievement(userId, "challenger-hit");
    if (args.rateeId && rank === 19) {
      await unlockAchievement(args.rateeId, "challenger-hit");
    }

    // First-blood and follow-up streak/completionist checks
    const myRatings = await prisma.rating.findMany({
      where: { raterId: userId },
      select: { id: true, categoryId: true, rateeId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    if (myRatings.length === 1) await unlockAchievement(userId, "first-blood");

    // Speed runner: 4 ratings within 5 minutes
    if (myRatings.length >= 4) {
      const last = myRatings[myRatings.length - 1].createdAt.getTime();
      const fourthAgo = myRatings[myRatings.length - 4].createdAt.getTime();
      if (last - fourthAgo <= 5 * 60_000) {
        await unlockAchievement(userId, "speed-runner");
      }
    }

    // All-Rounder: 4 distinct categories rated on the same UTC day
    const todayKey = new Date().toISOString().slice(0, 10);
    const todays = myRatings.filter(
      (r) => r.createdAt.toISOString().slice(0, 10) === todayKey,
    );
    const cats = new Set(todays.map((r) => r.categoryId));
    if (cats.size >= 4) await unlockAchievement(userId, "all-rounder");

    // Completionist: rated all crew members in all categories
    const totalCategories = await prisma.category.count();
    const totalOthers = (await prisma.user.count()) - 1;
    if (totalCategories > 0 && totalOthers > 0) {
      const distinctPairs = new Set(
        myRatings.map((r) => `${r.rateeId}:${r.categoryId}`),
      );
      if (distinctPairs.size >= totalCategories * totalOthers) {
        await unlockAchievement(userId, "completionist");
      }
    }
  } catch {
    /* non-fatal */
  }
}

export async function checkStreakAchievements(userId: string, streak: number): Promise<void> {
  try {
    if (streak >= 7) await unlockAchievement(userId, "marathoner");
    if (streak >= 30) await unlockAchievement(userId, "lifetime");
  } catch {
    /* non-fatal */
  }
}
