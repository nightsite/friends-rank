import { redirect } from "next/navigation";
import { DesktopWorkspace } from "@/components/DesktopWorkspace";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";

type Props = {
  params: Promise<{ view?: string[] }>;
};

type ViewConfig = {
  key: string;
  label: string;
  path: string;
};

const VIEW_CONFIGS: ViewConfig[] = [
  { key: "home", label: "Start", path: "/" },
  { key: "crew", label: "Crew", path: "/discover" },
  { key: "compare", label: "Vergleich", path: "/compare" },
  { key: "profile", label: "Mein Profil", path: "/u/me" },
  { key: "ratings", label: "Gym Ratings", path: "/category/gym" },
  { key: "events", label: "Events", path: "/events" },
  { key: "inbox", label: "Inbox", path: "/inbox" },
  { key: "settings", label: "Einstellungen", path: "/settings" },
  { key: "admin", label: "Admin", path: "/admin" },
];

function viewFromParam(value: string | undefined): string {
  if (!value) return "home";
  return VIEW_CONFIGS.some((cfg) => cfg.key === value) ? value : "home";
}

export default async function DesktopPage({ params }: Props) {
  const session = await requireSession();
  if (!session) redirect("/login");

  const p = await params;
  const requestedView = p.view?.[0];
  const currentView = viewFromParam(requestedView);
  if (currentView === "admin" && !session.isAdmin) {
    redirect("/desktop");
  }

  const navItems = VIEW_CONFIGS.filter((item) => item.key !== "admin" || session.isAdmin).map(
    (item) => ({
      ...item,
      href: item.key === "home" ? "/desktop" : `/desktop/${item.key}`,
    }),
  );

  return (
    <PageShell
      title="Friends Rank Desktop"
      description="Desktop-Modus mit schneller Sidebar-Navigation. Alle Kern-Features laufen weiter über dieselbe App und API."
    >
      <DesktopWorkspace
        title={session.displayName}
        subtitle="Windows App Shell"
        currentView={currentView}
        navItems={navItems}
        isImpersonating={session.isImpersonating}
      />
    </PageShell>
  );
}
