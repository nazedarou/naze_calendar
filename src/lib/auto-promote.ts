import { prisma } from "@/lib/db";

/**
 * Promotes clients based on activity:
 * - Any client with a contract → CLOSED (terminal, overrides other statuses)
 * - FIRST_APPOINTMENT with a past event → SECOND_APPOINTMENT (if not already CLOSED)
 * Safe to call on every page load — only touches eligible rows.
 */
export async function autoPromoteClients() {
  const now = new Date();

  // CLOSED: any non-CLOSED client that has at least one contract
  await prisma.client.updateMany({
    where: {
      clientStatus: { not: "CLOSED" },
      contracts: { some: {} },
    },
    data: { clientStatus: "CLOSED" },
  });

  // SECOND_APPOINTMENT: FIRST_APPOINTMENT clients with at least one past event
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
