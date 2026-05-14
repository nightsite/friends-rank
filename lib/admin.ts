export function adminSlugs(): string[] {
  return String(process.env.ADMIN_SLUGS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return adminSlugs().includes(slug.toLowerCase());
}
