import Link from "next/link";

type Variant = "empty" | "search" | "inbox" | "events" | "wall" | "ratings" | "vault";

type Props = {
  variant?: Variant;
  title: string;
  hint?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

function Illustration({ variant }: { variant: Variant }) {
  const common = "h-24 w-24 text-amber-500/40";
  if (variant === "search") {
    return (
      <svg viewBox="0 0 64 64" className={common} fill="none" aria-hidden>
        <circle cx="26" cy="26" r="14" stroke="currentColor" strokeWidth="3" />
        <line x1="38" y1="38" x2="54" y2="54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="22" cy="22" r="2" fill="currentColor" />
        <circle cx="30" cy="22" r="2" fill="currentColor" />
        <path d="M22 30 Q26 33 30 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (variant === "inbox") {
    return (
      <svg viewBox="0 0 64 64" className={common} fill="none" aria-hidden>
        <path d="M8 24 L32 10 L56 24 L56 50 L8 50 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M8 24 L32 38 L56 24" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="32" cy="44" r="2" fill="currentColor" />
      </svg>
    );
  }
  if (variant === "events") {
    return (
      <svg viewBox="0 0 64 64" className={common} fill="none" aria-hidden>
        <rect x="8" y="14" width="48" height="42" rx="4" stroke="currentColor" strokeWidth="3" />
        <line x1="8" y1="24" x2="56" y2="24" stroke="currentColor" strokeWidth="3" />
        <line x1="20" y1="10" x2="20" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="44" y1="10" x2="44" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="36" r="3" fill="currentColor" />
        <circle cx="32" cy="36" r="3" fill="currentColor" />
        <circle cx="44" cy="36" r="3" fill="currentColor" />
      </svg>
    );
  }
  if (variant === "wall") {
    return (
      <svg viewBox="0 0 64 64" className={common} fill="none" aria-hidden>
        <rect x="6" y="14" width="52" height="34" rx="4" stroke="currentColor" strokeWidth="3" />
        <path d="M22 48 L26 56 L34 48" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <line x1="14" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="32" x2="50" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="40" x2="34" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === "ratings") {
    return (
      <svg viewBox="0 0 64 64" className={common} fill="none" aria-hidden>
        <path
          d="M32 8 L40 22 L56 24 L44 36 L48 52 L32 44 L16 52 L20 36 L8 24 L24 22 Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (variant === "vault") {
    return (
      <svg viewBox="0 0 64 64" className={common} fill="none" aria-hidden>
        <rect x="12" y="26" width="40" height="30" rx="4" stroke="currentColor" strokeWidth="3" />
        <path d="M20 26 V18 a12 12 0 0 1 24 0 V26" stroke="currentColor" strokeWidth="3" />
        <circle cx="32" cy="40" r="3" fill="currentColor" />
        <line x1="32" y1="42" x2="32" y2="48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={common} fill="none" aria-hidden>
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="3" />
      <circle cx="24" cy="28" r="2" fill="currentColor" />
      <circle cx="40" cy="28" r="2" fill="currentColor" />
      <path d="M22 42 Q32 36 42 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function EmptyState({
  variant = "empty",
  title,
  hint,
  actionLabel,
  actionHref,
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 px-6 py-10 text-center ${className}`}
    >
      <Illustration variant={variant} />
      <p className="font-display text-base font-semibold text-white">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-zinc-400">{hint}</p> : null}
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-1 inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
