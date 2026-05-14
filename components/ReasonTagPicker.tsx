"use client";

import { REASON_TAGS, REASON_TAG_MAX, reasonsForCategory } from "@/lib/reason-tags";

type Props = {
  categorySlug?: string;
  value: string[];
  onChange: (next: string[]) => void;
};

export function ReasonTagPicker({ categorySlug, value, onChange }: Props) {
  const set = new Set(value);
  const list = categorySlug ? reasonsForCategory(categorySlug) : REASON_TAGS;

  function toggle(slug: string) {
    const next = new Set(set);
    if (next.has(slug)) next.delete(slug);
    else {
      if (next.size >= REASON_TAG_MAX) return;
      next.add(slug);
    }
    onChange(Array.from(next));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Reason tags (optional)
        </p>
        <p className="text-[10px] text-zinc-500">
          {set.size}/{REASON_TAG_MAX}
        </p>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {list.map((tag) => {
          const active = set.has(tag.slug);
          return (
            <li key={tag.slug}>
              <button
                type="button"
                onClick={() => toggle(tag.slug)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-100"
                    : "border-zinc-700/70 bg-zinc-950/40 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <span aria-hidden>{tag.emoji}</span>
                {tag.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
