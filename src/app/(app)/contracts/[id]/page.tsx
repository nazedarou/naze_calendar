import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isOwner, requireUser } from "@/lib/permissions";
import { formatDate, formatMoney } from "@/lib/format";
import { ContractForm } from "../contract-form";
import { deleteContract, togglePayment, updateContract } from "../actions";

type Props = { params: Promise<{ id: string }> };

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-700",
};

export default async function ContractDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const [contract, clients, employees] = await Promise.all([
    prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        payments: { orderBy: { stage: "asc" } },
        assignments: { include: { user: true } },
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  if (!contract) notFound();

  const now = new Date();
  const totalPaid = contract.payments
    .filter((p) => p.status === "PAID")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/contracts" className="text-sm text-brand-600 hover:underline">
          ← Back to contracts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{contract.title}</h1>
        <p className="text-sm text-slate-500">
          <Link href={`/clients/${contract.client.id}`} className="text-brand-600 hover:underline">
            {contract.client.name}
          </Link>{" "}
          · {formatMoney(contract.totalAmount, contract.currency)} total ·{" "}
          {formatMoney(totalPaid, contract.currency)} collected
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Payment schedule</h2>
        <ul className="divide-y divide-slate-200">
          {contract.payments.map((p) => {
            const overdue = p.status !== "PAID" && p.dueDate < now;
            const status = overdue ? "OVERDUE" : p.status;
            return (
              <li key={p.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">
                    Stage {p.stage} — {p.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    Due {formatDate(p.dueDate)}
                    {p.paidDate ? ` · Paid ${formatDate(p.paidDate)}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold">
                    {formatMoney(p.amount, contract.currency)}
                  </div>
                  <span className={`badge ${STATUS_BADGE[status]}`}>{status}</span>
                  <form action={togglePayment.bind(null, p.id)}>
                    <input
                      type="hidden"
                      name="paid"
                      value={p.status === "PAID" ? "false" : "true"}
                    />
                    <button type="submit" className="btn-secondary text-xs">
                      {p.status === "PAID" ? "Mark unpaid" : "Mark paid"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Edit contract</h2>
        <ContractForm
          action={updateContract.bind(null, contract.id)}
          initial={{
            clientId: contract.clientId,
            title: contract.title,
            description: contract.description,
            totalAmount: Number(contract.totalAmount),
            currency: contract.currency,
            status: contract.status,
            startDate: contract.startDate,
            endDate: contract.endDate,
            assignedUserIds: contract.assignments.map((a) => a.userId),
            milestones: contract.payments.map((p) => ({
              label: p.label,
              amount: Number(p.amount),
              dueDate: p.dueDate,
            })),
          }}
          clients={clients}
          employees={employees}
          submitLabel="Save changes"
        />
        {isOwner(user) && (
          <form
            action={deleteContract.bind(null, contract.id)}
            className="mt-6 border-t pt-4 flex justify-end"
          >
            <button type="submit" className="btn-danger">Delete contract</button>
          </form>
        )}
      </div>
    </div>
  );
}
