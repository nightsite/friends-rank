import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USERS = [
  { slug: "omer", displayName: "Ömer" },
  { slug: "tugrahan", displayName: "Tugrahan" },
  { slug: "efe", displayName: "Efe" },
  { slug: "talha", displayName: "Talha" },
  { slug: "cano", displayName: "Cano" },
] as const;

const CATEGORIES = [
  { slug: "gym", name: "Gym" },
  { slug: "gaming", name: "Gaming" },
  { slug: "face-card", name: "Face Card" },
  { slug: "status", name: "Status" },
] as const;

function pinForSlug(slug: string): string {
  const envKey = `SEED_PIN_${slug.toUpperCase().replace(/-/g, "_")}`;
  const fromEnv = process.env[envKey];
  if (fromEnv && fromEnv.length >= 6) return fromEnv;
  const def = process.env.SEED_PIN_DEFAULT;
  if (def && def.length >= 6) return def;
  // Dev-only fallback; change in production via env
  return "changeme";
}

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name },
      update: { name: c.name },
    });
  }

  for (const u of USERS) {
    const pin = pinForSlug(u.slug);
    if (pin.length < 6) {
      throw new Error(
        `PIN for ${u.slug} must be at least 6 characters (env ${`SEED_PIN_${u.slug.toUpperCase()}`} or SEED_PIN_DEFAULT).`,
      );
    }
    if (pin === "changeme") {
      console.warn(
        `[seed] Using default PIN "changeme" for ${u.slug}. Set SEED_PIN_DEFAULT or SEED_PIN_${u.slug.toUpperCase()} (min 6 chars).`,
      );
    }
    const pinHash = await bcrypt.hash(pin, 12);
    await prisma.user.upsert({
      where: { slug: u.slug },
      create: { slug: u.slug, displayName: u.displayName, pinHash },
      update: { displayName: u.displayName, pinHash },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
