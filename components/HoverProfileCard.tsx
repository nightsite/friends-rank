"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/RankBadge";
import { OnlineDot } from "@/components/OnlineDot";
import { LastSeenLine } from "@/components/LastSeenLine";
import { MoodLine } from "@/components/MoodLine";
import { isOnline } from "@/lib/presence";

type Props = {
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  rankValue?: number;
  mood?: string | null;
  lastSeenAt?: Date | string | null;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
};

const ALIGN: Record<NonNullable<Props["align"]>, string> = {
  left: "left-0",
  center: "left-1/2 -translate-x-1/2",
  right: "right-0",
};

export function HoverProfileCard({
  slug,
  displayName,
  avatarUrl,
  bio,
  rankValue,
  mood,
  lastSeenAt,
  align = "center",
  children,
}: Props) {
  const online = isOnline(lastSeenAt ?? null);
  return (
    <span className="group/hover relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none invisible absolute top-full z-50 mt-2 w-64 rounded-2xl border border-zinc-700/80 bg-zinc-950/95 p-3 opacity-0 shadow-xl shadow-black/40 backdrop-blur transition duration-150 ease-out group-hover/hover:visible group-hover/hover:opacity-100 group-focus-within/hover:visible group-focus-within/hover:opacity-100 ${ALIGN[align]}`}
      >
        <span className="flex items-start gap-3">
          <span className="relative inline-flex">
            <Avatar
              name={displayName}
              url={avatarUrl}
              size="sm"
              rankValue={rankValue && rankValue > 0 ? rankValue : undefined}
            />
            {online ? (
              <span className="absolute -bottom-0.5 -right-0.5">
                <OnlineDot online size="sm" />
              </span>
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <Link
              href={`/u/${slug}`}
              className="block font-display text-sm font-semibold text-white hover:text-amber-300"
            >
              {displayName}
            </Link>
            <span className="block text-[10px] uppercase tracking-widest text-zinc-500">
              @{slug}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <LastSeenLine lastSeenAt={lastSeenAt ?? null} />
            </span>
            {mood ? <MoodLine mood={mood} className="mt-1" /> : null}
            {rankValue && rankValue > 0 ? (
              <span className="mt-2 inline-flex">
                <RankBadge value={rankValue} size="sm" />
              </span>
            ) : null}
            {bio ? (
              <span className="mt-2 block line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">
                {bio}
              </span>
            ) : null}
          </span>
        </span>
      </span>
    </span>
  );
}
