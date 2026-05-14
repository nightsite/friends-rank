import type { ReactNode } from "react";

type Tone = "neutral" | "amber" | "emerald" | "violet";

type Props = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

const tones: Record<Tone, string> = {
  neutral: "bg-zinc-800/80 text-zinc-300 border-zinc-600/60",
  amber: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  emerald: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  violet: "bg-violet-500/15 text-violet-200 border-violet-500/30",
};

export function Badge({ children, tone = "neutral", className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
