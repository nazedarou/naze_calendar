import { prisma } from "@/lib/db";

/**
 * Runs the full client status pipeline on every page load (idempotent):
 *
 * NEW → FIRST_APPOINTMENT              (any event scheduled, past or future)
 * FIRST_APPOINTMENT → SECOND_APPOINTMENT  (1st past event)
 * SECOND_APPOINTMENT → PENDING            (2nd past event)
 * PENDING → CLOSED                        (project/contract assigned)
 *
 * CLOSED is terminal and is never overridden by event-based rules.
 * The contract creation action also sets CLOSED immediately on save.
 */
export async function autoPromoteClients() {
  const now = new Date();

  // 1. CLOSED: any non-CLOSED client with at least one contract
  await prisma.client.updateMany({
    where: {
      clientStatus: { not: "CLOSED" },
      contracts: { some: {} },
    },
    data: { clientStatus: "CLOSED" },
  });

  // 2. PENDING: SECOND_APPOINTMENT clients with 2+ past events
  const secondToPending = await prisma.client.findMany({
    where: { clientStatus: "SECOND_APPOINTMENT" },
    select: {
      id: true,
      _count: { select: { events: { where: { startAt: { lt: now } } } } },
    },
  });
  const pendingIds = secondToPending
    .filter((c) => c._count.events >= 2)
    .map((c) => c.id);
  if (pendingIds.length > 0) {
    await prisma.client.updateMany({
      where: { id: { in: pendingIds } },
      data: { clientStatus: "PENDING" },
    });
  }

  // 3. SECOND_APPOINTMENT: FIRST_APPOINTMENT clients with 1+ past event
  await prisma.client.updateMany({
    where: {
      clientStatus: "FIRST_APPOINTMENT",
      events: { some: { startAt: { lt: now } } },
    },
    data: { clientStatus: "SECOND_APPOINTMENT" },
  });

  // 4. FIRST_APPOINTMENT: NEW clients with any event (past or upcoming)
  await prisma.client.updateMany({
    where: {
      clientStatus: "NEW",
      events: { some: {} },
    },
    data: { clientStatus: "FIRST_APPOINTMENT" },
  });
}
