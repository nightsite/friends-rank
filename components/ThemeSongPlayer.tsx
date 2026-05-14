"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  displayName: string;
};

const SOUND_PREF_COOKIE = "soundsOff";

function isSoundsOff(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${SOUND_PREF_COOKIE}=1`);
}

function setSoundsOff(off: boolean) {
  try {
    const max = off ? 60 * 60 * 24 * 365 : 0;
    document.cookie = `${SOUND_PREF_COOKIE}=${off ? 1 : 0}; Path=/; Max-Age=${max}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function ThemeSongPlayer({ src, displayName }: Props) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isSoundsOff());
  }, []);

  async function toggle() {
    const audio = ref.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      audio.volume = 0.6;
      await audio.play();
      setPlaying(true);
    } catch {
      /* autoplay blocked or invalid src */
    }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setSoundsOff(next);
    if (next && ref.current) {
      ref.current.pause();
      setPlaying(false);
    }
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-zinc-950/80 px-2 py-1 shadow-inner"
      role="region"
      aria-label={`${displayName} theme song`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Pause theme song" : "Play theme song"}
        disabled={muted}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${
          muted
            ? "bg-zinc-800 text-zinc-500"
            : playing
              ? "bg-amber-400 text-zinc-950"
              : "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
        }`}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <span className="hidden text-[10px] font-medium uppercase tracking-widest text-amber-200 sm:inline">
        Theme · {displayName}
      </span>
      <button
        type="button"
        onClick={toggleMute}
        aria-pressed={muted}
        title={muted ? "Sounds off (click to enable)" : "Mute sounds globally"}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] text-zinc-400 hover:text-zinc-100"
      >
        {muted ? "🔇" : "🔊"}
      </button>
      <audio
        ref={ref}
        src={src}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}
