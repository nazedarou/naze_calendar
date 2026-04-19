import Link from "next/link";
import { prisma } from "@/lib/db";
import { ClientForm } from "../client-form";
import { createClient } from "../actions";

export default async function NewClientPage() {
  const employees = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <div className="mb-6">
        <Link href="/clients" className="text-sm text-brand-600 hover:underline">
          ← Back to clients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New client</h1>
      </div>
      <div className="card p-6 max-w-2xl">
        <ClientForm action={createClient} submitLabel="Create client" employees={employees} />
      </div>
    </div>
  );
}
