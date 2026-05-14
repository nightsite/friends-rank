import type { Category, Rating, User } from "@prisma/client";
import { rankScore } from "@/lib/ranks";

export type BadgeTone = "amber" | "emerald" | "violet" | "neutral" | "rose";

export type BadgeItem = {
  id: string;
  label: string;
  emoji: string;
  tone: BadgeTone;
  hint?: string;
};

type Inputs = {
  me: Pick<User, "id" | "streakCount">;
  users: Pick<User, "id">[];
  ratings: Pick<Rating, "id" | "rateeId" | "raterId" | "categoryId" | "stars" | "createdAt" | "updatedAt">[];
  categories: Pick<Category, "id" | "slug" | "name">[];
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function computeBadges({ me, users, ratings, categories }: Inputs): BadgeItem[] {
  const out: BadgeItem[] = [];
  const otherUserIds = users.map((u) => u.id).filter((id) => id !== me.id);
  const total = users.length;
  const requiredGiven = otherUserIds.length * categories.length;

  if (me.streakCount >= 1) {
    out.push({
      id: "streak",
      label: `${me.streakCount}-day streak`,
      emoji: "🔥",
      tone: "amber",
    });
  }

  for (const cat of categories) {
    const inCat = ratings.filter((r) => r.categoryId === cat.id);
    if (inCat.length === 0) continue;
    const byUser = new Map<string, number[]>();
    for (const r of inCat) {
      const arr = byUser.get(r.rateeId) ?? [];
      arr.push(rankScore(r.stars));
      byUser.set(r.rateeId, arr);
    }
    let topId: string | null = null;
    let topAvg = -1;
    let topCount = 0;
    for (const [uid, arr] of byUser) {
      const a = avg(arr);
      if (a > topAvg || (a === topAvg && arr.length > topCount)) {
        topAvg = a;
        topCount = arr.length;
        topId = uid;
      }
    }
    if (topId === me.id) {
      out.push({
        id: `top-${cat.slug}`,
        label: `Top ${cat.name}`,
        emoji: "👑",
        tone: "amber",
        hint: `${topAvg.toFixed(2)} avg`,
      });
    }
  }

  const myReceived = ratings.filter((r) => r.rateeId === me.id);
  if (myReceived.length >= 4) {
    const overall = avg(myReceived.map((r) => rankScore(r.stars)));
    if (overall >= 4.5) {
      out.push({
        id: "loved",
        label: "Loved",
        emoji: "💖",
        tone: "rose",
        hint: `${overall.toFixed(2)} avg`,
      });
    }
  }

  const now = Date.now();
  const recent = myReceived.filter((r) => now - new Date(r.updatedAt).getTime() <= WEEK_MS);
  const prior = myReceived.filter((r) => {
    const t = now - new Date(r.updatedAt).getTime();
    return t > WEEK_MS && t <= 2 * WEEK_MS;
  });
  if (recent.length >= 2 && prior.length >= 2) {
    const delta = avg(recent.map((r) => rankScore(r.stars))) - avg(prior.map((r) => rankScore(r.stars)));
    if (delta >= 0.5) {
      out.push({
        id: "glowup",
        label: "Glow Up",
        emoji: "📈",
        tone: "emerald",
        hint: `+${delta.toFixed(2)} this week`,
      });
    }
    if (delta <= -0.5) {
      out.push({
        id: "roasted",
        label: "Roasted",
        emoji: "🥶",
        tone: "violet",
        hint: `${delta.toFixed(2)} this week`,
      });
    }
  }

  const givenByMe = ratings.filter((r) => r.raterId === me.id);
  if (givenByMe.length >= requiredGiven && requiredGiven > 0) {
    out.push({
      id: "reviewer",
      label: "Reviewer",
      emoji: "📝",
      tone: "neutral",
      hint: "All ratings given",
    });
  }

  return out;
}
