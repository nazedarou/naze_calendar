import Link from "next/link";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

const CONTRACT_STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const owner = user.role === "OWNER";
  const now = new Date();
  const weekEnd = addDays(now, 7);

  const paymentFilter = owner
    ? {}
    : { contract: { assignments: { some: { userId: user.id } } } };

  const eventFilter = owner
    ? { startAt: { gte: now, lte: weekEnd } }
    : {
        startAt: { gte: now, lte: weekEnd },
        assignments: { some: { userId: user.id } },
      };

  const [
    weekEvents,
    overduePayments,
    clientsCount,
    activeContractsCount,
    revenueData,
    allCosts,
    recentContracts,
  ] = await Promise.all([
    prisma.event.findMany({
      where: eventFilter,
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
    prisma.client.count(),
    owner ? prisma.contract.count({ where: { status: "ACTIVE" } }) : Promise.resolve(0),
    owner
      ? prisma.paymentMilestone.findMany({
          where: { contract: { status: { in: ["ACTIVE", "DRAFT"] } } },
          select: { amount: true, status: true },
        })
      : Promise.resolve(null),
    owner
      ? prisma.projectCost.findMany({
          where: { contract: { status: { in: ["ACTIVE", "DRAFT"] } } },
          select: { amount: true },
        })
      : Promise.resolve(null),
    owner
      ? prisma.contract.findMany({
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: {
            client: true,
            payments: { orderBy: { stage: "asc" } },
          },
        })
      : Promise.resolve(null),
  ]);

  // Revenue calculations
  let totalContracted = 0;
  let totalCollected = 0;
  if (revenueData) {
    for (const p of revenueData) {
      totalContracted += Number(p.amount);
      if (p.status === "PAID") totalCollected += Number(p.amount);
    }
  }
  const totalOutstanding = totalContracted - totalCollected;
  const totalCosts = allCosts ? allCosts.reduce((acc, c) => acc + Number(c.amount), 0) : 0;
  const grossProfit = totalCollected - totalCosts;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user.name}</h1>
        <p className="text-sm text-slate-500">Here's what's on your plate.</p>
      </div>

      {/* Stat strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clients" value={clientsCount} href="/clients" />
        {owner && <Stat label="Active contracts" value={activeContractsCount} href="/contracts" />}
        <Stat label="Overdue payments" value={overduePayments.length} tone="danger" />
        <Stat label="Events this week" value={weekEvents.length} href="/calendar" />
      </div>

      {/* Revenue summary — owner only */}
      {owner && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RevenueStat label="Total contracted" value={totalContracted} />
          <RevenueStat label="Collected" value={totalCollected} tone="positive" />
          <RevenueStat label="Outstanding" value={totalOutstanding} tone={totalOutstanding > 0 ? "warn" : "positive"} />
          <RevenueStat label="Gross profit" value={grossProfit} tone={grossProfit >= 0 ? "positive" : "danger"} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* This week's schedule */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">This week</h2>
            <Link href="/calendar/new" className="text-sm text-brand-600 hover:underline">+ New</Link>
          </div>
          {weekEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No events in the next 7 days.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {weekEvents.map((e) => (
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

        {/* Overdue payments */}
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

        {/* Recently active contracts — owner only */}
        {owner && recentContracts && (
          <section className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recently active contracts</h2>
              <Link href="/contracts" className="text-sm text-brand-600 hover:underline">View all</Link>
            </div>
            {recentContracts.length === 0 ? (
              <p className="text-sm text-slate-500">No contracts yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {recentContracts.map((c) => {
                  const totalPaid = c.payments
                    .filter((p) => p.status === "PAID")
                    .reduce((acc, p) => acc + Number(p.amount), 0);
                  const nextDue = c.payments.find((p) => p.status !== "PAID");
                  const pct = Number(c.totalAmount) > 0
                    ? Math.round((totalPaid / Number(c.totalAmount)) * 100)
                    : 0;

                  return (
                    <li key={c.id} className="py-3 flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/contracts/${c.id}`} className="font-medium text-brand-700 hover:underline">
                            {c.title}
                          </Link>
                          <span className={`badge ${CONTRACT_STATUS_STYLE[c.status] ?? "bg-slate-100"}`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {c.client.name} · {formatMoney(c.totalAmount)}
                          {nextDue
                            ? ` · next: Stage ${nextDue.stage} ${nextDue.dueDate ? formatDate(nextDue.dueDate) : "(not yet due)"}`
                            : " · all paid"}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full bg-brand-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 tabular-nums shrink-0">{pct}% collected</span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-slate-700 shrink-0">
                        {formatMoney(totalPaid)}
                        <span className="text-xs font-normal text-slate-400"> / {formatMoney(c.totalAmount)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, href, tone }: { label: string; value: number; href?: string; tone?: "danger" }) {
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

function RevenueStat({ label, value, tone }: { label: string; value: number; tone?: "positive" | "warn" | "danger" }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold ${
        tone === "positive" ? "text-green-700" : tone === "warn" ? "text-amber-700" : tone === "danger" ? "text-red-600" : ""
      }`}>
        {formatMoney(value)}
      </div>
    </div>
  );
}
