import Link from "next/link";
import { formatRelative } from "@/lib/format-time";

export type ActivityItem = {
  id: string;
  raterName: string;
  rateeName: string;
  categoryName: string;
  categorySlug: string;
  updatedAt: string;
};

type Props = { items: ActivityItem[] };

export function RecentActivity({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-950/30 px-5 py-8 text-center text-sm text-zinc-500">
        No activity yet. Once people start rating, the feed lights up here — comments stay private.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3 text-sm"
        >
          <p className="min-w-0 text-zinc-300">
            <span className="font-medium text-white">{item.raterName}</span>
            <span className="text-zinc-500"> rated </span>
            <span className="font-medium text-zinc-200">{item.rateeName}</span>
            <span className="text-zinc-500"> in </span>
            <Link
              href={`/category/${item.categorySlug}`}
              className="font-medium text-amber-400/95 underline-offset-2 hover:text-amber-300 hover:underline"
            >
              {item.categoryName}
            </Link>
          </p>
          <time
            className="shrink-0 text-xs text-zinc-500"
            dateTime={item.updatedAt}
            title={item.updatedAt}
          >
            {formatRelative(new Date(item.updatedAt))}
          </time>
        </li>
      ))}
    </ul>
  );
}
