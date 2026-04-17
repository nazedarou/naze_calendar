import Link from "next/link";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

type Props = {
  searchParams: Promise<{ month?: string; view?: string }>;
};

function parseMonth(raw: string | undefined): Date {
  if (!raw) return new Date();
  const [y, m] = raw.split("-").map(Number);
  if (!y || !m) return new Date();
  return new Date(y, m - 1, 1);
}

type PaymentVisualStatus = "PAID" | "OVERDUE" | "PENDING";

const PAYMENT_STYLE: Record<PaymentVisualStatus, string> = {
  PAID: "bg-green-100 text-green-800 hover:bg-green-500 hover:text-white",
  OVERDUE: "bg-red-100 text-red-800 hover:bg-red-600 hover:text-white",
  PENDING: "bg-amber-100 text-amber-800 hover:bg-amber-500 hover:text-white",
};

const CONTRACT_STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function CalendarPage({ searchParams }: Props) {
  await requireUser();
  const { month, view } = await searchParams;
  const activeView = view === "employees" ? "employees" : "month";
  const cursor = parseMonth(month);
  const monthParam = format(cursor, "yyyy-MM");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-slate-500">{format(cursor, "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/calendar?view=${activeView}&month=${format(subMonths(cursor, 1), "yyyy-MM")}`} className="btn-secondary">← Prev</Link>
          <Link href={`/calendar?view=${activeView}`} className="btn-secondary">Today</Link>
          <Link href={`/calendar?view=${activeView}&month=${format(addMonths(cursor, 1), "yyyy-MM")}`} className="btn-secondary">Next →</Link>
          <Link href="/calendar/new" className="btn-primary">+ New event</Link>
        </div>
      </div>

      <div className="mb-5 border-b border-slate-200">
        <nav className="-mb-px flex gap-6 text-sm">
          <TabLink
            active={activeView === "month"}
            href={`/calendar?view=month&month=${monthParam}`}
            label="Month"
          />
          <TabLink
            active={activeView === "employees"}
            href={`/calendar?view=employees&month=${monthParam}`}
            label="By employee"
          />
        </nav>
      </div>

      {activeView === "month" ? (
        <MonthView cursor={cursor} />
      ) : (
        <EmployeesView cursor={cursor} />
      )}
    </div>
  );
}

function TabLink({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`border-b-2 px-1 pb-3 font-medium ${
        active
          ? "border-brand-500 text-brand-700"
          : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
      }`}
    >
      {label}
    </Link>
  );
}

async function MonthView({ cursor }: { cursor: Date }) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const [events, payments] = await Promise.all([
    prisma.event.findMany({
      where: { startAt: { gte: gridStart, lte: gridEnd } },
      orderBy: { startAt: "asc" },
      include: {
        client: true,
        assignments: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.paymentMilestone.findMany({
      where: { dueDate: { gte: gridStart, lte: gridEnd } },
      orderBy: { dueDate: "asc" },
      include: { contract: { include: { client: true } } },
    }),
  ]);

  const now = new Date();
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-500" /> Event
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" /> Payment · Paid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" /> Payment · Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" /> Payment · Overdue
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(e.startAt, day));
            const dayPayments = payments.filter((p) => p.dueDate && isSameDay(p.dueDate, day));
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());

            type Item = { id: string; sort: number; node: React.ReactNode };
            const items: Item[] = [
              ...dayEvents.map<Item>((e) => {
                const assignees = e.assignments.map((a) => a.user);
                const assigneeNames = assignees.map((u) => u.name).join(", ");
                return {
                  id: `e-${e.id}`,
                  sort: e.startAt.getTime(),
                  node: (
                    <Link
                      href={`/calendar/${e.id}`}
                      className="group block rounded bg-brand-100 px-1 py-0.5 text-brand-700 hover:bg-brand-500 hover:text-white"
                      title={`${e.title} — ${formatDateTime(e.startAt)}${assigneeNames ? ` · ${assigneeNames}` : ""}`}
                    >
                      <div className="truncate">{format(e.startAt, "h:mma")} {e.title}</div>
                      {assignees.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-0.5">
                          {assignees.map((u) => (
                            <span
                              key={u.id}
                              className="rounded bg-brand-200 px-0.5 text-[9px] font-semibold leading-tight group-hover:bg-brand-600 group-hover:text-white"
                            >
                              {u.name.slice(0, 3).toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ),
                };
              }),
              ...dayPayments.map<Item>((p) => {
                const visual: PaymentVisualStatus =
                  p.status === "PAID"
                    ? "PAID"
                    : p.dueDate && p.dueDate < now
                      ? "OVERDUE"
                      : "PENDING";
                return {
                  id: `p-${p.id}`,
                  sort: Number.MAX_SAFE_INTEGER - (5 - p.stage),
                  node: (
                    <Link
                      href={`/contracts/${p.contractId}`}
                      className={`block truncate rounded px-1 py-0.5 ${PAYMENT_STYLE[visual]}`}
                      title={`${p.contract.title} · Stage ${p.stage} ${p.label} — ${formatMoney(p.amount)} due ${formatDate(p.dueDate)} (${visual})`}
                    >
                      $ {p.contract.client.name} · Stage {p.stage}
                    </Link>
                  ),
                };
              }),
            ].sort((a, b) => a.sort - b.sort);

            const MAX = 4;
            const shown = items.slice(0, MAX);
            const extra = items.length - shown.length;

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[110px] border-t border-l border-slate-200 p-1.5 text-xs ${
                  inMonth ? "bg-white" : "bg-slate-50 text-slate-400"
                }`}
              >
                <div className={`mb-1 flex justify-between ${isToday ? "font-semibold text-brand-700" : ""}`}>
                  <span>{format(day, "d")}</span>
                </div>
                <ul className="space-y-1">
                  {shown.map((item) => (
                    <li key={item.id}>{item.node}</li>
                  ))}
                  {extra > 0 && (
                    <li className="text-[10px] text-slate-500">+{extra} more</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

async function EmployeesView({ cursor }: { cursor: Date }) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  const employees = await prisma.user.findMany({
    where: { active: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      eventAssignments: {
        where: {
          event: {
            startAt: { gte: monthStart, lte: monthEnd },
          },
        },
        include: {
          event: {
            include: { client: true, contract: true },
          },
        },
      },
      contractAssignments: {
        where: {
          contract: {
            status: { in: ["DRAFT", "ACTIVE"] },
          },
        },
        include: {
          contract: {
            include: {
              client: true,
              payments: {
                orderBy: { stage: "asc" },
              },
            },
          },
        },
      },
    },
  });

  const now = new Date();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Events assigned in {format(cursor, "MMMM yyyy")} and all active/draft contracts assigned.
      </p>

      {employees.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">No employees yet.</div>
      ) : (
        employees.map((emp) => {
          const events = emp.eventAssignments
            .map((a) => a.event)
            .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
          const contracts = emp.contractAssignments.map((a) => a.contract);

          return (
            <section key={emp.id} className="card p-5">
              <header className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold">
                    {emp.name}{" "}
                    <span className="badge bg-brand-100 text-brand-700 ml-2">{emp.role}</span>
                  </h2>
                  <p className="text-xs text-slate-500">{emp.email}</p>
                </div>
                <div className="text-xs text-slate-500">
                  {events.length} event{events.length === 1 ? "" : "s"} ·{" "}
                  {contracts.length} contract{contracts.length === 1 ? "" : "s"}
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                    Events this month
                  </h3>
                  {events.length === 0 ? (
                    <p className="text-sm text-slate-500">No assigned events.</p>
                  ) : (
                    <ul className="divide-y divide-slate-200 text-sm">
                      {events.map((e) => (
                        <li key={e.id} className="py-2">
                          <Link
                            href={`/calendar/${e.id}`}
                            className="font-medium text-brand-700 hover:underline"
                          >
                            {e.title}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {formatDateTime(e.startAt)}
                            {e.client ? ` · ${e.client.name}` : ""}
                            {e.contract ? ` · ${e.contract.title}` : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                    Active contracts
                  </h3>
                  {contracts.length === 0 ? (
                    <p className="text-sm text-slate-500">No assigned contracts.</p>
                  ) : (
                    <ul className="divide-y divide-slate-200 text-sm">
                      {contracts.map((c) => {
                        const nextDue = c.payments.find((p) => p.status !== "PAID");
                        const overdue =
                          nextDue && nextDue.dueDate && nextDue.dueDate < now ? "OVERDUE" : nextDue?.status;
                        return (
                          <li key={c.id} className="py-2 flex items-start justify-between gap-3">
                            <div>
                              <Link
                                href={`/contracts/${c.id}`}
                                className="font-medium text-brand-700 hover:underline"
                              >
                                {c.title}
                              </Link>
                              <div className="text-xs text-slate-500">
                                {c.client.name} ·{" "}
                                {formatMoney(c.totalAmount)}
                                {nextDue
                                  ? ` · next: Stage ${nextDue.stage} ${formatDate(nextDue.dueDate)}`
                                  : " · all paid"}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`badge ${
                                  CONTRACT_STATUS_STYLE[c.status] ?? "bg-slate-100"
                                }`}
                              >
                                {c.status}
                              </span>
                              {overdue === "OVERDUE" && (
                                <span className="badge bg-red-100 text-red-700">OVERDUE</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
