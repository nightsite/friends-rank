import { formatRelative } from "@/lib/format-time";
import { isOnline } from "@/lib/presence";

type Props = {
  lastSeenAt: Date | string | null | undefined;
  className?: string;
  prefix?: string;
};

/** Shows "Online now" or "Last seen X ago". */
export function LastSeenLine({ lastSeenAt, className = "", prefix }: Props) {
  if (!lastSeenAt) {
    return (
      <span className={`text-[11px] text-zinc-500 ${className}`}>
        {prefix ? `${prefix} ` : ""}Never seen
      </span>
    );
  }
  const d = typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
  if (isOnline(d)) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 ${className}`}>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Online now
      </span>
    );
  }
  return (
    <span className={`text-[11px] text-zinc-500 ${className}`}>
      {prefix ? `${prefix} ` : "Last seen "}
      {formatRelative(d)}
    </span>
  );
}
