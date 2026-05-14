import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-amber-300 to-amber-500 text-zinc-950 font-semibold shadow-lg shadow-amber-900/25 hover:from-amber-200 hover:to-amber-400 disabled:opacity-50 disabled:shadow-none",
  ghost:
    "bg-white/5 text-zinc-200 border border-white/10 hover:bg-white/10 hover:border-white/15 disabled:opacity-50",
  outline:
    "border border-zinc-600 bg-zinc-950/40 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900/60 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${variants[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
