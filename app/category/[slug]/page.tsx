import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_SLUGS } from "@/lib/constants";
import { requireSession } from "@/lib/session";
import { RateCard } from "@/components/RateCard";
import { getCategoryMeta } from "@/lib/category-meta";
import { PageShell } from "@/components/ui/PageShell";

type Props = { params: Promise<{ slug: string }> };

export default async function CategoryPage({ params }: Props) {
  const session = await requireSession();
  if (!session) redirect("/login");

  const { slug } = await params;
  if (!CATEGORY_SLUGS.includes(slug as (typeof CATEGORY_SLUGS)[number])) {
    notFound();
  }

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const meta = getCategoryMeta(category.slug);

  const users = await prisma.user.findMany({ orderBy: { displayName: "asc" } });
  const others = users.filter((u) => u.slug !== session.slug);

  const existing = await prisma.rating.findMany({
    where: { raterId: session.userId, categoryId: category.id },
  });
  const byRatee = new Map(existing.map((r) => [r.rateeId, r]));

  return (
    <PageShell
      title={category.name}
      description={
        meta?.tagline ??
        "Honest ranks + notes. You can update your rating anytime - timestamps update when you save."
      }
      actions={
        <Link
          href={`/leaderboard/${category.slug}`}
          className="inline-flex items-center justify-center rounded-xl border border-zinc-600/90 bg-zinc-950/50 px-4 py-2.5 text-sm font-medium text-zinc-100 shadow-sm transition hover:border-zinc-500 hover:bg-zinc-900/70"
        >
          View leaderboard
        </Link>
      }
    >
      <div className="mb-2 flex items-center gap-3">
        <span className="text-4xl drop-shadow" aria-hidden>
          {meta?.emoji ?? "⭐"}
        </span>
        <p className="text-sm text-zinc-500">
          Rate each person once per category — saves <span className="text-zinc-400">upsert</span> so you
          can revise later.
        </p>
      </div>
      <div className="grid gap-5">
        {others.map((u) => {
          const r = byRatee.get(u.id);
          return (
            <RateCard
              key={u.id}
              rateeSlug={u.slug}
              displayName={u.displayName}
              avatarUrl={u.avatarUrl}
              categorySlug={category.slug}
              initialStars={r?.stars ?? null}
              initialComment={r?.comment ?? ""}
              savedCreatedAt={r?.createdAt.toISOString() ?? null}
              savedUpdatedAt={r?.updatedAt.toISOString() ?? null}
              initialImage={r?.imageData ?? null}
              initialAudio={r?.audioData ?? null}
              initialReasons={r?.reasons ?? null}
            />
          );
        })}
      </div>
    </PageShell>
  );
}
