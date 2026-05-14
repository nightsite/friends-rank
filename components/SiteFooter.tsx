export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-800/80 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-xs text-zinc-500">
      <p className="font-medium text-zinc-400">House rules</p>
      <p className="mx-auto mt-2 max-w-md leading-relaxed">
        Be honest, be kind, upgrade the squad. Stars are vibes, not verdicts — use comments to lift
        people up.
      </p>
      <p className="mt-4 text-zinc-600">Friends Rank · private crew leaderboard</p>
    </footer>
  );
}
