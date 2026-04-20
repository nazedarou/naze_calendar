import { prisma } from "@/lib/db";

/**
 * Promotes clients from FIRST_APPOINTMENT → SECOND_APPOINTMENT
 * once their first calendar event has passed.
 * Safe to call on every page load — only touches eligible rows.
 */
export async function autoPromoteClients() {
  const now = new Date();

  // Find clients still at FIRST_APPOINTMENT who have at least one past event
  const eligible = await prisma.client.findMany({
    where: {
      clientStatus: "FIRST_APPOINTMENT",
      events: { some: { startAt: { lt: now } } },
    },
    select: { id: true },
  });

  if (eligible.length === 0) return;

  await prisma.client.updateMany({
    where: { id: { in: eligible.map((c) => c.id) } },
    data: { clientStatus: "SECOND_APPOINTMENT" },
  });
}
