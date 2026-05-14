import { prisma } from "./prisma";
import { createAppNotification } from "./app-notifications";
import { notifyUser } from "./web-push";
import { rankLabel } from "./ranks";
import { awardXp, XP_RULES } from "./xp";

const TIER_ORDER = [
  "bronze",
  "silver",
  "gold",
  "dia",
  "platin",
  "master",
  "challenger",
] as const;
export type Tier = (typeof TIER_ORDER)[number];

const TIER_EMOJI: Record<Tier, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  dia: "💎",
  platin: "🔷",
  master: "🧠",
  challenger: "⚡",
};

export function tierFromRank(value: number): Tier {
  const v = Math.max(1, Math.min(19, Math.round(value)));
  if (v === 19) return "challenger";
  const idx = Math.floor((v - 1) / 3);
  return TIER_ORDER[idx];
}

function tierIndex(tier: Tier): number {
  return TIER_ORDER.indexOf(tier);
}

/**
 * Compares the user's new tier against the last notified tier in this scope.
 * If higher, persists the new tier and fires push + in-app notification.
 * Scope examples: "category:gym", "profile".
 * Fire-and-forget safe.
 */
export async function checkAndNotifyPromotion(args: {
  userId: string;
  scope: string;
  rank: number;
  href?: string;
  scopeLabel?: string;
}): Promise<void> {
  const newTier = tierFromRank(args.rank);
  const newIdx = tierIndex(newTier);
  if (newIdx < 0) return;

  try {
    const last = await prisma.rankPromotion.findUnique({
      where: { userId_scope: { userId: args.userId, scope: args.scope } },
    });

    if (last) {
      const lastIdx = tierIndex(last.tier as Tier);
      if (lastIdx >= newIdx) {
        // Not a promotion. Still update rank/tier so a slide doesn't trigger
        // a fake promotion later when climbing back up.
        if (last.rank !== Math.round(args.rank) || last.tier !== newTier) {
          await prisma.rankPromotion.update({
            where: { userId_scope: { userId: args.userId, scope: args.scope } },
            data: { tier: newTier, rank: Math.round(args.rank), notifiedAt: new Date() },
          });
        }
        return;
      }
    }

    await prisma.rankPromotion.upsert({
      where: { userId_scope: { userId: args.userId, scope: args.scope } },
      create: {
        userId: args.userId,
        scope: args.scope,
        tier: newTier,
        rank: Math.round(args.rank),
      },
      update: {
        tier: newTier,
        rank: Math.round(args.rank),
        notifiedAt: new Date(),
      },
    });

    const scopeText = args.scopeLabel ?? args.scope;
    const title = `${TIER_EMOJI[newTier]} Promoted in ${scopeText}!`;
    const body = `You climbed into ${rankLabel(args.rank)}.`;

    void createAppNotification({
      userId: args.userId,
      kind: "rank_promotion",
      title,
      body,
      href: args.href ?? "/me",
    }).catch(() => {});
    void notifyUser({
      userId: args.userId,
      title,
      body,
      url: args.href ?? "/me",
    }).catch(() => {});
    void awardXp(args.userId, XP_RULES.promotion, `promotion to ${newTier}`).catch(() => {});
  } catch {
    // never throw from a non-essential side effect
  }
}
