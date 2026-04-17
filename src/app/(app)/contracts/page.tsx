import Link from "next/link";
import { prisma } from "@/lib/db";
import { isOwner, requireUser } from "@/lib/permissions";
import { formatDate, formatMoney } from "@/lib/format";

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function ContractsPage({ searchParams }: Props) {
  const user = await requireUser();
  const owner = isOwner(user);
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const assignmentFilter = owner ? undefined : { assignments: { some: { userId: user.id } } };
  const where = query
    ? {
        ...assignmentFilter,
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { client: { name: { contains: query, mode: "insensitive" as const } } },
        ],
      }
    : assignmentFilter;

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
  const params = (p: number) => `?${new URLSearchParams({ ...(query && { q: query }), page: String(p) })}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Contracts</h1>
          <p className="text-sm text-slate-500">All contracts and their payment progress</p>
        </div>
        {owner && <Link href="/contracts/new" className="btn-primary">+ New contract</Link>}
      </div>

      <form method="GET" className="mb-4">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by contract title or client name…"
          className="input max-w-sm"
          autoComplete="off"
        />
      </form>

      {total === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          {query
            ? `No contracts matching "${query}".`
            : <>No contracts yet. <Link href="/contracts/new" className="text-brand-600 underline">Create one</Link>.</>}
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
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
                  className="card p-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium text-brand-700">{c.title}</div>
                    <div className="text-sm text-slate-500">
                      {c.client.name} · {formatDate(c.startDate)} · {formatMoney(c.totalAmount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{paid} / 5 paid</span>
                    <span className={`badge ${STATUS_BADGE[c.status] ?? "bg-slate-100"}`}>
                      {c.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">Page {page} of {totalPages}</span>
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
