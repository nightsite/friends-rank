import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";

export default async function MyProfileRedirectPage() {
  const session = await requireSession();
  if (!session) redirect("/login");
  redirect(`/u/${session.slug}`);
}
