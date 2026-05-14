export const USER_SLUGS = [
  "omer",
  "tugrahan",
  "efe",
  "talha",
  "cano",
] as const;

export type UserSlug = (typeof USER_SLUGS)[number];

export const CATEGORY_SLUGS = [
  "gym",
  "gaming",
  "face-card",
  "status",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const COMMENT_MAX = 2000;
