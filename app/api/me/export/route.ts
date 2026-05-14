import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { rankLabel } from "@/lib/ranks";

export const runtime = "nodejs";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.map(csvEscape).join(",");
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

export async function GET(_request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const given = await prisma.rating.findMany({
    where: { raterId: session.userId },
    include: { ratee: true, category: true },
    orderBy: { updatedAt: "desc" },
  });
  const received = await prisma.rating.findMany({
    where: { rateeId: session.userId },
    include: { rater: true, category: true },
    orderBy: { updatedAt: "desc" },
  });
  const profileGiven = await prisma.profileRating.findMany({
    where: { raterId: session.userId },
    include: { ratee: true },
    orderBy: { updatedAt: "desc" },
  });
  const profileReceived = await prisma.profileRating.findMany({
    where: { rateeId: session.userId },
    include: { rater: true },
    orderBy: { updatedAt: "desc" },
  });

  const rows: Record<string, unknown>[] = [];
  for (const r of given) {
    rows.push({
      direction: "given",
      kind: "category",
      target_slug: r.ratee.slug,
      target_name: r.ratee.displayName,
      category: r.category.name,
      rank_value: r.stars,
      rank_label: rankLabel(r.stars),
      comment: r.comment,
      reasons: r.reasons ?? "",
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    });
  }
  for (const r of received) {
    rows.push({
      direction: "received",
      kind: "category",
      target_slug: r.rater.slug,
      target_name: r.rater.displayName,
      category: r.category.name,
      rank_value: r.stars,
      rank_label: rankLabel(r.stars),
      comment: r.comment,
      reasons: r.reasons ?? "",
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    });
  }
  for (const r of profileGiven) {
    rows.push({
      direction: "given",
      kind: "profile",
      target_slug: r.ratee.slug,
      target_name: r.ratee.displayName,
      category: "",
      rank_value: r.stars,
      rank_label: rankLabel(r.stars),
      comment: r.comment,
      reasons: "",
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    });
  }
  for (const r of profileReceived) {
    rows.push({
      direction: "received",
      kind: "profile",
      target_slug: r.rater.slug,
      target_name: r.rater.displayName,
      category: "",
      rank_value: r.stars,
      rank_label: rankLabel(r.stars),
      comment: r.comment,
      reasons: "",
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    });
  }

  const csv = toCsv(rows, [
    "direction",
    "kind",
    "target_slug",
    "target_name",
    "category",
    "rank_value",
    "rank_label",
    "comment",
    "reasons",
    "created_at",
    "updated_at",
  ]);

  const filename = `friends-rank-${session.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
