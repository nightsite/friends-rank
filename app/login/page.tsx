import { LoginForm } from "@/components/LoginForm";
import { Card } from "@/components/ui/Card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center lg:gap-14">
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Private Crew</p>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Rank die Crew.
          <span className="mt-2 block bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent">
            Gemeinsam Level up.
          </span>
        </h1>
        <p className="max-w-md text-pretty text-base leading-relaxed text-zinc-400">
          Vier Kategorien, fünf Freunde, ehrliche Ratings und Notizen. Login mit Name + PIN -
          keine öffentlichen Sign-ups.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm text-zinc-500">
          <li className="rounded-full border border-zinc-700/80 bg-zinc-900/40 px-3 py-1">Gym</li>
          <li className="rounded-full border border-zinc-700/80 bg-zinc-900/40 px-3 py-1">Gaming</li>
          <li className="rounded-full border border-zinc-700/80 bg-zinc-900/40 px-3 py-1">Face Card</li>
          <li className="rounded-full border border-zinc-700/80 bg-zinc-900/40 px-3 py-1">Status</li>
        </ul>
      </div>
      <div className="space-y-5">
        {sp.setup ? (
          <Card hover={false} className="border-amber-500/25 bg-amber-950/25">
            <p className="text-sm leading-relaxed text-amber-100/95">
              Server-Konfiguration ist unvollständig. Füge{" "}
              <code className="rounded-md bg-black/30 px-1.5 py-0.5 text-amber-200">
                SESSION_PASSWORD
              </code>{" "}
              (32+ chars) and{" "}
              <code className="rounded-md bg-black/30 px-1.5 py-0.5 text-amber-200">DATABASE_URL</code>{" "}
              in <code className="rounded-md bg-black/30 px-1.5 py-0.5 text-amber-200">.env</code> ein und
              starte danach{" "}
              <code className="rounded-md bg-black/30 px-1.5 py-0.5 text-amber-200">npm run dev</code> neu.
            </p>
          </Card>
        ) : null}
        <Card>
          <div className="mb-5">
            <h2 className="font-display text-xl font-semibold text-white">Einloggen</h2>
            <p className="mt-1 text-sm text-zinc-400">Wähle deinen Namen und gib deine PIN ein.</p>
          </div>
          <LoginForm />
        </Card>
      </div>
    </div>
  );
}
