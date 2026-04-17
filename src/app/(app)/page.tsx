import Link from "next/link";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const owner = user.role === "OWNER";
  const now = new Date();
  const horizon = addDays(now, 30);

  const paymentFilter = owner
    ? {}
    : { contract: { assignments: { some: { userId: user.id } } } };

  const [upcomingEvents, overduePayments, upcomingPayments, clientsCount, activeContracts] =
    await Promise.all([
      prisma.event.findMany({
        where: { startAt: { gte: now } },
        orderBy: { startAt: "asc" },
        take: 8,
        include: { client: true },
      }),
      prisma.paymentMilestone.findMany({
        where: { ...paymentFilter, status: { not: "PAID" }, dueDate: { lt: now } },
        orderBy: { dueDate: "asc" },
        take: 10,
        include: { contract: { include: { client: true } } },
      }),
      prisma.paymentMilestone.findMany({
        where: { ...paymentFilter, status: { not: "PAID" }, dueDate: { gte: now, lte: horizon } },
        orderBy: { dueDate: "asc" },
        take: 10,
        include: { contract: { include: { client: true } } },
      }),
      prisma.client.count(),
      owner ? prisma.contract.count({ where: { status: "ACTIVE" } }) : Promise.resolve(0),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user.name}</h1>
        <p className="text-sm text-slate-500">Here’s what’s on your plate.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Clients" value={clientsCount} href="/clients" />
        {owner && <Stat label="Active contracts" value={activeContracts} href="/contracts" />}
        <Stat label="Overdue payments" value={overduePayments.length} tone="danger" />
        <Stat label="Upcoming events" value={upcomingEvents.length} href="/calendar" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Upcoming events</h2>
            <Link href="/calendar/new" className="text-sm text-brand-600 hover:underline">+ New</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No events scheduled.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {upcomingEvents.map((e) => (
                <li key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <Link href={`/calendar/${e.id}`} className="font-medium text-brand-700 hover:underline">
                      {e.title}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(e.startAt)}
                      {e.client ? ` · ${e.client.name}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-3">Overdue payments</h2>
          {overduePayments.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing overdue.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {overduePayments.map((p) => (
                <li key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <Link href={`/contracts/${p.contractId}`} className="font-medium text-brand-700 hover:underline">
                      {p.contract.title} · Stage {p.stage}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {p.contract.client.name} · due {formatDate(p.dueDate)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-red-700">
                    {formatMoney(p.amount)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Payments due in the next 30 days</h2>
          {upcomingPayments.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming payments.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {upcomingPayments.map((p) => (
                <li key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <Link href={`/contracts/${p.contractId}`} className="font-medium text-brand-700 hover:underline">
                      {p.contract.title} · Stage {p.stage} — {p.label}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {p.contract.client.name} · due {formatDate(p.dueDate)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatMoney(p.amount)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href?: string;
  tone?: "danger";
}) {
  const body = (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold ${tone === "danger" && value > 0 ? "text-red-600" : ""}`}>
        {value}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
