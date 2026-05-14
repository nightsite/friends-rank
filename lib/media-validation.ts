export const ALLOWED_IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_AUDIO_MIMES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/aac",
] as const;

export const AVATAR_DATA_MAX_BYTES = 2_500_000;
export const ATTACHMENT_IMAGE_MAX_BYTES = 4_000_000;
export const ATTACHMENT_AUDIO_MAX_BYTES = 1_500_000;
export const REPLY_BODY_MAX = 1500;

const DATA_URL_RE = /^data:([a-z]+\/[a-z0-9+.-]+);base64,([A-Za-z0-9+/=]+)$/i;

export type ParsedDataUrl = { mime: string; bytes: number };

/** Loose parse + size estimate for a base64 data URL. */
export function parseDataUrl(s: unknown): ParsedDataUrl | null {
  if (typeof s !== "string") return null;
  const m = DATA_URL_RE.exec(s);
  if (!m) return null;
  const b64 = m[2];
  const bytes = Math.floor((b64.length * 3) / 4);
  return { mime: m[1].toLowerCase(), bytes };
}

export type MediaValidationKind = "avatar" | "comment-image" | "comment-audio";

export function validateMediaDataUrl(
  s: unknown,
  kind: MediaValidationKind,
): { mime: string } | { error: string } | null {
  if (s === null || s === undefined || s === "") return null;
  const parsed = parseDataUrl(s);
  if (!parsed) return { error: "Invalid file data." };

  if (kind === "avatar" || kind === "comment-image") {
    if (
      !ALLOWED_IMAGE_MIMES.includes(
        parsed.mime as (typeof ALLOWED_IMAGE_MIMES)[number],
      )
    ) {
      return { error: "Image must be PNG, JPEG, WEBP or GIF." };
    }
  } else if (kind === "comment-audio") {
    if (
      !ALLOWED_AUDIO_MIMES.includes(
        parsed.mime.split(";")[0] as (typeof ALLOWED_AUDIO_MIMES)[number],
      ) &&
      !parsed.mime.startsWith("audio/")
    ) {
      return { error: "Audio format not supported." };
    }
  }

  const cap =
    kind === "avatar"
      ? AVATAR_DATA_MAX_BYTES
      : kind === "comment-image"
        ? ATTACHMENT_IMAGE_MAX_BYTES
        : ATTACHMENT_AUDIO_MAX_BYTES;

  if (parsed.bytes > cap) {
    return {
      error: `File too large (${(parsed.bytes / 1024 / 1024).toFixed(2)} MB). Max ${(cap / 1024 / 1024).toFixed(1)} MB.`,
    };
  }

  return { mime: parsed.mime };
}
