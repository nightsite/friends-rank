import type { CategorySlug } from "@/lib/constants";

export type CategoryMeta = {
  emoji: string;
  tagline: string;
  /** Tailwind gradient classes for tile accent */
  accent: string;
};

export const CATEGORY_META: Record<CategorySlug, CategoryMeta> = {
  gym: {
    emoji: "🏋️",
    tagline: "Consistency, PRs, and showing up.",
    accent: "from-emerald-500/25 to-teal-600/10",
  },
  gaming: {
    emoji: "🎮",
    tagline: "Clips, comms, and clutch factor.",
    accent: "from-violet-500/25 to-fuchsia-600/10",
  },
  "face-card": {
    emoji: "✨",
    tagline: "Presence, polish, main-character energy.",
    accent: "from-rose-500/20 to-amber-500/10",
  },
  status: {
    emoji: "👑",
    tagline: "Aura, reputation, and real-world gravity.",
    accent: "from-amber-500/25 to-orange-600/10",
  },
};

export function getCategoryMeta(slug: string): CategoryMeta | null {
  if (slug in CATEGORY_META) return CATEGORY_META[slug as CategorySlug];
  return null;
}
