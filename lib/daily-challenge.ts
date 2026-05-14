import { prisma } from "./prisma";
import { CATEGORY_SLUGS } from "./constants";
import { RANK_MAX } from "./ranks";
import { awardXp } from "./xp";
import { createAppNotification } from "./app-notifications";
import { notifyUser } from "./web-push";

export type Challenge = {
  kind: string;
  title: string;
  description: string;
  emoji: string;
  /** target value for progress bar */
  target: number;
};

function dayKeyUtc(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Deterministically choose today's challenge from a small rotation.
 */
export function pickChallengeForDay(dayKey: string = dayKeyUtc()): Challenge {
  const candidates: Challenge[] = [
    ...CATEGORY_SLUGS.map((cat): Challenge => ({
      kind: `cat-sweep:${cat}`,
      title: `Rank everyone in ${cat.replace("-", " ")}`,
      description: `Submit a rank for every crew member in this category today.`,
      emoji: "🎯",
      target: 4,
    })),
    {
      kind: "comments-3",
      title: "Drop 3 written comments",
      description: "Leave a written comment in 3 different ratings today.",
      emoji: "💬",
      target: 3,
    },
    {
      kind: "challenger-1",
      title: "Hand out 1 Challenger rank",
      description: "Find someone who deserves it and give them the top rank.",
      emoji: "⚡",
      target: 1,
    },
  ];
  let seed = 0;
  for (const ch of dayKey) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return candidates[seed % candidates.length];
}

/**
 * Computes today's progress for the given user against the active challenge.
 */
export async function computeChallengeProgress(args: {
  userId: string;
  challenge: Challenge;
  now?: Date;
}): Promise<{ done: number; target: number; completed: boolean }> {
  const now = args.now ?? new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const ch = args.challenge;
  let done = 0;
  try {
    if (ch.kind.startsWith("cat-sweep:")) {
      const slug = ch.kind.split(":")[1];
      const cat = await prisma.category.findUnique({ where: { slug } });
      if (cat) {
        const distinct = await prisma.rating.groupBy({
          by: ["rateeId"],
          where: {
            raterId: args.userId,
            categoryId: cat.id,
            updatedAt: { gte: start, lt: end },
          },
        });
        done = distinct.length;
      }
    } else if (ch.kind === "comments-3") {
      done = await prisma.rating.count({
        where: {
          raterId: args.userId,
          updatedAt: { gte: start, lt: end },
          NOT: { comment: "" },
        },
      });
    } else if (ch.kind === "challenger-1") {
      done = await prisma.rating.count({
        where: {
          raterId: args.userId,
          updatedAt: { gte: start, lt: end },
          stars: RANK_MAX,
        },
      });
    }
  } catch {
    done = 0;
  }
  const completed = done >= ch.target;
  return { done: Math.min(done, ch.target), target: ch.target, completed };
}

/**
 * Idempotent claim: marks the challenge as completed for the user today,
 * awards XP, and fires a celebration notification.
 */
export async function tryClaimChallenge(args: {
  userId: string;
  challenge: Challenge;
  dayKey?: string;
}): Promise<boolean> {
  const dayKey = args.dayKey ?? dayKeyUtc();
  try {
    const existing = await prisma.dailyChallengeClaim.findUnique({
      where: {
        userId_dayKey_challengeKind: {
          userId: args.userId,
          dayKey,
          challengeKind: args.challenge.kind,
        },
      },
    });
    if (existing) return false;
    await prisma.dailyChallengeClaim.create({
      data: {
        userId: args.userId,
        dayKey,
        challengeKind: args.challenge.kind,
      },
    });
    const title = `${args.challenge.emoji} Daily challenge cleared!`;
    const body = `${args.challenge.title} — +75 XP banked.`;
    void createAppNotification({
      userId: args.userId,
      kind: "level_up",
      title,
      body,
      href: "/",
    }).catch(() => {});
    void notifyUser({ userId: args.userId, title, body, url: "/" }).catch(() => {});
    void awardXp(args.userId, 75, "daily challenge").catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Triggered after a rating save: checks if the user just completed the active
 * challenge and, if so, claims it.
 */
export async function maybeCompleteChallenge(userId: string): Promise<void> {
  try {
    const challenge = pickChallengeForDay();
    const progress = await computeChallengeProgress({ userId, challenge });
    if (progress.completed) {
      await tryClaimChallenge({ userId, challenge });
    }
  } catch {
    /* non-fatal */
  }
}

export { dayKeyUtc };
