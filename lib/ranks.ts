export const RANK_MIN = 1;
export const RANK_MAX = 19;

const TIERS = ["Bronze", "Silber", "Gold", "Dia", "Platin", "Master"] as const;

export type RankOption = { value: number; label: string };

export const RANK_OPTIONS: RankOption[] = Array.from({ length: RANK_MAX }, (_, i) => {
  const value = i + 1;
  return { value, label: rankLabel(value) };
});

export function rankLabel(value: number): string {
  const v = Math.max(RANK_MIN, Math.min(RANK_MAX, Math.round(value)));
  if (v === RANK_MAX) return "Challenger";
  const idx = Math.floor((v - 1) / 3);
  const div = 3 - ((v - 1) % 3);
  return `${TIERS[idx]} ${div}`;
}

/** Normalize rank points to a 1..5 score for charts/badges math. */
export function rankScore(value: number): number {
  const v = Math.max(RANK_MIN, Math.min(RANK_MAX, value));
  return 1 + ((v - 1) * 4) / 18;
}

/** Convert a normalized 1..5 score back to nearest rank points. */
export function rankFromScore(score: number): number {
  const s = Math.max(1, Math.min(5, score));
  return Math.max(RANK_MIN, Math.min(RANK_MAX, Math.round(((s - 1) * 18) / 4 + 1)));
}

export function rankLabelFromAverage(avg: number): string {
  return rankLabel(Math.round(avg));
}

const TIER_KEYS = ["bronze", "silver", "gold", "dia", "platin", "master"] as const;
export type TierKey = (typeof TIER_KEYS)[number] | "challenger";

export function tierKeyForRank(value: number): TierKey {
  const v = Math.max(RANK_MIN, Math.min(RANK_MAX, Math.round(value)));
  if (v === RANK_MAX) return "challenger";
  return TIER_KEYS[Math.floor((v - 1) / 3)];
}
