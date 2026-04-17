import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export default async function ClientsPage() {
  await requireUser();
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { contracts: true, events: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-slate-500">All clients in your company</p>
        </div>
        <Link href="/clients/new" className="btn-primary">
          + New client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          No clients yet. <Link href="/clients/new" className="text-brand-600 underline">Add the first one</Link>.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Contracts</th>
                <th className="px-4 py-3">Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/clients/${c.id}`} className="text-brand-700 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3">{c._count.contracts}</td>
                  <td className="px-4 py-3">{c._count.events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
