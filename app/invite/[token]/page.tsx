import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { InviteRedeemButton } from "@/components/InviteRedeemButton";

type Props = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: Props) {
  const session = await requireSession();
  if (!session) redirect("/login");

  const { token } = await params;
  const invite = await prisma.inviteToken.findUnique({
    where: { token: token.toLowerCase() },
    include: { createdBy: true, redeemedBy: true },
  });
  if (!invite) notFound();

  return (
    <PageShell
      title="Invite onboarding"
      description="Redeem invite tokens to unlock onboarding rewards and seasonal perks."
      actions={<Link href="/" className="text-sm font-medium text-amber-300">Home</Link>}
    >
      <Card hover={false} className="border-zinc-700/50">
        <p className="text-sm text-zinc-300">
          Created by <span className="font-medium text-white">{invite.createdBy.displayName}</span>
          {invite.note ? ` · ${invite.note}` : ""}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {invite.expiresAt ? `Expires ${invite.expiresAt.toLocaleString()}` : "No expiration set"}
        </p>
        {invite.redeemedById ? (
          <p className="mt-4 text-sm text-zinc-400">
            Already redeemed by {invite.redeemedBy?.displayName ?? "another user"}.
          </p>
        ) : (
          <div className="mt-4">
            <InviteRedeemButton token={invite.token} />
          </div>
        )}
      </Card>
    </PageShell>
  );
}
