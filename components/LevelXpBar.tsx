import { xpBreakdown } from "@/lib/xp";

type Props = {
  xp: number;
  className?: string;
  size?: "sm" | "md";
};

export function LevelXpBar({ xp, className = "", size = "md" }: Props) {
  const b = xpBreakdown(xp);
  const pct = Math.round(b.progress * 100);
  const isSm = size === "sm";

  return (
    <div className={`flex w-full flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-widest">
        <span className="inline-flex items-center gap-1 font-display font-semibold text-amber-300">
          <span aria-hidden>🎮</span>
          Lv {b.level}
        </span>
        <span className="font-mono text-[10px] text-zinc-500">
          {b.intoLevel}/{b.spanForNextLevel} XP
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={b.spanForNextLevel}
        aria-valuenow={b.intoLevel}
        aria-label={`Level ${b.level} progress`}
        className={`relative overflow-hidden rounded-full border border-amber-500/30 bg-zinc-900/70 ${isSm ? "h-1.5" : "h-2.5"}`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-[0_0_12px_-2px_rgba(251,191,36,0.7)] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {!isSm ? (
        <p className="text-[10px] text-zinc-500">
          {b.xpToNext === 0 ? "Level up imminent." : `${b.xpToNext} XP to next level`}
        </p>
      ) : null}
    </div>
  );
}
