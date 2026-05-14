import { parseReasons } from "@/lib/reason-tags";

type Props = {
  reasons: string | null | undefined;
  className?: string;
};

export function ReasonTagsDisplay({ reasons, className = "" }: Props) {
  const tags = parseReasons(reasons);
  if (tags.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((t) => (
        <li
          key={t.slug}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-700/70 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-200"
          title={t.label}
        >
          <span aria-hidden>{t.emoji}</span>
          {t.label}
        </li>
      ))}
    </ul>
  );
}
