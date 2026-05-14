import { cookies } from "next/headers";
import { OnboardingTour } from "@/components/OnboardingTour";

export async function OnboardingTourGate() {
  const c = await cookies();
  const seen = c.get("onboarded")?.value === "1";
  if (seen) return null;
  return <OnboardingTour />;
}
