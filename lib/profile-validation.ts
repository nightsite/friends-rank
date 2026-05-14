import { validateMediaDataUrl } from "./media-validation";

const DISPLAY_MAX = 32;
const AVATAR_URL_MAX = 2000;
const PIN_MIN = 6;
const PIN_MAX = 128;
const BIO_MAX = 500;
const PINNED_POST_MAX = 280;
const TAGS_MAX = 160;
const BG_PRESET_MAX = 40;
const MOOD_MAX = 80;

export function normalizeDisplayName(raw: unknown): string | { error: string } {
  const s = String(raw ?? "").trim();
  if (s.length < 1) return { error: "Name is required." };
  if (s.length > DISPLAY_MAX) return { error: `Name must be at most ${DISPLAY_MAX} characters.` };
  const cleaned = s.replace(/[\u0000-\u001F\u007F]/g, "");
  if (cleaned.length < 1) return { error: "Name is invalid." };
  return cleaned;
}

/**
 * Accepts:
 *  - "" or null  -> null (clear avatar)
 *  - http(s)://...
 *  - data:image/(png|jpeg|webp|gif);base64,...
 */
export function normalizeAvatarValue(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s.length === 0) return null;

  if (s.startsWith("data:")) {
    const v = validateMediaDataUrl(s, "avatar");
    if (v && "error" in v) return { error: v.error };
    return s;
  }

  if (s.length > AVATAR_URL_MAX) return { error: "Image URL is too long." };
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return { error: "Image URL must be a valid http(s) link." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { error: "Image URL must start with http:// or https://." };
  }
  return url.toString();
}

/** Back-compat alias used by older imports. */
export const normalizeAvatarUrl = normalizeAvatarValue;

export function normalizeBio(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s.length === 0) return null;
  if (s.length > BIO_MAX) return { error: `Bio must be at most ${BIO_MAX} characters.` };
  return s;
}

export function normalizePinnedPost(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s.length === 0) return null;
  if (s.length > PINNED_POST_MAX) {
    return { error: `Pinned post must be at most ${PINNED_POST_MAX} characters.` };
  }
  return s;
}

export function normalizeMood(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (s.length === 0) return null;
  if (s.length > MOOD_MAX) return { error: `Mood must be at most ${MOOD_MAX} characters.` };
  return s;
}

export function normalizeFavoriteTags(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s.length === 0) return null;
  if (s.length > TAGS_MAX) return { error: "Favorite tags are too long." };
  return s;
}

export function normalizeThemeToken(
  raw: unknown,
  { maxLength = BG_PRESET_MAX }: { maxLength?: number } = {},
): string | null | { error: string } {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s.length > maxLength) return { error: "Theme value is too long." };
  if (!/^[a-z0-9-]+$/i.test(s)) return { error: "Theme value contains invalid characters." };
  return s.toLowerCase();
}

export function normalizeIntRange(
  raw: unknown,
  { min, max, name }: { min: number; max: number; name: string },
): number | { error: string } {
  const n = Number(raw);
  if (!Number.isFinite(n)) return { error: `${name} must be a number.` };
  const i = Math.round(n);
  if (i < min || i > max) return { error: `${name} must be between ${min} and ${max}.` };
  return i;
}

export function normalizeAccentColor(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s.length === 0) return null;
  if (!/^#[0-9a-f]{6}$/i.test(s)) {
    return { error: "Accent color must be a hex value like #f59e0b." };
  }
  return s.toLowerCase();
}

export function validateNewPin(pin: unknown): string | { error: string } {
  const s = String(pin ?? "");
  if (s.length < PIN_MIN) return { error: `New PIN must be at least ${PIN_MIN} characters.` };
  if (s.length > PIN_MAX) return { error: "PIN is too long." };
  return s;
}

export { DISPLAY_MAX, AVATAR_URL_MAX, PIN_MIN, BIO_MAX, PINNED_POST_MAX, TAGS_MAX, MOOD_MAX };
