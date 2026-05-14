import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

const VAULT_NOTE_MAX = 2000;

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const targetSlug = (url.searchParams.get("targetSlug") ?? "").toLowerCase();
  if (!targetSlug) return NextResponse.json({ error: "Missing targetSlug" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { slug: targetSlug } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.id === session.userId) {
    return NextResponse.json({ note: null });
  }

  const note = await prisma.vaultNote.findUnique({
    where: { ownerId_targetId: { ownerId: session.userId, targetId: target.id } },
  });
  return NextResponse.json({ note: note ? { body: note.body, updatedAt: note.updatedAt } : null });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { targetSlug?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetSlug = String(body.targetSlug ?? "").toLowerCase();
  const text = String(body.body ?? "").slice(0, VAULT_NOTE_MAX);
  if (!targetSlug) return NextResponse.json({ error: "Missing targetSlug" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { slug: targetSlug } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.id === session.userId) {
    return NextResponse.json({ error: "Vault notes are for other people only." }, { status: 400 });
  }

  if (text.length === 0) {
    await prisma.vaultNote.deleteMany({
      where: { ownerId: session.userId, targetId: target.id },
    });
    return NextResponse.json({ ok: true, cleared: true });
  }

  await prisma.vaultNote.upsert({
    where: { ownerId_targetId: { ownerId: session.userId, targetId: target.id } },
    create: { ownerId: session.userId, targetId: target.id, body: text },
    update: { body: text },
  });

  return NextResponse.json({ ok: true });
}
