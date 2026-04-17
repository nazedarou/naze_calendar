import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { formatDate, formatMoney } from "@/lib/format";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function ContractsPage() {
  await requireUser();
  const contracts = await prisma.contract.findMany({
    orderBy: { startDate: "desc" },
    include: {
      client: true,
      payments: { orderBy: { stage: "asc" } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Contracts</h1>
          <p className="text-sm text-slate-500">All contracts and their payment progress</p>
        </div>
        <Link href="/contracts/new" className="btn-primary">+ New contract</Link>
      </div>

      {contracts.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          No contracts yet. <Link href="/contracts/new" className="text-brand-600 underline">Create one</Link>.
        </div>
      ) : (
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
                    {c.client.name} · {formatDate(c.startDate)} · {formatMoney(c.totalAmount, c.currency)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{paid} / 4 paid</span>
                  <span className={`badge ${STATUS_BADGE[c.status] ?? "bg-slate-100"}`}>
                    {c.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
