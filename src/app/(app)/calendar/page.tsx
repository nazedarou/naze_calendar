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

type Props = { searchParams: Promise<{ month?: string }> };

function parseMonth(raw: string | undefined): Date {
  if (!raw) return new Date();
  const [y, m] = raw.split("-").map(Number);
  if (!y || !m) return new Date();
  return new Date(y, m - 1, 1);
}

// Visual status accounting for overdue = PENDING + past due.
type PaymentVisualStatus = "PAID" | "OVERDUE" | "PENDING";

const PAYMENT_STYLE: Record<PaymentVisualStatus, string> = {
  PAID: "bg-green-100 text-green-800 hover:bg-green-500 hover:text-white",
  OVERDUE: "bg-red-100 text-red-800 hover:bg-red-600 hover:text-white",
  PENDING: "bg-amber-100 text-amber-800 hover:bg-amber-500 hover:text-white",
};

export default async function CalendarPage({ searchParams }: Props) {
  await requireUser();
  const { month } = await searchParams;
  const cursor = parseMonth(month);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const [events, payments] = await Promise.all([
    prisma.event.findMany({
      where: { startAt: { gte: gridStart, lte: gridEnd } },
      orderBy: { startAt: "asc" },
      include: { client: true },
    }),
    prisma.paymentMilestone.findMany({
      where: { dueDate: { gte: gridStart, lte: gridEnd } },
      orderBy: { dueDate: "asc" },
      include: { contract: { include: { client: true } } },
    }),
  ]);

  const now = new Date();

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d);
  }

  const prev = format(subMonths(cursor, 1), "yyyy-MM");
  const next = format(addMonths(cursor, 1), "yyyy-MM");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-slate-500">{format(cursor, "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/calendar?month=${prev}`} className="btn-secondary">← Prev</Link>
          <Link href="/calendar" className="btn-secondary">Today</Link>
          <Link href={`/calendar?month=${next}`} className="btn-secondary">Next →</Link>
          <Link href="/calendar/new" className="btn-primary">+ New event</Link>
        </div>
      </div>

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
            const dayPayments = payments.filter((p) => isSameDay(p.dueDate, day));
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());

            type Item =
              | { kind: "event"; id: string; sort: number; node: React.ReactNode }
              | { kind: "payment"; id: string; sort: number; node: React.ReactNode };

            const items: Item[] = [
              ...dayEvents.map<Item>((e) => ({
                kind: "event",
                id: `e-${e.id}`,
                sort: e.startAt.getTime(),
                node: (
                  <Link
                    href={`/calendar/${e.id}`}
                    className="block truncate rounded bg-brand-100 px-1 py-0.5 text-brand-700 hover:bg-brand-500 hover:text-white"
                    title={`${e.title} — ${formatDateTime(e.startAt)}`}
                  >
                    {format(e.startAt, "h:mma")} {e.title}
                  </Link>
                ),
              })),
              ...dayPayments.map<Item>((p) => {
                const visual: PaymentVisualStatus =
                  p.status === "PAID"
                    ? "PAID"
                    : p.dueDate < now
                      ? "OVERDUE"
                      : "PENDING";
                const label = `${p.contract.client.name} · Stage ${p.stage}`;
                const title = `${p.contract.title} · Stage ${p.stage} ${p.label} — ${formatMoney(
                  p.amount,
                  p.contract.currency,
                )} due ${formatDate(p.dueDate)} (${visual})`;
                return {
                  kind: "payment",
                  id: `p-${p.id}`,
                  // Sort payments to end of day so timed events appear above.
                  sort: Number.MAX_SAFE_INTEGER - (4 - p.stage),
                  node: (
                    <Link
                      href={`/contracts/${p.contractId}`}
                      className={`block truncate rounded px-1 py-0.5 ${PAYMENT_STYLE[visual]}`}
                      title={title}
                    >
                      $ {label}
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
    </div>
  );
}
