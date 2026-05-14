"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/Avatar";
import { BIO_MAX, DISPLAY_MAX, MOOD_MAX, PINNED_POST_MAX, TAGS_MAX } from "@/lib/profile-validation";
import { fileToProcessedImage } from "@/lib/image-process";
import { EnableNotifications } from "@/components/EnableNotifications";
import type { AnimePreset } from "@/lib/profile-presets";

type Props = {
  initialDisplayName: string;
  initialAvatarUrl: string | null;
  initialBio: string | null;
  initialBannerUrl: string | null;
  initialBgImageUrl: string | null;
  initialBgPreset: string | null;
  initialBgBlur: number;
  initialBgBrightness: number;
  initialAccentColor: string | null;
  initialProfileLayout: string;
  initialCardStyle: string;
  initialPinnedPost: string | null;
  initialFavoriteTags: string | null;
  initialMood: string | null;
  initialThemeAudioUrl: string | null;
  animePresets: AnimePreset[];
  vapidPublicKey: string | null;
};

export function SettingsForm({
  initialDisplayName,
  initialAvatarUrl,
  initialBio,
  initialBannerUrl,
  initialBgImageUrl,
  initialBgPreset,
  initialBgBlur,
  initialBgBrightness,
  initialAccentColor,
  initialProfileLayout,
  initialCardStyle,
  initialPinnedPost,
  initialFavoriteTags,
  initialMood,
  initialThemeAudioUrl,
  animePresets,
  vapidPublicKey,
}: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio ?? "");
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl ?? "");
  const [bgImageUrl, setBgImageUrl] = useState(initialBgImageUrl ?? "");
  const [bgPreset, setBgPreset] = useState(initialBgPreset ?? "");
  const [bgBlur, setBgBlur] = useState(initialBgBlur ?? 0);
  const [bgBrightness, setBgBrightness] = useState(initialBgBrightness ?? 100);
  const [accentColor, setAccentColor] = useState(initialAccentColor ?? "#f59e0b");
  const [profileLayout, setProfileLayout] = useState(initialProfileLayout ?? "classic");
  const [cardStyle, setCardStyle] = useState(initialCardStyle ?? "glass");
  const [pinnedPost, setPinnedPost] = useState(initialPinnedPost ?? "");
  const [favoriteTags, setFavoriteTags] = useState(initialFavoriteTags ?? "");
  const [mood, setMood] = useState(initialMood ?? "");
  const [themeAudioUrl, setThemeAudioUrl] = useState(initialThemeAudioUrl ?? "");
  const [avatarValue, setAvatarValue] = useState(initialAvatarUrl ?? "");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const bgFileRef = useRef<HTMLInputElement | null>(null);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg] = useState<string | null>(null);
  const [pinErr, setPinErr] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    setDisplayName(initialDisplayName);
    setAvatarValue(initialAvatarUrl ?? "");
    setBio(initialBio ?? "");
    setBannerUrl(initialBannerUrl ?? "");
    setBgImageUrl(initialBgImageUrl ?? "");
    setBgPreset(initialBgPreset ?? "");
    setBgBlur(initialBgBlur ?? 0);
    setBgBrightness(initialBgBrightness ?? 100);
    setAccentColor(initialAccentColor ?? "#f59e0b");
    setProfileLayout(initialProfileLayout ?? "classic");
    setCardStyle(initialCardStyle ?? "glass");
    setPinnedPost(initialPinnedPost ?? "");
    setFavoriteTags(initialFavoriteTags ?? "");
    setMood(initialMood ?? "");
    setThemeAudioUrl(initialThemeAudioUrl ?? "");
  }, [
    initialDisplayName,
    initialAvatarUrl,
    initialBio,
    initialBannerUrl,
    initialBgImageUrl,
    initialBgPreset,
    initialBgBlur,
    initialBgBrightness,
    initialAccentColor,
    initialProfileLayout,
    initialCardStyle,
    initialPinnedPost,
    initialFavoriteTags,
    initialMood,
    initialThemeAudioUrl,
  ]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    setPickError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const out = await fileToProcessedImage(f, {
        maxSize: 512,
        outputMime: "image/webp",
        quality: 0.86,
        square: true,
      });
      setAvatarValue(out.dataUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bild konnte nicht gelesen werden.";
      setPickError(msg);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clearPhoto() {
    setAvatarValue("");
    setPickError(null);
  }

  async function onPickBackground(e: React.ChangeEvent<HTMLInputElement>) {
    setPickError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const out = await fileToProcessedImage(f, {
        maxSize: 1920,
        outputMime: "image/webp",
        quality: 0.84,
        square: false,
      });
      setBgImageUrl(out.dataUrl);
      setBgPreset("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Hintergrundbild konnte nicht gelesen werden.";
      setPickError(msg);
    } finally {
      if (bgFileRef.current) bgFileRef.current.value = "";
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr(null);
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const res = await fetch("/api/me/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          avatarUrl: avatarValue,
          bannerUrl,
          bgImageUrl,
          bgPreset,
          bgBlur,
          bgBrightness,
          accentColor,
          profileLayout,
          cardStyle,
          pinnedPost,
          favoriteTags,
          mood,
          themeAudioUrl,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setProfileErr(data.error || "Profil konnte nicht gespeichert werden.");
        return;
      }
      setProfileMsg("Profile saved.");
      await router.refresh();
    } finally {
      setProfileLoading(false);
    }
  }

  async function savePin(e: React.FormEvent) {
    e.preventDefault();
    setPinErr(null);
    setPinMsg(null);
    if (newPin.length < 6) {
      setPinErr("Neue PIN muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinErr("Neue PIN und Bestätigung müssen übereinstimmen.");
      return;
    }
    setPinLoading(true);
    try {
      const res = await fetch("/api/me/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPin,
          newPin,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setPinErr(data.error || "PIN konnte nicht geändert werden.");
        return;
      }
      setPinMsg("PIN updated. Stay logged in — your session was refreshed.");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      await router.refresh();
    } finally {
      setPinLoading(false);
    }
  }

  const isData = avatarValue.startsWith("data:");
  const activePreset = animePresets.find((x) => x.id === bgPreset);
  const visualBg = bgImageUrl || activePreset?.imageUrl || "";

  return (
    <div className="space-y-8">
      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-xl font-semibold text-white">Profil</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Lade ein Foto oder GIF direkt vom Handy oder PC hoch. GIFs bleiben überall animiert.
        </p>
        <form onSubmit={saveProfile} className="mt-6 space-y-5">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar name={displayName || "You"} url={avatarValue || null} size="lg" animate />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-900/25 hover:from-amber-200 hover:to-amber-400"
                  htmlFor="avatar-file"
                >
                  Foto oder GIF hochladen
                  <input
                    id="avatar-file"
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    capture="user"
                    className="sr-only"
                    onChange={onPickFile}
                  />
                </label>
                {avatarValue ? (
                  <Button variant="ghost" type="button" onClick={clearPhoto}>
                    Entfernen
                  </Button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowUrlInput((v) => !v)}
                  className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                >
                  {showUrlInput ? "URL-Feld ausblenden" : "Oder URL einfügen"}
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                Standbilder werden automatisch quadratisch gecroppt und auf 512px verkleinert.
                Animierte GIFs (≤2 MB) werden unverändert gespeichert und überall abgespielt, wo dein Avatar erscheint.
              </p>
              {isData ? (
                <p className="text-[11px] text-zinc-500">
                  Gespeicherte Größe: ~{Math.round(avatarValue.length / 1024)} KB
                </p>
              ) : null}
              {pickError ? (
                <p className="text-sm text-red-400" role="alert">
                  {pickError}
                </p>
              ) : null}
            </div>
          </div>

          {showUrlInput ? (
            <label className="block text-sm font-medium text-zinc-300">
              Bild-URL (fortgeschritten)
              <input
                className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-base text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
                value={isData ? "" : avatarValue}
                onChange={(e) => setAvatarValue(e.target.value)}
                placeholder="https://…"
                inputMode="url"
                autoComplete="photo"
              />
            </label>
          ) : null}

          <label className="block text-sm font-medium text-zinc-300">
            Anzeigename
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-base text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={DISPLAY_MAX}
              autoComplete="nickname"
              required
            />
          </label>

          <label className="block text-sm font-medium text-zinc-300">
            Bio (optional)
            <textarea
              className="mt-2 min-h-[88px] w-full resize-y rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-sm leading-relaxed text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={BIO_MAX}
              placeholder="Lieblingsspiel, Gym-Fokus, Song, aktueller Vibe…"
            />
            <span className="mt-1 block text-right text-[11px] text-zinc-500">
              {bio.length}/{BIO_MAX}
            </span>
          </label>

          <label className="block text-sm font-medium text-zinc-300">
            Mood (Kurzstatus)
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-base text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              maxLength={MOOD_MAX}
              placeholder="🔥 grinding gym · 🎮 ranked grind · 😴 cooked"
            />
            <span className="mt-1 block text-right text-[11px] text-zinc-500">
              {mood.length}/{MOOD_MAX}
            </span>
          </label>

          <label className="block text-sm font-medium text-zinc-300">
            Theme-Song URL (optional)
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-base text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              value={themeAudioUrl}
              onChange={(e) => setThemeAudioUrl(e.target.value)}
              placeholder="https://example.com/your-theme.mp3"
              inputMode="url"
              maxLength={4000}
            />
            <span className="mt-1 block text-[11px] text-zinc-500">
              Ein kurzer Audio-Schnipsel, den Besucher auf deinem Profil abspielen können.
              Besucher können Sounds global muten. Direkte .mp3 / .ogg / .wav https-Links funktionieren am besten.
            </span>
          </label>

          <label className="block text-sm font-medium text-zinc-300">
            Angepinnter Post (optional)
            <textarea
              className="mt-2 min-h-[70px] w-full resize-y rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-sm leading-relaxed text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              value={pinnedPost}
              onChange={(e) => setPinnedPost(e.target.value)}
              maxLength={PINNED_POST_MAX}
              placeholder="Zitat, Mantra oder Status, der oben in deinem öffentlichen Profil steht."
            />
            <span className="mt-1 block text-right text-[11px] text-zinc-500">
              {pinnedPost.length}/{PINNED_POST_MAX}
            </span>
          </label>

          <label className="block text-sm font-medium text-zinc-300">
            Lieblings-Tags (optional)
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-base text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              value={favoriteTags}
              onChange={(e) => setFavoriteTags(e.target.value)}
              maxLength={TAGS_MAX}
              placeholder="anime, gym, fps, football, edits"
            />
            <span className="mt-1 block text-right text-[11px] text-zinc-500">
              {favoriteTags.length}/{TAGS_MAX}
            </span>
          </label>

          <div className="rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-4">
            <h3 className="font-display text-base font-semibold text-white">Profil-Visuals</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Stelle den Look deines öffentlichen Profils ein: Preset oder eigener Upload, danach
              Blur und Helligkeit feinjustieren.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {animePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setBgPreset(preset.id);
                    setBgImageUrl("");
                  }}
                  className={`overflow-hidden rounded-xl border text-left transition ${
                    bgPreset === preset.id
                      ? "border-amber-500/70 ring-2 ring-amber-500/30"
                      : "border-zinc-700/70 hover:border-zinc-500"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preset.imageUrl}
                    alt={preset.label}
                    className="h-24 w-full object-cover"
                    loading="lazy"
                  />
                  <span className="block px-3 py-2 text-xs font-medium text-zinc-200">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label
                className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-zinc-600/80 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-100 hover:border-zinc-500"
                htmlFor="bg-file"
              >
                Eigenen Hintergrund hochladen
                <input
                  id="bg-file"
                  ref={bgFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={onPickBackground}
                />
              </label>
              {(bgImageUrl || bgPreset) && (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setBgImageUrl("");
                    setBgPreset("");
                  }}
                >
                  Hintergrund entfernen
                </Button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-zinc-400">
                Blur: {bgBlur}px
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={bgBlur}
                  onChange={(e) => setBgBlur(Number(e.target.value))}
                  className="mt-1 w-full accent-amber-500"
                />
              </label>
              <label className="block text-xs font-medium text-zinc-400">
                Helligkeit: {bgBrightness}%
                <input
                  type="range"
                  min={60}
                  max={130}
                  step={1}
                  value={bgBrightness}
                  onChange={(e) => setBgBrightness(Number(e.target.value))}
                  className="mt-1 w-full accent-amber-500"
                />
              </label>
            </div>
          </div>

          <label className="block text-sm font-medium text-zinc-300">
            Banner-Bild (optional)
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-base text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium text-zinc-300">
              Accent-Farbe
              <input
                type="color"
                className="mt-2 h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 p-2"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-300">
              Profil-Layout
              <select
                className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-3 py-2 text-base text-white"
                value={profileLayout}
                onChange={(e) => setProfileLayout(e.target.value)}
              >
                <option value="classic">Klassisch</option>
                <option value="card-grid">Card Grid</option>
                <option value="spotlight">Spotlight</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-zinc-300">
              Card-Style
              <select
                className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-3 py-2 text-base text-white"
                value={cardStyle}
                onChange={(e) => setCardStyle(e.target.value)}
              >
                <option value="glass">Glass</option>
                <option value="solid">Solid</option>
                <option value="outline">Outline</option>
              </select>
            </label>
          </div>

          {visualBg ? (
            <div className="overflow-hidden rounded-xl border border-zinc-700/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={visualBg}
                alt="Hintergrund-Vorschau"
                className="h-40 w-full object-cover"
                style={{ filter: `blur(${bgBlur}px) brightness(${bgBrightness}%)` }}
              />
            </div>
          ) : null}

          {profileErr ? (
            <p className="text-sm text-red-400" role="alert">
              {profileErr}
            </p>
          ) : null}
          {profileMsg ? <p className="text-sm text-emerald-400">{profileMsg}</p> : null}
          <Button type="submit" disabled={profileLoading} className="min-h-12 w-full sm:w-auto">
            {profileLoading ? "Speichert…" : "Profil speichern"}
          </Button>
        </form>
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-xl font-semibold text-white">Deine Daten exportieren</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Lade alle vergebenen und erhaltenen Ratings als CSV herunter. Ideal für Backups oder
          eigene Excel-Auswertungen.
        </p>
        <a
          href="/api/me/export"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
        >
          ⬇ CSV herunterladen
        </a>
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-xl font-semibold text-white">Notifications</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Erhalte eine Push-Nachricht, wenn dich jemand ranked. Funktioniert am besten, wenn du
          Friends Rank auf dem Homescreen installierst.
        </p>
        <EnableNotifications vapidPublicKey={vapidPublicKey} className="mt-5" />
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-xl font-semibold text-white">PIN (Passwort)</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Deine PIN gilt nur für diese App. Wähle etwas Starkes und verwende kein anderes wichtiges Passwort erneut.
        </p>
        <form onSubmit={savePin} className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-zinc-300">
            Aktuelle PIN
            <input
              type="password"
              autoComplete="current-password"
              className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-base text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-zinc-300">
            Neue PIN
            <input
              type="password"
              autoComplete="new-password"
              className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-base text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              minLength={6}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-300">
            Neue PIN bestätigen
            <input
              type="password"
              autoComplete="new-password"
              className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-base text-white shadow-inner shadow-black/20 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              minLength={6}
            />
          </label>
          {pinErr ? (
            <p className="text-sm text-red-400" role="alert">
              {pinErr}
            </p>
          ) : null}
          {pinMsg ? <p className="text-sm text-emerald-400">{pinMsg}</p> : null}
          <Button type="submit" disabled={pinLoading} className="min-h-12 w-full sm:w-auto">
            {pinLoading ? "Aktualisiert…" : "PIN aktualisieren"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
