import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { autoPromoteClients } from "@/lib/auto-promote";

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
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

const VALID_STATUSES = ["NEW", "FIRST_APPOINTMENT", "SECOND_APPOINTMENT"] as const;
type ClientStatus = (typeof VALID_STATUSES)[number];

export default async function ClientsPage({ searchParams }: Props) {
  const user = await requireUser();
  const owner = user.role === "OWNER";
  await autoPromoteClients();
  const { q, page: pageParam, status: statusParam } = await searchParams;
  const query = q?.trim() ?? "";
  const statusFilter = VALID_STATUSES.includes(statusParam as ClientStatus)
    ? (statusParam as ClientStatus)
    : null;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  // Scope all queries to assigned clients for employees
  const scopeFilter = owner ? {} : { assignedToId: user.id };

  // Stats scoped to the same visibility as the table
  const [totalCount, newCount, firstApptCount, secondApptCount, awaitingProposalCount, engagedCount] =
    await Promise.all([
      prisma.client.count({ where: scopeFilter }),
      prisma.client.count({ where: { ...scopeFilter, clientStatus: "NEW" } }),
      prisma.client.count({ where: { ...scopeFilter, clientStatus: "FIRST_APPOINTMENT" } }),
      prisma.client.count({ where: { ...scopeFilter, clientStatus: "SECOND_APPOINTMENT" } }),
      prisma.client.count({ where: { ...scopeFilter, clientStatus: "SECOND_APPOINTMENT", proposalSent: false } }),
      prisma.client.count({ where: { ...scopeFilter, contracts: { some: {} } } }),
    ]);

  const where = {
    ...scopeFilter,
    ...(statusFilter ? { clientStatus: statusFilter } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

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
  const params = (p: number) =>
    `?${new URLSearchParams({
      ...(query && { q: query }),
      ...(statusFilter && { status: statusFilter }),
      page: String(p),
    })}`;

  const filterLink = (s: ClientStatus | null) => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (s) sp.set("status", s);
    return `?${sp.toString()}`;
  };

  return (
    <div className="space-y-0">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 pb-6 mb-8 border-b border-stone-300">
        <div>
          <div
            className="text-[10px] uppercase text-stone-400 mb-2"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.22em" }}
          >
            Client Overview
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink-900 leading-none">
            CLIENTS
          </h1>
        </div>
        <Link href="/clients/new" className="btn-primary shrink-0">+ New client</Link>
      </div>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 border border-stone-300 bg-white mb-10">
        <ClientStatCell label="Total" value={totalCount} active={!statusFilter} href={filterLink(null)} />
        <ClientStatCell label="New" value={newCount} active={statusFilter === "NEW"} href={filterLink("NEW")} border />
        <ClientStatCell label="1st Appt" value={firstApptCount} active={statusFilter === "FIRST_APPOINTMENT"} href={filterLink("FIRST_APPOINTMENT")} border />
        <ClientStatCell label="2nd Appt" value={secondApptCount} active={statusFilter === "SECOND_APPOINTMENT"} href={filterLink("SECOND_APPOINTMENT")} border />
        <ClientStatCell label="Engaged" value={engagedCount} active={false} border />
      </div>

      {/* ── Awaiting proposal callout ─────────────────────────── */}
      {awaitingProposalCount > 0 && !statusFilter && !query && (
        <div
          className="flex items-center justify-between px-4 py-3 mb-6 border border-warn bg-amber-50"
        >
          <span className="text-sm font-medium text-amber-800">
            {awaitingProposalCount} client{awaitingProposalCount !== 1 ? "s" : ""} at 2nd appointment awaiting proposal
          </span>
          <Link
            href={filterLink("SECOND_APPOINTMENT")}
            className="text-[10px] uppercase text-amber-700 hover:text-amber-900 transition-colors"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
          >
            View →
          </Link>
        </div>
      )}

      {/* ── Search + filter bar ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form method="GET" className="flex-1 min-w-0">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by name, email or phone…"
            className="input w-full max-w-sm"
            autoComplete="off"
          />
        </form>
        {statusFilter && (
          <Link
            href={filterLink(null)}
            className="text-[10px] uppercase text-stone-500 hover:text-ink-900 transition-colors border border-stone-300 px-3 py-2"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
          >
            × Clear filter
          </Link>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      {total === 0 ? (
        <div className="border border-stone-300 bg-white p-8 text-center">
          <p className="text-sm text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
            {query
              ? `No clients matching "${query}".`
              : statusFilter
              ? `No clients with status ${CLIENT_STATUS_LABEL[statusFilter]}.`
              : "No clients yet."}
          </p>
          {!query && !statusFilter && (
            <Link href="/clients/new" className="mt-3 inline-block btn-primary">
              Add the first one
            </Link>
          )}
        </div>
      ) : (
        <>
          <p
            className="mb-3 text-[10px] uppercase text-stone-400"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}
          >
            {query ? `${total} result${total !== 1 ? "s" : ""} for "${query}" · ` : ""}
            {statusFilter ? `${CLIENT_STATUS_LABEL[statusFilter]} · ` : ""}
            {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
          </p>

          <div className="border border-stone-300 overflow-hidden bg-white">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50 text-left">
                <tr>
                  <th
                    className="px-4 py-3 text-[9px] uppercase text-stone-400"
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
                  >
                    Name
                  </th>
                  <th
                    className="px-4 py-3 text-[9px] uppercase text-stone-400"
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
                  >
                    Status
                  </th>
                  <th
                    className="px-4 py-3 text-[9px] uppercase text-stone-400 hidden sm:table-cell"
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
                  >
                    Email
                  </th>
                  <th
                    className="px-4 py-3 text-[9px] uppercase text-stone-400 hidden md:table-cell"
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
                  >
                    Assigned To
                  </th>
                  <th
                    className="px-4 py-3 text-[9px] uppercase text-stone-400 hidden sm:table-cell"
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
                  >
                    Contract
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-sm">
                {clients.map((c) => {
                  const contract = c.contracts[0] ?? null;
                  return (
                    <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-semibold">
                        <Link href={`/clients/${c.id}`} className="text-ink-900 hover:text-stone-500 transition-colors">
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
                      <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">
                        {c.email ?? <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-stone-500 hidden md:table-cell">
                        {c.assignedTo ? c.assignedTo.name : <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {contract ? (
                          <Link
                            href={`/contracts/${contract.id}`}
                            className="text-ink-900 hover:text-stone-500 transition-colors truncate max-w-[160px] block"
                          >
                            {contract.title}
                          </Link>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span
                className="text-[10px] uppercase text-stone-400"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Page {page} of {totalPages}
              </span>
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

function ClientStatCell({
  label,
  value,
  href,
  active,
  border,
}: {
  label: string;
  value: number;
  href?: string;
  active?: boolean;
  border?: boolean;
}) {
  const inner = (
    <div
      className={`p-4 sm:p-5 ${border ? "border-l border-stone-300" : ""} ${
        active ? "bg-ink-900" : href ? "hover:bg-stone-50 transition-colors cursor-pointer" : ""
      }`}
    >
      <div
        className={`text-[9px] uppercase mb-2 ${active ? "text-stone-400" : "text-stone-400"}`}
        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
      >
        {label}
      </div>
      <div
        className={`text-3xl font-extrabold leading-none tabular-nums ${
          active ? "text-white" : "text-ink-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}
