import { prisma } from "@/lib/prisma";
import { NotificationToast } from "@/components/NotificationToast";

type Props = {
  userId: string;
};

const KIND_VARIANT = {
  rank_promotion: "promotion",
  achievement_unlocked: "achievement",
  level_up: "levelup",
} as const;

type Kind = keyof typeof KIND_VARIANT;

/**
 * Looks up the most recent unread "celebration" notification (promotion, achievement,
 * level-up) for the current user and renders a toast for it. The client component
 * marks it as read after rendering so we never show it twice.
 */
export async function LiveToasts({ userId }: Props) {
  try {
    const latest = await prisma.appNotification.findFirst({
      where: {
        userId,
        readAt: null,
        kind: { in: Object.keys(KIND_VARIANT) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!latest) return null;
    const variant = KIND_VARIANT[latest.kind as Kind];
    if (!variant) return null;
    return (
      <NotificationToast
        id={latest.id}
        title={latest.title}
        body={latest.body}
        variant={variant}
        ackEndpoint="/api/me/notification-ack"
      />
    );
  } catch {
    return null;
  }
}
