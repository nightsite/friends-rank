import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

type CreateBody = {
  slug?: unknown;
  title?: unknown;
  description?: unknown;
  themePreset?: unknown;
  badgeLabel?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim().toLowerCase();
  const title = String(body.title ?? "").trim();
  if (!slug || !title) return NextResponse.json({ error: "Slug and title are required." }, { status: 400 });
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: "Invalid slug." }, { status: 400 });

  const startsAt = body.startsAt ? new Date(String(body.startsAt)) : new Date();
  const endsAt = body.endsAt ? new Date(String(body.endsAt)) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  if (!(startsAt.getTime() < endsAt.getTime())) {
    return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
  }

  await prisma.seasonalEvent.upsert({
    where: { slug },
    create: {
      slug,
      title,
      description: String(body.description ?? "").trim() || null,
      themePreset: String(body.themePreset ?? "").trim() || null,
      badgeLabel: String(body.badgeLabel ?? "").trim() || null,
      startsAt,
      endsAt,
      isActive: true,
    },
    update: {
      title,
      description: String(body.description ?? "").trim() || null,
      themePreset: String(body.themePreset ?? "").trim() || null,
      badgeLabel: String(body.badgeLabel ?? "").trim() || null,
      startsAt,
      endsAt,
    },
  });

  return NextResponse.json({ ok: true });
}

type ToggleBody = {
  id?: unknown;
  isActive?: unknown;
};

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  let body: ToggleBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "Missing event id." }, { status: 400 });
  await prisma.seasonalEvent.update({
    where: { id },
    data: { isActive: Boolean(body.isActive) },
  });
  return NextResponse.json({ ok: true });
}
