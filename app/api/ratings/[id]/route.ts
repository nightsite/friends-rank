import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, { params }: Props) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rating = await prisma.rating.findUnique({ where: { id } });
  if (!rating) return NextResponse.json({ error: "Rating nicht gefunden." }, { status: 404 });

  if (!session.isAdmin && rating.raterId !== session.userId) {
    return NextResponse.json({ error: "Du kannst nur dein eigenes Rating löschen." }, { status: 403 });
  }

  await prisma.rating.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

