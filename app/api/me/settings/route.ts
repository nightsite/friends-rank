import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import {
  normalizeAccentColor,
  normalizeAvatarValue,
  normalizeBio,
  normalizeDisplayName,
  normalizeFavoriteTags,
  normalizeIntRange,
  normalizeMood,
  normalizePinnedPost,
  normalizeThemeToken,
  validateNewPin,
} from "@/lib/profile-validation";
import { getSessionOptions, type SessionData } from "@/lib/session-config";
import { ANIME_PRESETS } from "@/lib/profile-presets";

export const runtime = "nodejs";

type Body = {
  displayName?: unknown;
  /** Either an http(s) URL, a data: URL, or "" to clear. */
  avatarUrl?: unknown;
  bio?: unknown;
  bannerUrl?: unknown;
  bgImageUrl?: unknown;
  bgPreset?: unknown;
  bgBlur?: unknown;
  bgBrightness?: unknown;
  accentColor?: unknown;
  profileLayout?: unknown;
  cardStyle?: unknown;
  pinnedPost?: unknown;
  favoriteTags?: unknown;
  mood?: unknown;
  themeAudioUrl?: unknown;
  currentPin?: unknown;
  newPin?: unknown;
};

export async function PATCH(request: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(
    request,
    res,
    getSessionOptions(),
  );

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data: {
    displayName?: string;
    avatarUrl?: string | null;
    bio?: string | null;
    bannerUrl?: string | null;
    bgImageUrl?: string | null;
    bgPreset?: string | null;
    bgBlur?: number;
    bgBrightness?: number;
    accentColor?: string | null;
    profileLayout?: string;
    cardStyle?: string;
    pinnedPost?: string | null;
    favoriteTags?: string | null;
    mood?: string | null;
    themeAudioUrl?: string | null;
    pinHash?: string;
  } = {};

  if (body.displayName !== undefined) {
    const dn = normalizeDisplayName(body.displayName);
    if (typeof dn === "object" && "error" in dn) {
      return NextResponse.json({ error: dn.error }, { status: 400 });
    }
    data.displayName = dn;
  }

  if (body.avatarUrl !== undefined) {
    const av = normalizeAvatarValue(body.avatarUrl);
    if (av && typeof av === "object" && "error" in av) {
      return NextResponse.json({ error: av.error }, { status: 400 });
    }
    data.avatarUrl = av as string | null;
  }

  if (body.bio !== undefined) {
    const bio = normalizeBio(body.bio);
    if (bio && typeof bio === "object" && "error" in bio) {
      return NextResponse.json({ error: bio.error }, { status: 400 });
    }
    data.bio = bio as string | null;
  }

  if (body.bannerUrl !== undefined) {
    const v = normalizeAvatarValue(body.bannerUrl);
    if (v && typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: `Banner: ${v.error}` }, { status: 400 });
    }
    data.bannerUrl = v as string | null;
  }

  if (body.bgImageUrl !== undefined) {
    const v = normalizeAvatarValue(body.bgImageUrl);
    if (v && typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: `Background image: ${v.error}` }, { status: 400 });
    }
    data.bgImageUrl = v as string | null;
  }

  if (body.bgPreset !== undefined) {
    const p = normalizeThemeToken(body.bgPreset);
    if (p && typeof p === "object" && "error" in p) {
      return NextResponse.json({ error: p.error }, { status: 400 });
    }
    if (p && !ANIME_PRESETS.some((x) => x.id === p)) {
      return NextResponse.json({ error: "Unknown anime preset." }, { status: 400 });
    }
    data.bgPreset = p as string | null;
  }

  if (body.bgBlur !== undefined) {
    const v = normalizeIntRange(body.bgBlur, { min: 0, max: 24, name: "Blur" });
    if (typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    data.bgBlur = v;
  }

  if (body.bgBrightness !== undefined) {
    const v = normalizeIntRange(body.bgBrightness, {
      min: 60,
      max: 130,
      name: "Brightness",
    });
    if (typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    data.bgBrightness = v;
  }

  if (body.accentColor !== undefined) {
    const v = normalizeAccentColor(body.accentColor);
    if (v && typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    data.accentColor = v as string | null;
  }

  if (body.profileLayout !== undefined) {
    const v = normalizeThemeToken(body.profileLayout, { maxLength: 20 });
    if (v && typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    data.profileLayout = (v as string | null) ?? "classic";
  }

  if (body.cardStyle !== undefined) {
    const v = normalizeThemeToken(body.cardStyle, { maxLength: 20 });
    if (v && typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    data.cardStyle = (v as string | null) ?? "glass";
  }

  if (body.pinnedPost !== undefined) {
    const v = normalizePinnedPost(body.pinnedPost);
    if (v && typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    data.pinnedPost = v as string | null;
  }

  if (body.favoriteTags !== undefined) {
    const v = normalizeFavoriteTags(body.favoriteTags);
    if (v && typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    data.favoriteTags = v as string | null;
  }

  if (body.mood !== undefined) {
    const v = normalizeMood(body.mood);
    if (v && typeof v === "object" && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    data.mood = v as string | null;
  }

  if (body.themeAudioUrl !== undefined) {
    const raw = body.themeAudioUrl;
    if (raw === null || raw === "") {
      data.themeAudioUrl = null;
    } else {
      const s = String(raw).trim();
      if (s.length > 4000) {
        return NextResponse.json({ error: "Theme song URL is too long." }, { status: 400 });
      }
      const allowed =
        s.startsWith("https://") ||
        s.startsWith("data:audio/");
      if (!allowed) {
        return NextResponse.json(
          { error: "Theme song must be an https:// URL or audio data URL." },
          { status: 400 },
        );
      }
      data.themeAudioUrl = s;
    }
  }

  const newPinRaw = body.newPin;
  const wantsPin =
    newPinRaw !== undefined && newPinRaw !== null && String(newPinRaw).length > 0;

  if (wantsPin) {
    const current = String(body.currentPin ?? "");
    const ok = await bcrypt.compare(current, user.pinHash);
    if (!ok) {
      return NextResponse.json({ error: "Current PIN is incorrect." }, { status: 401 });
    }
    const np = validateNewPin(newPinRaw);
    if (typeof np === "object" && "error" in np) {
      return NextResponse.json({ error: np.error }, { status: 400 });
    }
    data.pinHash = await bcrypt.hash(np, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data,
  });

  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fresh) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  session.displayName = fresh.displayName;
  session.avatarUrl = fresh.avatarUrl ?? undefined;
  await session.save();

  return NextResponse.json({ ok: true, pinChanged: Boolean(data.pinHash) });
}
