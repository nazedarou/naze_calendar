import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isOwner, requireUser } from "@/lib/permissions";
import { formatDate, formatMoney } from "@/lib/format";

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
};

type StatusFilter = "ongoing" | "completed" | "all";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-warm-100 text-warm-600",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Underway",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function ContractsPage({ searchParams }: Props) {
  const user = await requireUser();
  const owner = isOwner(user);
  const { q, page: pageParam, status: statusParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const statusFilter: StatusFilter =
    statusParam === "ongoing" ? "ongoing" : statusParam === "completed" ? "completed" : "all";

  const where: Prisma.ContractWhereInput = {
    ...(owner ? {} : { assignments: { some: { userId: user.id } } }),
    ...(statusFilter === "ongoing"
      ? { status: { in: ["DRAFT", "ACTIVE"] } }
      : statusFilter === "completed"
        ? { status: { in: ["COMPLETED", "CANCELLED"] } }
        : {}),
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { client: { name: { contains: query, mode: "insensitive" } } },
      ],
    }),
  };

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      orderBy: { startDate: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        client: true,
        payments: { orderBy: { stage: "asc" } },
      },
    }),
    prisma.contract.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const buildUrl = (overrides: Record<string, string>) =>
    `?${new URLSearchParams({ ...(query && { q: query }), status: statusFilter, page: "1", ...overrides })}`;
  const params = (p: number) => buildUrl({ page: String(p) });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-warm-500">All projects and their payment progress</p>
        </div>
        {owner && <Link href="/contracts/new" className="btn-primary">+ New project</Link>}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <form method="GET" className="flex-1 min-w-48 max-w-sm">
          <input type="hidden" name="status" value={statusFilter} />
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by address or client…"
            className="input"
            autoComplete="off"
          />
        </form>
        <div className="flex items-center gap-1 border border-brand-200 rounded-lg overflow-hidden text-sm">
          {(
            [
              { key: "ongoing", label: "Ongoing" },
              { key: "all",     label: "All" },
              { key: "completed", label: "Completed" },
            ] as { key: StatusFilter; label: string }[]
          ).map(({ key, label }) => (
            <Link
              key={key}
              href={buildUrl({ status: key })}
              className={`px-3 py-1.5 transition-colors ${
                statusFilter === key
                  ? "bg-brand-600 text-white"
                  : "text-warm-500 hover:bg-brand-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div className="card p-8 text-center text-warm-500">
          {query
            ? `No projects matching "${query}".`
            : <>No projects yet. <Link href="/contracts/new" className="text-brand-600 underline">Create one</Link>.</>}
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-warm-500">
            {query ? `${total} result${total !== 1 ? "s" : ""} for "${query}" · ` : ""}
            Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
          </p>

          <div className="space-y-3">
            {contracts.map((c) => {
              const paid = c.payments.filter((p) => p.status === "PAID").length;
              return (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="card p-4 flex items-center justify-between hover:bg-warm-50"
                >
                  <div>
                    <div className="font-medium text-brand-700">{c.title}</div>
                    <div className="text-sm text-warm-500">
                      {c.client.name} · {formatDate(c.startDate)} · {formatMoney(c.totalAmount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-warm-500">{paid} / 5 paid</span>
                    <span className={`badge ${STATUS_BADGE[c.status] ?? "bg-warm-50"}`}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-warm-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={params(page - 1)} className="btn-secondary">← Prev</Link>
                )}
                {page < totalPages && (
                  <Link href={params(page + 1)} className="btn-secondary">Next →</Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
