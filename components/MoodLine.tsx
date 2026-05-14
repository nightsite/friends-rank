type Props = {
  mood: string | null | undefined;
  className?: string;
};

/** Renders a small "mood" line under a name, e.g. "🔥 grinding gym". */
export function MoodLine({ mood, className = "" }: Props) {
  if (!mood) return null;
  const trimmed = mood.trim();
  if (!trimmed) return null;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 truncate text-[11px] text-amber-200/85 ${className}`}
      title={trimmed}
    >
      <span aria-hidden>💭</span>
      <span className="truncate">{trimmed}</span>
    </span>
  );
}
