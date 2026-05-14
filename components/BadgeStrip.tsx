import type { BadgeItem } from "@/lib/badges";

type Props = {
  items: BadgeItem[];
  className?: string;
  emptyHint?: string;
};

const tones: Record<BadgeItem["tone"], string> = {
  amber: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  emerald: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  violet: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  neutral: "bg-zinc-800/80 text-zinc-300 border-zinc-600/60",
  rose: "bg-rose-500/15 text-rose-200 border-rose-500/30",
};

export function BadgeStrip({ items, className = "", emptyHint }: Props) {
  if (items.length === 0) {
    if (!emptyHint) return null;
    return <p className={`text-xs italic text-zinc-500 ${className}`.trim()}>{emptyHint}</p>;
  }
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {items.map((b) => (
        <li
          key={b.id}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tones[b.tone]}`}
          title={b.hint ?? ""}
        >
          <span aria-hidden>{b.emoji}</span>
          <span>{b.label}</span>
          {b.hint ? <span className="ml-1 text-[10px] opacity-70">· {b.hint}</span> : null}
        </li>
      ))}
    </ul>
  );
}
