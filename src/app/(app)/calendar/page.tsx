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
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Singapore";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

type Props = {
  searchParams: Promise<{ month?: string; view?: string; q?: string }>;
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
  DRAFT: "bg-warm-100 text-warm-600",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function CalendarPage({ searchParams }: Props) {
  const user = await requireUser();
  const isOwner = user.role === "OWNER";
  const { month, view, q } = await searchParams;
  const activeView = isOwner && view === "employees" ? "employees" : "month";
  const cursor = parseMonth(month);
  const monthParam = format(cursor, "yyyy-MM");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-warm-500">{format(cursor, "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/calendar?view=${activeView}&month=${format(subMonths(cursor, 1), "yyyy-MM")}`} className="btn-secondary">← Prev</Link>
          <Link href={`/calendar?view=${activeView}`} className="btn-secondary">Today</Link>
          <Link href={`/calendar?view=${activeView}&month=${format(addMonths(cursor, 1), "yyyy-MM")}`} className="btn-secondary">Next →</Link>
          <Link href="/calendar/new" className="btn-primary">+ New event</Link>
        </div>
      </div>

      <div className="mb-5 border-b border-warm-100">
        <nav className="-mb-px flex gap-6 text-sm">
          <TabLink
            active={activeView === "month"}
            href={`/calendar?view=month&month=${monthParam}`}
            label="Month"
          />
          {isOwner && (
            <TabLink
              active={activeView === "employees"}
              href={`/calendar?view=employees&month=${monthParam}`}
              label="By employee"
            />
          )}
        </nav>
      </div>

      {activeView === "month" ? (
        <MonthView cursor={cursor} />
      ) : (
        <EmployeesView cursor={cursor} monthParam={monthParam} q={q} />
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
          : "border-transparent text-warm-500 hover:border-warm-300 hover:text-warm-600"
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

  // Build per-day item lists (shared by both views)
  type Item = { id: string; sort: number; node: React.ReactNode; mobileNode: React.ReactNode };

  const itemsByDay = new Map<string, Item[]>();
  for (const day of days) {
    const key = day.toISOString();
    const dayEvents = events.filter((e) => isSameDay(e.startAt, day));
    const dayPayments = payments.filter((p) => p.dueDate && isSameDay(p.dueDate, day));

    const items: Item[] = [
      ...dayEvents.map<Item>((e) => {
        const assignees = e.assignments.map((a) => a.user);
        const assigneeNames = assignees.map((u) => u.name).join(", ");
        const timeStr = formatInTimeZone(e.startAt, TZ, "h:mma");
        return {
          id: `e-${e.id}`,
          sort: e.startAt.getTime(),
          node: (
            <Link
              href={`/calendar/${e.id}`}
              className="group block rounded bg-brand-100 px-1 py-0.5 text-brand-700 hover:bg-brand-500 hover:text-white"
              title={`${e.title} — ${formatDateTime(e.startAt)}${assigneeNames ? ` · ${assigneeNames}` : ""}`}
            >
              <div className="truncate">{timeStr} {e.title}</div>
              {assignees.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-0.5">
                  {assignees.map((u) => (
                    <span key={u.id} className="rounded bg-brand-200 px-0.5 text-[9px] font-semibold leading-tight group-hover:bg-brand-600 group-hover:text-white">
                      {u.name.slice(0, 3).toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ),
          mobileNode: (
            <Link href={`/calendar/${e.id}`} className="flex items-start gap-3 py-3 border-b border-warm-50 last:border-0">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-brand-500 mt-1.5" />
              <div className="min-w-0">
                <div className="font-medium text-warm-900 truncate">{e.title}</div>
                <div className="text-xs text-warm-500 mt-0.5">
                  {timeStr}{e.client ? ` · ${e.client.name}` : ""}{assigneeNames ? ` · ${assigneeNames}` : ""}
                </div>
              </div>
            </Link>
          ),
        };
      }),
      ...dayPayments.map<Item>((p) => {
        const visual: PaymentVisualStatus =
          p.status === "PAID" ? "PAID" : p.dueDate && p.dueDate < now ? "OVERDUE" : "PENDING";
        const paymentColorDot = visual === "PAID" ? "bg-green-500" : visual === "OVERDUE" ? "bg-red-500" : "bg-amber-500";
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
          mobileNode: (
            <Link href={`/contracts/${p.contractId}`} className="flex items-start gap-3 py-3 border-b border-warm-50 last:border-0">
              <div className={`shrink-0 h-2 w-2 rounded-full mt-1.5 ${paymentColorDot}`} />
              <div className="min-w-0">
                <div className="font-medium text-warm-900 truncate">
                  {p.contract.client.name} · Stage {p.stage} {p.label}
                </div>
                <div className="text-xs text-warm-500 mt-0.5">
                  {formatMoney(p.amount)} · {p.contract.title}
                  <span className={`ml-2 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    visual === "PAID" ? "bg-green-100 text-green-800" : visual === "OVERDUE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                  }`}>{visual}</span>
                </div>
              </div>
            </Link>
          ),
        };
      }),
    ].sort((a, b) => a.sort - b.sort);

    itemsByDay.set(key, items);
  }

  // Days in current month that have at least one item (for agenda view)
  const agendaDays = days.filter(
    (d) => isSameMonth(d, cursor) && (itemsByDay.get(d.toISOString())?.length ?? 0) > 0
  );

  return (
    <>
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-warm-500">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-500" /> Event</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" /> Payment · Paid</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" /> Payment · Pending</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" /> Payment · Overdue</span>
      </div>

      {/* Agenda view — mobile only */}
      <div className="md:hidden card divide-y divide-warm-50 overflow-hidden">
        {agendaDays.length === 0 ? (
          <p className="p-6 text-sm text-warm-500">No events or payments this month.</p>
        ) : (
          agendaDays.map((day) => {
            const items = itemsByDay.get(day.toISOString()) ?? [];
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className="px-4 py-3">
                <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isToday ? "text-brand-600" : "text-warm-400"}`}>
                  {formatInTimeZone(day, TZ, "EEE, MMM d")}
                  {isToday && <span className="ml-2 text-[10px] bg-brand-600 text-white rounded-full px-1.5 py-0.5">Today</span>}
                </div>
                {items.map((item) => (
                  <div key={item.id}>{item.mobileNode}</div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Grid view — desktop only */}
      <div className="hidden md:block card overflow-hidden">
        <div className="grid grid-cols-7 bg-warm-50 text-xs uppercase tracking-wide text-warm-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const items = itemsByDay.get(day.toISOString()) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());
            const MAX = 4;
            const shown = items.slice(0, MAX);
            const extra = items.length - shown.length;
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[110px] border-t border-l border-warm-100 p-1.5 text-xs ${
                  inMonth ? "bg-white" : "bg-warm-50 text-warm-400"
                }`}
              >
                <div className={`mb-1 ${isToday ? "font-semibold text-brand-700" : ""}`}>
                  {format(day, "d")}
                </div>
                <ul className="space-y-1">
                  {shown.map((item) => (
                    <li key={item.id}>{item.node}</li>
                  ))}
                  {extra > 0 && (
                    <li className="text-[10px] text-warm-500">+{extra} more</li>
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

const MAX_PREVIEW = 3;

async function EmployeesView({
  cursor,
  monthParam,
  q,
}: {
  cursor: Date;
  monthParam: string;
  q?: string;
}) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const search = q?.trim().toLowerCase() ?? "";

  const employees = await prisma.user.findMany({
    where: { active: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      role: true,
      eventAssignments: {
        where: { event: { startAt: { gte: monthStart, lte: monthEnd } } },
        include: { event: { include: { client: true, contract: true } } },
      },
      contractAssignments: {
        where: { contract: { status: { in: ["DRAFT", "ACTIVE"] } } },
        include: {
          contract: {
            include: { client: true, payments: { orderBy: { stage: "asc" } } },
          },
        },
      },
    },
  });

  const filtered = search
    ? employees.filter((e) => e.name.toLowerCase().includes(search))
    : employees;

  const now = new Date();

  return (
    <div className="space-y-4">
      <form method="get" action="/calendar" className="flex items-center gap-2">
        <input type="hidden" name="view" value="employees" />
        <input type="hidden" name="month" value={monthParam} />
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search staff…"
            className="input pl-9 text-sm"
          />
        </div>
        {q && (
          <Link href={`/calendar?view=employees&month=${monthParam}`} className="text-sm text-warm-500 hover:text-warm-600 underline">
            Clear
          </Link>
        )}
      </form>

      {filtered.length === 0 ? (
        <div className="card p-6 text-sm text-warm-500">
          {search ? `No staff matching "${q}".` : "No employees yet."}
        </div>
      ) : (
        filtered.map((emp) => {
          const events = emp.eventAssignments
            .map((a) => a.event)
            .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
          const contracts = emp.contractAssignments.map((a) => a.contract);
          const extraEvents = events.length - MAX_PREVIEW;
          const extraContracts = contracts.length - MAX_PREVIEW;

          return (
            <section key={emp.id} className="card p-5">
              <header className="flex items-center justify-between mb-4">
                <div>
                  <Link
                    href={`/calendar/employees/${emp.id}?month=${monthParam}`}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    {emp.name}
                  </Link>{" "}
                  <span className="badge bg-brand-100 text-brand-700 ml-1">{emp.role}</span>
                </div>
                <div className="text-xs text-warm-500">
                  {events.length} event{events.length === 1 ? "" : "s"} ·{" "}
                  {contracts.length} contract{contracts.length === 1 ? "" : "s"}
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-warm-500 mb-2">
                    Events this month
                  </h3>
                  {events.length === 0 ? (
                    <p className="text-sm text-warm-500">No assigned events.</p>
                  ) : (
                    <>
                      <ul className="divide-y divide-warm-100 text-sm">
                        {events.slice(0, MAX_PREVIEW).map((e) => (
                          <li key={e.id} className="py-2">
                            <Link href={`/calendar/${e.id}`} className="font-medium text-brand-700 hover:underline">
                              {e.title}
                            </Link>
                            <div className="text-xs text-warm-500">
                              {formatDateTime(e.startAt)}
                              {e.client ? ` · ${e.client.name}` : ""}
                            </div>
                          </li>
                        ))}
                      </ul>
                      {extraEvents > 0 && (
                        <Link
                          href={`/calendar/employees/${emp.id}?month=${monthParam}`}
                          className="mt-1 block text-xs text-brand-600 hover:underline"
                        >
                          +{extraEvents} more — view all
                        </Link>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wide text-warm-500 mb-2">
                    Active projects
                  </h3>
                  {contracts.length === 0 ? (
                    <p className="text-sm text-warm-500">No assigned projects.</p>
                  ) : (
                    <>
                      <ul className="divide-y divide-warm-100 text-sm">
                        {contracts.slice(0, MAX_PREVIEW).map((c) => {
                          const nextDue = c.payments.find((p) => p.status !== "PAID");
                          const overdue =
                            nextDue && nextDue.dueDate && nextDue.dueDate < now
                              ? "OVERDUE"
                              : nextDue?.status;
                          return (
                            <li key={c.id} className="py-2 flex items-start justify-between gap-3">
                              <div>
                                <Link href={`/contracts/${c.id}`} className="font-medium text-brand-700 hover:underline">
                                  {c.title}
                                </Link>
                                <div className="text-xs text-warm-500">
                                  {c.client.name} · {formatMoney(c.totalAmount)}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`badge ${CONTRACT_STATUS_STYLE[c.status] ?? "bg-warm-50"}`}>
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
                      {extraContracts > 0 && (
                        <Link
                          href={`/calendar/employees/${emp.id}?month=${monthParam}&contracts=all`}
                          className="mt-1 block text-xs text-brand-600 hover:underline"
                        >
                          +{extraContracts} more — view all
                        </Link>
                      )}
                    </>
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
