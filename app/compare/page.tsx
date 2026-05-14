import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { CompareView, type CompareSide } from "@/components/CompareView";
import { CATEGORY_META } from "@/lib/category-meta";
import type { CategorySlug } from "@/lib/constants";

type Props = {
  searchParams: Promise<{ a?: string; b?: string }>;
};

export default async function ComparePage({ searchParams }: Props) {
  const session = await requireSession();
  if (!session) redirect("/login");
  const sp = await searchParams;

  const me = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!me) redirect("/login");

  const aSlugRaw = (sp.a ?? "me").toLowerCase();
  const bSlugRaw = (sp.b ?? "").toLowerCase();

  const slugA = aSlugRaw === "me" ? me.slug : aSlugRaw;
  const slugB = bSlugRaw === "me" ? me.slug : bSlugRaw;

  const allUsers = await prisma.user.findMany({ orderBy: { displayName: "asc" } });
  const userBySlug = new Map(allUsers.map((u) => [u.slug, u]));

  const userA = slugA ? userBySlug.get(slugA) : undefined;
  const userB = slugB ? userBySlug.get(slugB) : undefined;

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const compareCategories = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    emoji: CATEGORY_META[c.slug as CategorySlug]?.emoji ?? "⭐",
  }));

  let sideA: CompareSide | null = null;
  let sideB: CompareSide | null = null;
  if (userA && userB && userA.id !== userB.id) {
    const grouped = await prisma.rating.groupBy({
      by: ["categoryId", "rateeId"],
      where: { rateeId: { in: [userA.id, userB.id] } },
      _avg: { stars: true },
      _count: { _all: true },
    });
    const overallA = await prisma.rating.aggregate({
      where: { rateeId: userA.id },
      _avg: { stars: true },
    });
    const overallB = await prisma.rating.aggregate({
      where: { rateeId: userB.id },
      _avg: { stars: true },
    });

    function buildSide(u: typeof userA): CompareSide {
      const perCategory: CompareSide["perCategory"] = {};
      for (const cat of categories) {
        const g = grouped.find((x) => x.categoryId === cat.id && x.rateeId === u.id);
        perCategory[cat.slug] = {
          rank: g?._avg.stars != null ? Number(g._avg.stars) : 0,
          votes: g?._count._all ?? 0,
        };
      }
      const overall = u.id === userA.id ? overallA : overallB;
      return {
        id: u.id,
        slug: u.slug,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        overallRank: overall._avg.stars != null ? Number(overall._avg.stars) : 0,
        perCategory,
      };
    }

    sideA = buildSide(userA);
    sideB = buildSide(userB);
  }

  return (
    <PageShell
      title="Compare crew"
      description="Pick two friends and put their ranks head to head, category by category."
    >
      <Card hover={false} className="border-zinc-700/50">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <label className="text-sm font-medium text-zinc-300">
            Person A
            <select
              name="a"
              defaultValue={slugA}
              className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 text-base text-white"
            >
              <option value="me">Me ({me.displayName})</option>
              {allUsers
                .filter((u) => u.id !== me.id)
                .map((u) => (
                  <option key={u.id} value={u.slug}>
                    {u.displayName}
                  </option>
                ))}
            </select>
          </label>
          <span className="hidden self-end pb-3 font-display text-xl font-semibold text-zinc-500 sm:block">
            VS
          </span>
          <label className="text-sm font-medium text-zinc-300">
            Person B
            <select
              name="b"
              defaultValue={slugB}
              className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70 px-3 text-base text-white"
            >
              <option value="">Pick someone…</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.slug}>
                  {u.displayName}
                  {u.id === me.id ? " (me)" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-3">
            <button className="mt-1 min-h-11 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 text-sm font-semibold text-amber-200">
              Compare
            </button>
          </div>
        </form>
      </Card>

      {sideA && sideB ? (
        <CompareView a={sideA} b={sideB} categories={compareCategories} />
      ) : (
        <Card hover={false} className="border-zinc-700/50 text-center">
          <p className="text-sm text-zinc-400">
            Pick a second person above to see a side-by-side breakdown.
          </p>
          <Link href="/discover" className="mt-3 inline-block text-xs text-amber-300">
            Or pick from Crew →
          </Link>
        </Card>
      )}
    </PageShell>
  );
}
