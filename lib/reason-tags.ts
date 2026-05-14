/**
 * Reason tags that a rater can attach to a single rating.
 * Slugs are stable; labels render to humans.
 */
export type ReasonTag = {
  slug: string;
  label: string;
  emoji: string;
  /** category slugs where this is most relevant; empty means universal */
  cats: string[];
};

export const REASON_TAGS: ReasonTag[] = [
  { slug: "aura", label: "Aura", emoji: "✨", cats: ["face-card", "status"] },
  { slug: "drip", label: "Drip", emoji: "💧", cats: ["face-card", "status"] },
  { slug: "vibe", label: "Vibe", emoji: "🌊", cats: [] },
  { slug: "discipline", label: "Discipline", emoji: "🎯", cats: ["gym"] },
  { slug: "consistency", label: "Consistency", emoji: "🧱", cats: ["gym", "gaming"] },
  { slug: "cardio", label: "Cardio", emoji: "❤️", cats: ["gym"] },
  { slug: "strength", label: "Strength", emoji: "💪", cats: ["gym"] },
  { slug: "aim", label: "Aim", emoji: "🎯", cats: ["gaming"] },
  { slug: "gamesense", label: "Gamesense", emoji: "🧠", cats: ["gaming"] },
  { slug: "clutch", label: "Clutch", emoji: "🥶", cats: ["gaming"] },
  { slug: "tilt", label: "Tilt-Resistant", emoji: "🧘", cats: ["gaming"] },
  { slug: "glow", label: "Glow", emoji: "🌟", cats: ["face-card"] },
  { slug: "smile", label: "Smile", emoji: "😁", cats: ["face-card"] },
  { slug: "swagger", label: "Swagger", emoji: "🦅", cats: ["status"] },
  { slug: "hustle", label: "Hustle", emoji: "🚀", cats: ["status"] },
  { slug: "leader", label: "Leader", emoji: "🎖️", cats: ["status"] },
  { slug: "loyal", label: "Loyal", emoji: "🤝", cats: [] },
  { slug: "funny", label: "Funny", emoji: "😂", cats: [] },
];

const SLUG_TO_TAG = new Map(REASON_TAGS.map((t) => [t.slug, t]));

export function getReasonTag(slug: string): ReasonTag | undefined {
  return SLUG_TO_TAG.get(slug);
}

export function reasonsForCategory(categorySlug: string): ReasonTag[] {
  return REASON_TAGS.filter((t) => t.cats.length === 0 || t.cats.includes(categorySlug));
}

export function parseReasons(raw: string | null | undefined): ReasonTag[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((s) => SLUG_TO_TAG.get(s))
    .filter((t): t is ReasonTag => Boolean(t));
}

const REASONS_MAX = 5;

export function normalizeReasons(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string" && raw.trim().length === 0) return null;

  let list: string[] = [];
  if (Array.isArray(raw)) {
    list = raw.map((x) => String(x));
  } else if (typeof raw === "string") {
    list = raw.split(",");
  } else {
    return { error: "Reasons must be a list." };
  }

  const slugs = list
    .map((s) => String(s).trim().toLowerCase())
    .filter(Boolean)
    .filter((s) => SLUG_TO_TAG.has(s));

  const unique = Array.from(new Set(slugs)).slice(0, REASONS_MAX);
  return unique.length === 0 ? null : unique.join(",");
}

export const REASON_TAG_MAX = REASONS_MAX;
