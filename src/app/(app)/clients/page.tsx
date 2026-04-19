import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function ClientsPage({ searchParams }: Props) {
  await requireUser();
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: PAGE_SIZE,
      include: {
        _count: { select: { contracts: true, events: true } },
        contracts: {
          where: { status: { in: ["ACTIVE", "DRAFT"] } },
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const params = (p: number) => `?${new URLSearchParams({ ...(query && { q: query }), page: String(p) })}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-slate-500">All clients in your company</p>
        </div>
        <Link href="/clients/new" className="btn-primary">+ New client</Link>
      </div>

      <form method="GET" className="mb-4">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by name, email or phone…"
          className="input max-w-sm"
          autoComplete="off"
        />
      </form>

      {total === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          {query
            ? `No clients matching "${query}".`
            : <>No clients yet. <Link href="/clients/new" className="text-brand-600 underline">Add the first one</Link>.</>}
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {query ? `${total} result${total !== 1 ? "s" : ""} for "${query}" · ` : ""}
            Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
          </p>

          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 hidden md:table-cell">Assigned To</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Contracts</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm">
                {clients.map((c) => {
                  const assignees = [
                    ...new Map(
                      c.contracts
                        .flatMap((ct) => ct.assignments.map((a) => a.user))
                        .map((u) => [u.id, u])
                    ).values(),
                  ];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/clients/${c.id}`} className="text-brand-700 hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.email ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{c.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        {assignees.length > 0
                          ? assignees.map((u) => u.name).join(", ")
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">{c._count.contracts}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{c._count.events}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
