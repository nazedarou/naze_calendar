import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { createEmployee, deleteEmployee, updateEmployee } from "./actions";

export default async function EmployeesPage() {
  const owner = await requireOwner();
  const users = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="text-sm text-slate-500">Manage accounts, roles, and access.</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Add new employee</h2>
        <form action={createEmployee} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Name *</label>
            <input id="name" name="name" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email *</label>
            <input id="email" name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Temporary password *</label>
            <input id="password" name="password" type="password" required minLength={8} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="role">Role *</label>
            <select id="role" name="role" defaultValue="EMPLOYEE" className="input">
              <option value="EMPLOYEE">Employee</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary">Create employee</button>
          </div>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">All accounts</h2>
        <ul className="divide-y divide-slate-200">
          {users.map((u) => {
            const isSelf = u.id === owner.id;
            return (
              <li key={u.id} className="py-4">
                <form
                  action={updateEmployee.bind(null, u.id)}
                  className="grid gap-3 sm:grid-cols-12 items-end"
                >
                  <div className="sm:col-span-3">
                    <label className="label">Name</label>
                    <input name="name" required defaultValue={u.name} className="input" />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="label">Email</label>
                    <input value={u.email} readOnly disabled className="input bg-slate-50" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Role</label>
                    <select name="role" defaultValue={u.role} className="input" disabled={isSelf}>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="label">Active</label>
                    <select name="active" defaultValue={u.active ? "true" : "false"} className="input" disabled={isSelf}>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Reset password</label>
                    <input name="password" type="password" placeholder="Leave blank to keep" className="input" />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button type="submit" className="btn-secondary w-full">Save</button>
                  </div>
                  <div className="sm:col-span-12 text-xs text-slate-500">
                    Added {formatDate(u.createdAt)}
                    {isSelf && <span className="ml-2 badge bg-brand-100 text-brand-700">You</span>}
                  </div>
                </form>

                {!isSelf && (
                  <form action={deleteEmployee.bind(null, u.id)} className="mt-2 flex justify-end">
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                      Delete account
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
