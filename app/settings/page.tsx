import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";
import { SettingsForm } from "@/components/SettingsForm";
import { ANIME_PRESETS } from "@/lib/profile-presets";

export default async function SettingsPage() {
  const session = await requireSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? null;

  return (
    <PageShell
      title="Settings"
      description="Update your photo, display name, bio, notifications, and sign-in PIN."
    >
      <SettingsForm
        initialDisplayName={user.displayName}
        initialAvatarUrl={user.avatarUrl}
        initialBio={user.bio}
        initialBannerUrl={user.bannerUrl}
        initialBgImageUrl={user.bgImageUrl}
        initialBgPreset={user.bgPreset}
        initialBgBlur={user.bgBlur}
        initialBgBrightness={user.bgBrightness}
        initialAccentColor={user.accentColor}
        initialProfileLayout={user.profileLayout}
        initialCardStyle={user.cardStyle}
        initialPinnedPost={user.pinnedPost}
        initialFavoriteTags={user.favoriteTags}
        initialMood={user.mood}
        initialThemeAudioUrl={user.themeAudioUrl}
        animePresets={ANIME_PRESETS}
        vapidPublicKey={vapidPublicKey}
      />
    </PageShell>
  );
}
