import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { EventForm } from "../event-form";
import { createEvent } from "../actions";

type Props = { searchParams: Promise<{ clientId?: string; contractId?: string }> };

export default async function NewEventPage({ searchParams }: Props) {
  await requireUser();
  const { clientId, contractId } = await searchParams;

  const [clients, contracts, employees] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.contract.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, title: true, clientId: true },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <Link href="/calendar" className="text-sm text-brand-600 hover:underline">
          ← Back to calendar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New event</h1>
      </div>
      <div className="card p-6 max-w-3xl">
        <EventForm
          action={createEvent}
          clients={clients}
          contracts={contracts}
          employees={employees}
          defaultClientId={clientId}
          defaultContractId={contractId}
          submitLabel="Create event"
        />
      </div>
    </div>
  );
}
