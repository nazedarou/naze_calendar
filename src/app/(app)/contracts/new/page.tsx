import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { ContractForm } from "../contract-form";
import { createContract } from "../actions";

type Props = { searchParams: Promise<{ clientId?: string }> };

export default async function NewContractPage({ searchParams }: Props) {
  await requireOwner();
  const { clientId } = await searchParams;

  const [clients, employees] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <Link href="/contracts" className="text-sm text-brand-600 hover:underline">
          ← Back to contracts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New contract</h1>
      </div>
      {clients.length === 0 ? (
        <div className="card p-6 text-slate-500">
          You need to{" "}
          <Link href="/clients/new" className="text-brand-600 underline">add a client</Link> first.
        </div>
      ) : (
        <div className="card p-6">
          <ContractForm
            action={createContract}
            clients={clients}
            employees={employees}
            defaultClientId={clientId}
            submitLabel="Create contract"
          />
        </div>
      )}
    </div>
  );
}
