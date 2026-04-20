import Link from "next/link";
import { addDays, format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { formatDate, formatMoney } from "@/lib/format";
import { autoPromoteClients } from "@/lib/auto-promote";

const CONTRACT_STATUS_STYLE: Record<string, string> = {
  DRAFT:     "bg-stone-100 text-stone-600",
  ACTIVE:    "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const owner = user.role === "OWNER";
  const now = new Date();
  await autoPromoteClients();
  const weekEnd = addDays(now, 7);

  const paymentFilter = owner
    ? {}
    : { contract: { assignments: { some: { userId: user.id } } } };

  const eventFilter = owner
    ? { startAt: { gte: now, lte: weekEnd } }
    : { startAt: { gte: now, lte: weekEnd }, assignments: { some: { userId: user.id } } };

  // Proposal reminders: PENDING + no proposal sent
  const proposalReminders = await prisma.client.findMany({
    where: {
      proposalSent: false,
      clientStatus: "PENDING",
      ...(owner ? {} : { assignedToId: user.id }),
    },
    include: {
      events: {
        where: { startAt: { lt: now } },
        orderBy: { startAt: "desc" },
        select: { id: true, startAt: true },
        take: 2,
      },
    },
  });

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
          include: { client: true, payments: { orderBy: { stage: "asc" } } },
        })
      : Promise.resolve(null),
  ]);

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
    <div className="space-y-0">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 pb-6 mb-8 border-b border-stone-300">
        <div>
          <div
            className="text-[10px] uppercase text-stone-400 mb-2 tabular-nums"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.22em" }}
          >
            {format(now, "EEEE, d MMMM yyyy").toUpperCase()}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-ink-900 leading-none">
            {user.name.split(" ")[0].toUpperCase()}
          </h1>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border border-stone-300 bg-white">
        <StatCell label="Clients" value={clientsCount} href="/clients" />
        {owner
          ? <StatCell label="Active" value={activeContractsCount} href="/contracts" border />
          : <StatCell label="Active" value={activeContractsCount} border />}
        <StatCell
          label="Overdue"
          value={overduePayments.length}
          tone={overduePayments.length > 0 ? "danger" : undefined}
          border
        />
        <StatCell label="This Week" value={weekEvents.length} href="/calendar" border />
      </div>

      {/* ── Revenue strip (owner only) ───────────────────────────── */}
      {owner && (
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-stone-300 border-t-0 bg-white mb-10">
          <RevenueCell label="Contracted" value={totalContracted} />
          <RevenueCell label="Collected" value={totalCollected} tone="ok" border />
          <RevenueCell
            label="Outstanding"
            value={totalOutstanding}
            tone={totalOutstanding > 0 ? "warn" : "ok"}
            border
          />
          <RevenueCell
            label="Gross Profit"
            value={grossProfit}
            tone={grossProfit >= 0 ? "ok" : "danger"}
            border
          />
        </div>
      )}

      {!owner && <div className="mb-10" />}

      {/* ── This week + Overdue + Proposal reminders ─────────────── */}
      <div className="grid lg:grid-cols-3 border border-stone-300 bg-white">

        {/* This week */}
        <section className="border-b lg:border-b-0 lg:border-r border-stone-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300">
            <h2
              className="text-[10px] uppercase text-stone-400"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
            >
              This Week
            </h2>
            <Link
              href="/calendar/new"
              className="text-[10px] uppercase text-stone-400 hover:text-ink-900 transition-colors"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
            >
              + Add
            </Link>
          </div>
          {weekEvents.length === 0 ? (
            <p
              className="px-5 py-5 text-sm text-stone-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              — No events in the next 7 days
            </p>
          ) : (
            <ul className="divide-y divide-stone-200">
              {weekEvents.map((e) => (
                <li key={e.id} className="px-5 py-3.5 flex items-start gap-4">
                  <div
                    className="shrink-0 text-[10px] uppercase text-stone-400 w-12 pt-0.5 tabular-nums"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {format(e.startAt, "MMM d").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/calendar/${e.id}`}
                      className="text-sm font-semibold text-ink-900 hover:text-stone-500 transition-colors block truncate"
                    >
                      {e.title}
                    </Link>
                    <div
                      className="text-[11px] text-stone-400 mt-0.5"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {format(e.startAt, "HH:mm")}
                      {e.client ? ` · ${e.client.name}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Overdue */}
        <section className="border-b lg:border-b-0 lg:border-r border-stone-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300">
            <h2
              className="text-[10px] uppercase text-stone-400"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
            >
              Overdue
            </h2>
            {overduePayments.length > 0 && (
              <span
                className="text-[10px] uppercase text-danger"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {overduePayments.length} unpaid
              </span>
            )}
          </div>
          {overduePayments.length === 0 ? (
            <p
              className="px-5 py-5 text-sm text-stone-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              — All clear
            </p>
          ) : (
            <ul className="divide-y divide-stone-200">
              {overduePayments.map((p) => {
                const days = p.dueDate
                  ? Math.floor((now.getTime() - new Date(p.dueDate).getTime()) / 86_400_000)
                  : 0;
                return (
                  <li key={p.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/contracts/${p.contractId}`}
                        className="text-sm font-semibold text-ink-900 hover:text-stone-500 transition-colors block truncate"
                      >
                        {p.contract.title}
                      </Link>
                      <div
                        className="text-[11px] text-stone-400 mt-0.5"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {p.contract.client.name} · Stage {p.stage}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-sm font-bold text-danger tabular-nums"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {formatMoney(p.amount)}
                      </div>
                      <div
                        className="text-[10px] text-stone-400 mt-0.5"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {days}d overdue
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Proposal Reminders */}
        <section>
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300">
            <h2
              className="text-[10px] uppercase text-stone-400"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
            >
              Proposal Reminders
            </h2>
            {proposalReminders.length > 0 && (
              <span
                className="text-[10px] uppercase text-warn"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {proposalReminders.length} pending
              </span>
            )}
          </div>
          {proposalReminders.length === 0 ? (
            <p
              className="px-5 py-5 text-sm text-stone-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              — All clear
            </p>
          ) : (
            <ul className="divide-y divide-stone-200">
              {proposalReminders.map((c) => {
                const secondEvent = c.events[0] ?? c.events[1];
                const days = Math.floor(
                  (now.getTime() - new Date(secondEvent.startAt).getTime()) / 86_400_000
                );
                return (
                  <li key={c.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/clients/${c.id}`}
                        className="text-sm font-semibold text-ink-900 hover:text-stone-500 transition-colors block truncate"
                      >
                        {c.name}
                      </Link>
                      <div
                        className="text-[11px] text-stone-400 mt-0.5"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        2nd meeting {format(secondEvent.startAt, "d MMM").toUpperCase()}
                      </div>
                    </div>
                    <div
                      className="text-[10px] text-warn shrink-0 tabular-nums pt-0.5"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {days}d ago
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ── Recent contracts (owner only) ───────────────────────── */}
      {owner && recentContracts && (
        <div className="border border-stone-300 border-t-0 bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300">
            <h2
              className="text-[10px] uppercase text-stone-400"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
            >
              Recent Projects
            </h2>
            <Link
              href="/contracts"
              className="text-[10px] uppercase text-stone-400 hover:text-ink-900 transition-colors"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
            >
              View all →
            </Link>
          </div>
          {recentContracts.length === 0 ? (
            <p
              className="px-5 py-5 text-sm text-stone-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              — No projects yet
            </p>
          ) : (
            <ul className="divide-y divide-stone-200">
              {recentContracts.map((c) => {
                const totalPaid = c.payments
                  .filter((p) => p.status === "PAID")
                  .reduce((acc, p) => acc + Number(p.amount), 0);
                const nextDue = c.payments.find((p) => p.status !== "PAID");
                const pct = Number(c.totalAmount) > 0
                  ? Math.min(100, Math.round((totalPaid / Number(c.totalAmount)) * 100))
                  : 0;

                return (
                  <li key={c.id} className="px-5 py-4 flex items-center gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <Link
                          href={`/contracts/${c.id}`}
                          className="font-bold text-sm text-ink-900 hover:text-stone-500 transition-colors"
                        >
                          {c.title}
                        </Link>
                        <span className={`badge ${CONTRACT_STATUS_STYLE[c.status] ?? "bg-stone-100 text-stone-600"}`}>
                          {c.status}
                        </span>
                      </div>
                      <div
                        className="text-[11px] text-stone-400 mb-2.5"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {c.client.name}
                        {nextDue
                          ? ` · next: Stage ${nextDue.stage}${nextDue.dueDate ? ` ${formatDate(nextDue.dueDate)}` : ""}`
                          : " · all paid"}
                      </div>
                      {/* Progress bar — sharp */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-stone-200">
                          <div
                            className={`h-1 transition-all ${
                              pct >= 80 ? "bg-ok" : pct >= 40 ? "bg-ink-900" : "bg-warn"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span
                          className="text-[10px] text-stone-400 shrink-0 tabular-nums"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <div
                        className="font-bold text-sm text-ink-900 tabular-nums"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {formatMoney(totalPaid)}
                      </div>
                      <div
                        className="text-[10px] text-stone-400"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        / {formatMoney(c.totalAmount)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  href,
  tone,
  border,
}: {
  label: string;
  value: number;
  href?: string;
  tone?: "danger";
  border?: boolean;
}) {
  const inner = (
    <div
      className={`p-5 ${border ? "border-l border-stone-300" : ""} ${
        href ? "hover:bg-stone-50 transition-colors cursor-pointer" : ""
      }`}
    >
      <div
        className="text-[9px] uppercase text-stone-400 mb-2"
        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
      >
        {label}
      </div>
      <div
        className={`text-4xl font-extrabold leading-none tabular-nums ${
          tone === "danger" && value > 0 ? "text-danger" : "text-ink-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

function RevenueCell({
  label,
  value,
  tone,
  border,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "danger";
  border?: boolean;
}) {
  return (
    <div className={`p-5 ${border ? "border-l border-stone-300" : ""}`}>
      <div
        className="text-[9px] uppercase text-stone-400 mb-2"
        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
      >
        {label}
      </div>
      <div
        className={`text-xl font-bold leading-none tabular-nums ${
          tone === "ok"
            ? "text-ok"
            : tone === "warn"
            ? "text-warn"
            : tone === "danger"
            ? "text-danger"
            : "text-ink-900"
        }`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {formatMoney(value)}
      </div>
    </div>
  );
}
