export const ALLOWED_EMOJIS = ["🔥", "😂", "💀", "👀", "🫡", "❤️"] as const;
export type AllowedEmoji = (typeof ALLOWED_EMOJIS)[number];

export function isAllowedEmoji(s: unknown): s is AllowedEmoji {
  return (
    typeof s === "string" &&
    (ALLOWED_EMOJIS as readonly string[]).includes(s)
  );
}
