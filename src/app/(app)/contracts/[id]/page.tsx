import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isOwner, requireContractAccess } from "@/lib/permissions";
import { formatDate, formatMoney } from "@/lib/format";
import { ContractForm } from "../contract-form";
import { clearPaymentDue, deleteContract, markPaymentDue, togglePayment, updateContract } from "../actions";

type Props = { params: Promise<{ id: string }> };

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-700",
};


export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireContractAccess(id);

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
      select: { id: true, name: true },
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
          · {formatMoney(contract.totalAmount)} total ·{" "}
          {formatMoney(totalPaid)} collected
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Payment schedule</h2>
        <ul className="divide-y divide-slate-200">
          {contract.payments.map((p) => {
            const overdue = p.status !== "PAID" && p.dueDate && p.dueDate < now;
            const visualStatus = overdue ? "OVERDUE" : p.status;
            return (
              <li key={p.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">Stage {p.stage} — {p.label}</div>
                  <div className="text-xs text-slate-500">
                    {p.status === "PAID" && p.paidDate
                      ? `Paid ${formatDate(p.paidDate)}`
                      : p.dueDate
                        ? `Due ${formatDate(p.dueDate)}`
                        : "Not yet due"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{formatMoney(p.amount)}</div>
                  {p.status === "PAID" ? (
                    <>
                      <span className={`badge ${STATUS_BADGE["PAID"]}`}>PAID</span>
                      <form action={togglePayment.bind(null, p.id)}>
                        <input type="hidden" name="paid" value="false" />
                        <button type="submit" className="text-xs text-slate-400 hover:text-slate-600 underline">
                          Undo
                        </button>
                      </form>
                    </>
                  ) : p.dueDate ? (
                    <>
                      <span className={`badge ${STATUS_BADGE[visualStatus]}`}>{visualStatus}</span>
                      <form action={togglePayment.bind(null, p.id)}>
                        <input type="hidden" name="paid" value="true" />
                        <button type="submit" className="btn-primary text-xs">Paid</button>
                      </form>
                      <form action={clearPaymentDue.bind(null, p.id)}>
                        <button type="submit" className="text-xs text-slate-400 hover:text-slate-600 underline">
                          Undo
                        </button>
                      </form>
                    </>
                  ) : (
                    <form action={markPaymentDue.bind(null, p.id)}>
                      <button type="submit" className="btn-secondary text-xs">Payment Due</button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Edit contract</h2>
          <ContractForm
            readOnly={!isOwner(user)}
            action={updateContract.bind(null, contract.id)}
            initial={{
              clientId: contract.clientId,
              title: contract.title,
              description: contract.description,
              totalAmount: Number(contract.totalAmount),
              stage1Amount: Number(contract.payments.find((p) => p.stage === 1)?.amount ?? 0),
              status: contract.status,
              startDate: contract.startDate,
              assignedUserIds: contract.assignments.map((a) => a.userId),
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
