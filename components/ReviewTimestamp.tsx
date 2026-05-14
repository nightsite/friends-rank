"use client";

import { formatAbsolute, formatRelative } from "@/lib/format-time";

type Props = {
  createdAt: string;
  updatedAt: string;
  className?: string;
};

export function ReviewTimestamp({ createdAt, updatedAt, className = "" }: Props) {
  const c = new Date(createdAt);
  const u = new Date(updatedAt);
  const edited = c.getTime() !== u.getTime();

  return (
    <div className={`text-xs leading-relaxed text-zinc-500 ${className}`.trim()}>
      <div>
        <span className="text-zinc-600">Updated </span>
        <time dateTime={u.toISOString()} title={formatAbsolute(u)} className="text-zinc-400">
          {formatRelative(u)}
        </time>
      </div>
      {edited ? (
        <div className="mt-0.5">
          <span className="text-zinc-600">Originally </span>
          <time dateTime={c.toISOString()} title={formatAbsolute(c)} className="text-zinc-500">
            {formatRelative(c)}
          </time>
        </div>
      ) : null}
    </div>
  );
}
