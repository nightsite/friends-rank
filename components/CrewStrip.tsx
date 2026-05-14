import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { HoverProfileCard } from "@/components/HoverProfileCard";
import { OnlineDot } from "@/components/OnlineDot";
import { getCrew } from "@/lib/crew";
import { isOnline } from "@/lib/presence";

type Props = {
  currentSlug?: string | null;
};

export async function CrewStrip({ currentSlug }: Props) {
  const crew = await getCrew();
  if (crew.length === 0) return null;

  return (
    <nav
      aria-label="Crew quick switcher"
      className="z-30 -mx-4 mb-4 border-b border-white/5 bg-zinc-950/70 px-3 py-2 backdrop-blur-md sm:-mx-6 sm:sticky sm:top-[72px] sm:px-4"
    >
      <ul className="flex items-center gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {crew.map((u) => {
          const active = currentSlug === u.slug;
          const online = isOnline(u.lastSeenAt);
          return (
            <li key={u.id} className="shrink-0">
              <HoverProfileCard
                slug={u.slug}
                displayName={u.displayName}
                avatarUrl={u.avatarUrl}
                bio={u.bio}
                rankValue={u.avgRank || undefined}
                mood={u.mood}
                lastSeenAt={u.lastSeenAt}
              >
                <Link
                  href={`/u/${u.slug}`}
                  className={`flex flex-col items-center gap-1 rounded-xl px-1.5 py-1 transition ${
                    active ? "bg-amber-500/10" : "hover:bg-white/5"
                  }`}
                >
                  <span className="relative inline-flex">
                    <Avatar
                      name={u.displayName}
                      url={u.avatarUrl}
                      size="sm"
                      rankValue={u.avgRank || undefined}
                    />
                    {online ? (
                      <span className="absolute -bottom-0.5 -right-0.5">
                        <OnlineDot online size="xs" />
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`max-w-[64px] truncate text-[10px] font-medium ${
                      active ? "text-amber-200" : "text-zinc-400"
                    }`}
                  >
                    {u.displayName.split(" ")[0]}
                  </span>
                </Link>
              </HoverProfileCard>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
