import { prisma } from "./prisma";
import { awardXp, XP_RULES } from "./xp";
import { checkStreakAchievements } from "./achievements";

function ymdUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function previousDay(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return ymdUtc(d);
}

/** Bumps the user's streak count once per UTC day. Safe to call on every request. */
export async function touchStreak(userId: string, now: Date = new Date()): Promise<void> {
  const today = ymdUtc(now);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true, streakLastDay: true },
  });
  if (!user) return;
  if (user.streakLastDay === today) return;

  let nextCount: number;
  if (user.streakLastDay && user.streakLastDay === previousDay(today)) {
    nextCount = (user.streakCount ?? 0) + 1;
  } else if (!user.streakLastDay) {
    nextCount = 1;
  } else {
    nextCount = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streakCount: nextCount, streakLastDay: today },
  });

  void awardXp(userId, XP_RULES.dailyStreakDay, "daily streak").catch(() => {});
  void checkStreakAchievements(userId, nextCount).catch(() => {});
}
