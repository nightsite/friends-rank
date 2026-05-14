"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  targetSlug: string;
  targetDisplayName: string;
  initialBody: string;
};

const MAX = 2000;

export function VaultNotePad({ targetSlug, targetDisplayName, initialBody }: Props) {
  const [text, setText] = useState(initialBody ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(initialBody ?? "");
  }, [initialBody]);

  function scheduleSave(next: string) {
    setText(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => doSave(next), 900);
  }

  async function doSave(value: string) {
    setError(null);
    setStatus("saving");
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetSlug, body: value }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Could not save");
        return;
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1400);
    } catch {
      setStatus("error");
      setError("Could not save");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Private — only you can see this. Locked to your account.
        </p>
        <span
          className={`text-[11px] font-medium ${
            status === "saved"
              ? "text-emerald-300"
              : status === "saving"
                ? "text-amber-200"
                : status === "error"
                  ? "text-rose-300"
                  : "text-zinc-500"
          }`}
        >
          {status === "saved"
            ? "Saved"
            : status === "saving"
              ? "Saving…"
              : status === "error"
                ? error
                : `${text.length}/${MAX}`}
        </span>
      </div>
      <textarea
        className="min-h-[120px] w-full resize-y rounded-xl border border-amber-500/30 bg-zinc-950/80 px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-inner shadow-black/30 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
        value={text}
        onChange={(e) => scheduleSave(e.target.value.slice(0, MAX))}
        placeholder={`Private notes about ${targetDisplayName}. Goals, observations, inside jokes. Auto-saves.`}
        maxLength={MAX}
      />
      <div className="flex justify-end">
        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            if (timer.current) clearTimeout(timer.current);
            doSave(text);
          }}
        >
          Save now
        </Button>
      </div>
    </div>
  );
}
