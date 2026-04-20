import Link from "next/link";
import { notFound } from "next/navigation";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; contracts?: string }>;
};

const CONTRACT_STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-warm-100 text-warm-600",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-700",
};

function parseMonth(raw: string | undefined): Date {
  if (!raw) return new Date();
  const [y, m] = raw.split("-").map(Number);
  if (!y || !m) return new Date();
  return new Date(y, m - 1, 1);
}

type ContractsFilter = "active" | "all" | "completed";

export default async function EmployeeCalendarPage({ params, searchParams }: Props) {
  await requireOwner();
  const { id } = await params;
  const { month, contracts: contractsParam } = await searchParams;

  const cursor = parseMonth(month);
  const monthParam = format(cursor, "yyyy-MM");
  const contractsFilter: ContractsFilter =
    contractsParam === "all" ? "all" : contractsParam === "completed" ? "completed" : "active";

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  const emp = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
      active: true,
      eventAssignments: {
        where: { event: { startAt: { gte: monthStart, lte: monthEnd } } },
        include: { event: { include: { client: true, contract: true } } },
        orderBy: { event: { startAt: "asc" } },
      },
      contractAssignments: {
        include: {
          contract: {
            include: {
              client: true,
              payments: { orderBy: { stage: "asc" } },
            },
          },
        },
        orderBy: { contract: { startDate: "desc" } },
      },
    },
  });

  if (!emp) notFound();

  const now = new Date();
  const events = emp.eventAssignments.map((a) => a.event);
  const allContracts = emp.contractAssignments.map((a) => a.contract);
  const contracts = allContracts.filter((c) =>
    contractsFilter === "active"
      ? c.status === "DRAFT" || c.status === "ACTIVE"
      : contractsFilter === "completed"
        ? c.status === "COMPLETED" || c.status === "CANCELLED"
        : true
  );
  const backUrl = `/calendar?view=employees&month=${monthParam}`;

  return (
    <div className="space-y-8">
      <div>
        <Link href={backUrl} className="text-sm text-brand-600 hover:underline">
          ← Back to By employee
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{emp.name}</h1>
        <p className="text-sm text-warm-500">{emp.role}</p>
      </div>

      {/* Events section */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">
            Events — {format(cursor, "MMMM yyyy")}
            <span className="ml-2 text-sm font-normal text-warm-500">({events.length})</span>
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/calendar/employees/${id}?month=${format(subMonths(cursor, 1), "yyyy-MM")}&contracts=${contractsFilter}`}
              className="btn-secondary"
            >
              ← Prev
            </Link>
            <Link
              href={`/calendar/employees/${id}?contracts=${contractsFilter}`}
              className="btn-secondary"
            >
              Today
            </Link>
            <Link
              href={`/calendar/employees/${id}?month=${format(addMonths(cursor, 1), "yyyy-MM")}&contracts=${contractsFilter}`}
              className="btn-secondary"
            >
              Next →
            </Link>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-warm-500">No events assigned in {format(cursor, "MMMM yyyy")}.</p>
        ) : (
          <ul className="divide-y divide-warm-100 text-sm">
            {events.map((e) => (
              <li key={e.id} className="py-3">
                <Link href={`/calendar/${e.id}`} className="font-medium text-brand-700 hover:underline">
                  {e.title}
                </Link>
                <div className="text-xs text-warm-500 mt-0.5">
                  {formatDateTime(e.startAt)}
                  {e.location ? ` · ${e.location}` : ""}
                  {e.client ? ` · ${e.client.name}` : ""}
                  {e.contract ? ` · ${e.contract.title}` : ""}
                </div>
                {e.description && (
                  <p className="text-xs text-warm-500 mt-1 line-clamp-2">{e.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Contracts section */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">
            Projects
            <span className="ml-2 text-sm font-normal text-warm-500">({contracts.length})</span>
          </h2>
          <div className="flex items-center gap-1 text-sm border border-brand-200 rounded-lg overflow-hidden">
            {(
              [
                { key: "active", label: "Active" },
                { key: "all", label: "All" },
                { key: "completed", label: "Completed" },
              ] as { key: ContractsFilter; label: string }[]
            ).map(({ key, label }) => (
              <Link
                key={key}
                href={`/calendar/employees/${id}?month=${monthParam}&contracts=${key}`}
                className={`px-3 py-1.5 transition-colors ${
                  contractsFilter === key
                    ? "bg-brand-600 text-white"
                    : "text-warm-500 hover:bg-brand-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {contracts.length === 0 ? (
          <p className="text-sm text-warm-500">
            No {contractsFilter === "all" ? "" : contractsFilter + " "}projects assigned.
          </p>
        ) : (
          <ul className="divide-y divide-warm-100 text-sm">
            {contracts.map((c) => {
              const nextDue = c.payments.find((p) => p.status !== "PAID");
              const overdue =
                nextDue && nextDue.dueDate && nextDue.dueDate < now ? "OVERDUE" : null;
              const totalPaid = c.payments
                .filter((p) => p.status === "PAID")
                .reduce((acc, p) => acc + Number(p.amount), 0);

              return (
                <li key={c.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/contracts/${c.id}`} className="font-medium text-brand-700 hover:underline">
                      {c.title}
                    </Link>
                    <div className="text-xs text-warm-500 mt-0.5">
                      {c.client.name} · {formatMoney(c.totalAmount)} total · {formatMoney(totalPaid)} collected
                    </div>
                    {nextDue && (
                      <div className="text-xs text-warm-500 mt-0.5">
                        Next: Stage {nextDue.stage} — {nextDue.label}
                        {nextDue.dueDate ? ` due ${formatDate(nextDue.dueDate)}` : " (not yet due)"}
                        {" · "}{formatMoney(nextDue.amount)}
                      </div>
                    )}
                    {!nextDue && <div className="text-xs text-green-600 mt-0.5">All payments collected</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`badge ${CONTRACT_STATUS_STYLE[c.status] ?? "bg-warm-50"}`}>
                      {c.status}
                    </span>
                    {overdue && (
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
  );
}
