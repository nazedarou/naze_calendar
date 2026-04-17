import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isOwner, requireUser } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { EventForm } from "../event-form";
import { deleteEvent, updateEvent } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const [event, clients, contracts, employees] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        assignments: { include: { user: true } },
      },
    }),
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
  if (!event) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/calendar" className="text-sm text-brand-600 hover:underline">
          ← Back to calendar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{event.title}</h1>
        <p className="text-sm text-slate-500">
          {formatDateTime(event.startAt)}
        </p>
      </div>

      <div className="card p-6">
        <EventForm
          action={updateEvent.bind(null, event.id)}
          initial={{
            title: event.title,
            description: event.description,
            location: event.location,
            startAt: event.startAt,
            clientId: event.clientId,
            contractId: event.contractId,
            assignedUserIds: event.assignments.map((a) => a.userId),
          }}
          clients={clients}
          contracts={contracts}
          employees={employees}
          submitLabel="Save changes"
          currentUserId={user.id}
          isEmployee={user.role === "EMPLOYEE"}
        />
        {isOwner(user) && (
          <form
            action={deleteEvent.bind(null, event.id)}
            className="mt-6 border-t pt-4 flex justify-end"
          >
            <button type="submit" className="btn-danger">Delete event</button>
          </form>
        )}
      </div>
    </div>
  );
}
