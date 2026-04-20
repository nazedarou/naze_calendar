import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { autoPromoteClients } from "@/lib/auto-promote";

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

const CLIENT_STATUS_LABEL: Record<string, string> = {
  NEW:                "New",
  FIRST_APPOINTMENT:  "1st Appt",
  SECOND_APPOINTMENT: "2nd Appt",
};

const CLIENT_STATUS_STYLE: Record<string, string> = {
  NEW:                "bg-slate-100 text-slate-600",
  FIRST_APPOINTMENT:  "bg-blue-100 text-blue-700",
  SECOND_APPOINTMENT: "bg-amber-100 text-amber-700",
};

export default async function ClientsPage({ searchParams }: Props) {
  await requireUser();
  await autoPromoteClients();
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
        assignedTo: { select: { id: true, name: true } },
        contracts: {
          orderBy: { startDate: "desc" },
          take: 1,
          select: { id: true, title: true, status: true },
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
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 hidden md:table-cell">Assigned To</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Contract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm">
                {clients.map((c) => {
                  const contract = c.contracts[0] ?? null;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/clients/${c.id}`} className="text-brand-700 hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`badge ${CLIENT_STATUS_STYLE[c.clientStatus]}`}>
                            {CLIENT_STATUS_LABEL[c.clientStatus]}
                          </span>
                          {c.proposalSent && (
                            <span className="badge bg-green-100 text-green-700">Proposal</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                        {c.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        {c.assignedTo ? c.assignedTo.name : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {contract ? (
                          <Link
                            href={`/contracts/${contract.id}`}
                            className="text-brand-700 hover:underline truncate max-w-[160px] block"
                          >
                            {contract.title}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
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
