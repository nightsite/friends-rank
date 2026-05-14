import { prisma } from "@/lib/prisma";

type NotifyInput = {
  userId: string;
  kind: string;
  title: string;
  body: string;
  href?: string | null;
};

export async function createAppNotification(input: NotifyInput) {
  return prisma.appNotification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    },
  });
}
