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
import { formatDateTime } from "@/lib/format";

type Props = { searchParams: Promise<{ month?: string }> };

function parseMonth(raw: string | undefined): Date {
  if (!raw) return new Date();
  const [y, m] = raw.split("-").map(Number);
  if (!y || !m) return new Date();
  return new Date(y, m - 1, 1);
}

export default async function CalendarPage({ searchParams }: Props) {
  await requireUser();
  const { month } = await searchParams;
  const cursor = parseMonth(month);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const events = await prisma.event.findMany({
    where: {
      startAt: { gte: gridStart, lte: gridEnd },
    },
    orderBy: { startAt: "asc" },
    include: { client: true },
  });

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

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(e.startAt, day));
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());
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
                  {dayEvents.slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/calendar/${e.id}`}
                        className="block truncate rounded bg-brand-100 px-1 py-0.5 text-brand-700 hover:bg-brand-500 hover:text-white"
                        title={`${e.title} — ${formatDateTime(e.startAt)}`}
                      >
                        {format(e.startAt, "h:mma")} {e.title}
                      </Link>
                    </li>
                  ))}
                  {dayEvents.length > 3 && (
                    <li className="text-[10px] text-slate-500">
                      +{dayEvents.length - 3} more
                    </li>
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
