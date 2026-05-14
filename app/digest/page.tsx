import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/Avatar";
import { getDigestData, type CategoryMovement } from "@/lib/digest";

export const dynamic = "force-dynamic";

function MovementRow({ m, kind }: { m: CategoryMovement; kind: "up" | "down" }) {
  const sign = m.delta >= 0 ? "+" : "";
  const color = kind === "up" ? "text-emerald-300" : "text-rose-300";
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={m.userName} url={m.avatarUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">{m.userName}</p>
          <p className="truncate text-[11px] text-zinc-500">
            {m.categoryName} · {m.recentVotes} new vote{m.recentVotes === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${color}`}>
          {sign}
          {m.delta.toFixed(2)}
        </p>
        <p className="text-[11px] text-zinc-500">
          {m.recentAvg.toFixed(2)} ← {m.priorAvg.toFixed(2)}
        </p>
      </div>
    </li>
  );
}

export default async function DigestPage() {
  const session = await requireSession();
  if (!session) redirect("/login");

  const digest = await getDigestData();

  return (
    <PageShell
      title="Weekly digest"
      description="Who climbed, who slid, and the quote of the week — fresh take, every visit."
      actions={
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-600/90 bg-zinc-950/50 px-4 py-2.5 text-sm font-medium text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900/70"
        >
          Home
        </Link>
      }
    >
      {digest.quote ? (
        <Card hover={false} className="border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-zinc-950/80">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge tone="amber">Quote of the week</Badge>
              <p className="mt-3 font-display text-xl leading-relaxed text-white">
                &ldquo;{digest.quote.body}&rdquo;
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                {digest.quote.raterName} → {digest.quote.rateeName} · {digest.quote.categoryName} ·{" "}
                {digest.quote.reactionCount} reaction{digest.quote.reactionCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card hover={false} className="border-zinc-700/50">
          <p className="text-sm text-zinc-400">
            No quote of the week yet — drop a memorable comment to get pinned here.
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card hover={false} className="border-emerald-500/30">
          <h2 className="font-display text-lg font-semibold text-white">📈 Climbers</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Biggest avg gains in the last 7 days vs the prior 7.
          </p>
          {digest.climbers.length === 0 ? (
            <p className="mt-4 text-sm italic text-zinc-500">No upward movers yet this week.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {digest.climbers.map((m) => (
                <MovementRow key={`${m.userId}-${m.categoryId}`} m={m} kind="up" />
              ))}
            </ul>
          )}
        </Card>
        <Card hover={false} className="border-rose-500/30">
          <h2 className="font-display text-lg font-semibold text-white">📉 Sliders</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Cooled down lately. Use it as fuel, not a verdict.
          </p>
          {digest.sliders.length === 0 ? (
            <p className="mt-4 text-sm italic text-zinc-500">No sliders yet — keep it that way.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {digest.sliders.map((m) => (
                <MovementRow key={`${m.userId}-${m.categoryId}`} m={m} kind="down" />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
