import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankLabel } from "@/lib/ranks";

export const runtime = "nodejs";

const TIER_COLOR: Record<string, [string, string]> = {
  bronze: ["#7c4f1f", "#b97a31"],
  silver: ["#5b6168", "#a6b2bc"],
  gold: ["#a76b13", "#ecc14a"],
  dia: ["#1c5470", "#5ccdf0"],
  platin: ["#0e7c70", "#7be8d5"],
  master: ["#5b2da6", "#b189f5"],
  challenger: ["#a35a06", "#fde04a"],
};

function tierFromRank(value: number): keyof typeof TIER_COLOR {
  const v = Math.max(1, Math.min(19, Math.round(value)));
  if (v === 19) return "challenger";
  const idx = Math.floor((v - 1) / 3);
  return (["bronze", "silver", "gold", "dia", "platin", "master"] as const)[idx];
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") ?? "").toLowerCase();
  const variant = url.searchParams.get("v") === "story" ? "story" : "og";

  const width = variant === "story" ? 1080 : 1200;
  const height = variant === "story" ? 1920 : 630;

  try {
    const user = slug
      ? await prisma.user.findUnique({
          where: { slug },
          select: {
            id: true,
            slug: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            level: true,
            xp: true,
          },
        })
      : null;

    let avgRank = 0;
    if (user) {
      const agg = await prisma.rating.aggregate({
        where: { rateeId: user.id },
        _avg: { stars: true },
      });
      avgRank = agg._avg.stars != null ? Number(agg._avg.stars) : 0;
    }

    const tier = avgRank > 0 ? tierFromRank(avgRank) : "gold";
    const [c1, c2] = TIER_COLOR[tier];
    const rankText = avgRank > 0 ? rankLabel(avgRank) : "Unranked";

    if (!user) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#09090b 0%,#1c1917 100%)",
              color: "white",
              fontFamily: "sans-serif",
            }}
          >
            <div style={{ fontSize: 96, fontWeight: 800 }}>Friends Rank</div>
            <div style={{ marginTop: 12, fontSize: 36, color: "#fbbf24" }}>
              Rate your crew. Level up together.
            </div>
          </div>
        ),
        { width, height },
      );
    }

    const isStory = variant === "story";
    const avatarSize = isStory ? 320 : 240;
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: `radial-gradient(circle at 50% 30%, ${c2}55, transparent 60%), linear-gradient(135deg,#09090b 0%,#1c1917 100%)`,
            color: "white",
            fontFamily: "sans-serif",
            padding: 64,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              fontSize: 28,
              color: "#fbbf24",
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            ⚡ Friends Rank
          </div>
          <div
            style={{
              marginTop: 32,
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize,
              background: `linear-gradient(135deg, ${c1}, ${c2})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 80px ${c2}55`,
              overflow: "hidden",
            }}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
              <img
                src={user.avatarUrl}
                width={avatarSize}
                height={avatarSize}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ fontSize: avatarSize * 0.4, fontWeight: 800, color: "#0a0a0a" }}>
                {(user.displayName[0] ?? "?").toUpperCase()}
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: isStory ? 88 : 72,
              fontWeight: 800,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            {user.displayName}
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: isStory ? 32 : 28,
              color: "#a1a1aa",
            }}
          >
            @{user.slug}
          </div>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              gap: 16,
              alignItems: "center",
              padding: "16px 32px",
              borderRadius: 999,
              background: `linear-gradient(135deg, ${c1}cc, ${c2}cc)`,
              fontSize: isStory ? 42 : 36,
              fontWeight: 700,
              boxShadow: `0 12px 40px ${c2}40`,
            }}
          >
            <span style={{ fontSize: isStory ? 50 : 42 }}>🏅</span>
            {rankText}
          </div>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 24,
              fontSize: isStory ? 28 : 24,
              color: "#fbbf24",
              fontWeight: 600,
            }}
          >
            <span>🎮 Lv {user.level}</span>
            <span>·</span>
            <span>{user.xp} XP</span>
          </div>
        </div>
      ),
      { width, height },
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#09090b",
            color: "white",
            fontSize: 64,
          }}
        >
          Friends Rank
        </div>
      ),
      { width, height },
    );
  }
}
