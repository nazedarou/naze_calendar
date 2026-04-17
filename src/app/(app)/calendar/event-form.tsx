import { toDateTimeInputValue } from "@/lib/format";

type Initial = {
  title?: string;
  description?: string | null;
  location?: string | null;
  startAt?: Date | string;
  clientId?: string | null;
  contractId?: string | null;
  assignedUserIds?: string[];
};

export function EventForm({
  action,
  initial,
  clients,
  contracts,
  employees,
  submitLabel,
  defaultClientId,
  defaultContractId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: Initial;
  clients: { id: string; name: string }[];
  contracts: { id: string; title: string; clientId: string }[];
  employees: { id: string; name: string; email: string }[];
  submitLabel: string;
  defaultClientId?: string;
  defaultContractId?: string;
}) {
  const now = new Date();
  const assigned = new Set(initial?.assignedUserIds ?? []);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="label" htmlFor="title">Title *</label>
        <input id="title" name="title" required defaultValue={initial?.title ?? ""} className="input" />
      </div>

      <div>
        <label className="label" htmlFor="startAt">Start *</label>
        <input
          id="startAt"
          name="startAt"
          type="datetime-local"
          required
          defaultValue={toDateTimeInputValue(initial?.startAt ?? now)}
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="location">Location</label>
        <input id="location" name="location" defaultValue={initial?.location ?? ""} className="input" />
      </div>

      <div>
        <label className="label" htmlFor="description">Notes</label>
        <textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ""} className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="clientId">Client</label>
          <select id="clientId" name="clientId" defaultValue={initial?.clientId ?? defaultClientId ?? ""} className="input">
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="contractId">Contract</label>
          <select id="contractId" name="contractId" defaultValue={initial?.contractId ?? defaultContractId ?? ""} className="input">
            <option value="">—</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Assigned staff</h3>
        {employees.length === 0 ? (
          <p className="text-xs text-slate-500">No employees yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {employees.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="assignedUserIds"
                  value={e.id}
                  defaultChecked={assigned.has(e.id)}
                />
                <span>{e.name} <span className="text-xs text-slate-500">({e.email})</span></span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
