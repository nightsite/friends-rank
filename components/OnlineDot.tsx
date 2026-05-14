type Size = "xs" | "sm" | "md";

const SIZE: Record<Size, string> = {
  xs: "h-2 w-2",
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
};

type Props = {
  online: boolean;
  size?: Size;
  className?: string;
  title?: string;
};

/** Pulsing dot indicating presence. Renders nothing when offline. */
export function OnlineDot({ online, size = "sm", className = "", title }: Props) {
  if (!online) return null;
  return (
    <span
      className={`relative inline-flex ${SIZE[size]} ${className}`}
      aria-label={title ?? "Online"}
      title={title ?? "Online"}
      role="status"
    >
      <span className="absolute inset-0 inline-flex animate-ping rounded-full bg-emerald-400/60" />
      <span className="relative inline-flex h-full w-full rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
    </span>
  );
}
