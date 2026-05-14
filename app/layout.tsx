import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { RouteTransition } from "@/components/RouteTransition";
import { CrewStrip } from "@/components/CrewStrip";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { LiveToasts } from "@/components/LiveToasts";
import { OnboardingTourGate } from "@/components/OnboardingTourGate";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { findPresetImage } from "@/lib/profile-presets";
import { tierKeyForRank } from "@/lib/ranks";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Friends Rank",
  description: "Rate your crew. Level up together.",
  manifest: "/manifest.webmanifest",
  applicationName: "Friends Rank",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Friends Rank",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let dynamicBg: string | null = null;
  let dynamicAccent: string | null = null;
  let dynamicBlur = 0;
  let dynamicBrightness = 100;
  let authedUserId: string | null = null;
  let unreadCount = 0;
  let rankTier: string | null = null;
  try {
    const s = await getSession();
    if (s.userId) {
      authedUserId = s.userId;
      const me = await prisma.user.findUnique({
        where: { id: s.userId },
        select: {
          bgImageUrl: true,
          bgPreset: true,
          bannerUrl: true,
          accentColor: true,
          bgBlur: true,
          bgBrightness: true,
        },
      });
      if (me) {
        dynamicBg = me.bgImageUrl || findPresetImage(me.bgPreset) || me.bannerUrl || null;
        dynamicAccent = me.accentColor ?? null;
        dynamicBlur = me.bgBlur ?? 0;
        dynamicBrightness = me.bgBrightness ?? 100;
      }
      try {
        unreadCount = await prisma.appNotification.count({
          where: { userId: s.userId, readAt: null },
        });
      } catch {
        unreadCount = 0;
      }
      try {
        const agg = await prisma.rating.aggregate({
          where: { rateeId: s.userId },
          _avg: { stars: true },
        });
        const avg = agg._avg.stars != null ? Number(agg._avg.stars) : 0;
        if (avg > 0) rankTier = tierKeyForRank(avg);
      } catch {
        rankTier = null;
      }
    }
  } catch {
    // keep static default background
  }

  return (
    <html lang="en" className={`${dmSans.variable} ${outfit.variable}`}>
      <body
        className={`${dmSans.className} relative z-[1] flex min-h-dvh flex-col antialiased`}
        data-rank-tier={rankTier ?? undefined}
        style={
          {
            "--user-bg-image": dynamicBg ? `url("${dynamicBg}")` : "none",
            "--user-bg-blur": `${dynamicBlur}px`,
            "--user-bg-brightness": `${dynamicBrightness}%`,
            "--accent": dynamicAccent ?? "#f59e0b",
            "--accent-soft": dynamicAccent ? `${dynamicAccent}33` : "rgba(245, 158, 11, 0.15)",
          } as CSSProperties
        }
      >
        <div className="ambient-orb ambient-orb-1" aria-hidden />
        <div className="ambient-orb ambient-orb-2" aria-hidden />
        <div className="ambient-orb ambient-orb-3" aria-hidden />
        {rankTier ? <div className="rank-glow" data-rank-tier={rankTier} aria-hidden /> : null}
        <div className="relative z-[1] mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pt-6">
          <Header />
          {authedUserId ? <CrewStrip /> : null}
          <main className="mt-6 flex-1">
            <RouteTransition>{children}</RouteTransition>
          </main>
          <SiteFooter />
        </div>
        {authedUserId ? <MobileBottomNav unreadCount={unreadCount} /> : null}
        {authedUserId ? <LiveToasts userId={authedUserId} /> : null}
        {authedUserId ? <OnboardingTourGate /> : null}
      </body>
    </html>
  );
}
