import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isOwner, requireUser } from "@/lib/permissions";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { ClientForm } from "../client-form";
import { deleteClient, updateClient } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contracts: {
        orderBy: { startDate: "desc" },
        include: { _count: { select: { payments: true } } },
      },
      events: {
        orderBy: { startAt: "desc" },
        take: 10,
      },
    },
  });
  if (!client) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/clients" className="text-sm text-brand-600 hover:underline">
          ← Back to clients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{client.name}</h1>
        <p className="text-sm text-slate-500">
          Added {formatDate(client.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <ClientForm
            action={updateClient.bind(null, client.id)}
            initial={client}
            submitLabel="Save changes"
          />
          {isOwner(user) && (
            <form
              action={deleteClient.bind(null, client.id)}
              className="mt-6 border-t pt-4 flex justify-end"
            >
              <button type="submit" className="btn-danger">Delete client</button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Contracts</h2>
              {isOwner(user) && (
                <Link href={`/contracts/new?clientId=${client.id}`} className="btn-secondary">
                  + New contract
                </Link>
              )}
            </div>
            {client.contracts.length === 0 ? (
              <p className="text-sm text-slate-500">No contracts yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {client.contracts.map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link href={`/contracts/${c.id}`} className="font-medium text-brand-700 hover:underline">
                        {c.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {formatMoney(c.totalAmount, c.currency)} · {c.status} · {formatDate(c.startDate)}
                      </p>
                    </div>
                    <span className="badge bg-slate-100 text-slate-600">
                      {c._count.payments} payments
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Recent events</h2>
            {client.events.length === 0 ? (
              <p className="text-sm text-slate-500">No events yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200 text-sm">
                {client.events.map((e) => (
                  <li key={e.id} className="py-2">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(e.startAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
