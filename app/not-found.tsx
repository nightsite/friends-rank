import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <Card hover={false} className="text-center">
      <h1 className="font-display text-2xl font-semibold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-400">That URL does not exist here.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-900/25 hover:from-amber-200 hover:to-amber-400"
      >
        Go home
      </Link>
    </Card>
  );
}
