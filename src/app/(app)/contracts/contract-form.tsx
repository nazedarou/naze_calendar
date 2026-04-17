import { defaultDueDates, defaultSplit } from "./helpers";
import { toDateInputValue } from "@/lib/format";

type Milestone = {
  label: string;
  amount: number | string;
  dueDate: Date | string;
};

type Initial = {
  clientId?: string;
  title?: string;
  description?: string | null;
  totalAmount?: number | string;
  currency?: string;
  status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate?: Date | string;
  endDate?: Date | string | null;
  assignedUserIds?: string[];
  milestones?: Milestone[];
};

const DEFAULT_LABELS = [
  "Stage 1 — Deposit",
  "Stage 2 — Design Phase",
  "Stage 3 — Procurement",
  "Stage 4 — Final Installation",
];

export function ContractForm({
  action,
  initial,
  clients,
  employees,
  submitLabel,
  defaultClientId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: Initial;
  clients: { id: string; name: string }[];
  employees: { id: string; name: string; email: string }[];
  submitLabel: string;
  defaultClientId?: string;
}) {
  const total =
    typeof initial?.totalAmount === "string"
      ? Number(initial.totalAmount)
      : (initial?.totalAmount as number | undefined);

  const startDate =
    initial?.startDate ? new Date(initial.startDate as string) : new Date();

  const split = total ? defaultSplit(total) : [0, 0, 0, 0];
  const dueDates = defaultDueDates(startDate);

  const milestones: Milestone[] =
    initial?.milestones && initial.milestones.length === 4
      ? initial.milestones
      : DEFAULT_LABELS.map((label, i) => ({
          label,
          amount: split[i],
          dueDate: dueDates[i],
        }));

  const assigned = new Set(initial?.assignedUserIds ?? []);

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="title">Title *</label>
          <input id="title" name="title" required defaultValue={initial?.title ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="clientId">Client *</label>
          <select
            id="clientId"
            name="clientId"
            required
            defaultValue={initial?.clientId ?? defaultClientId ?? ""}
            className="input"
          >
            <option value="" disabled>
              Select a client…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ""} className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="totalAmount">Total amount *</label>
          <input
            id="totalAmount"
            name="totalAmount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={total ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="currency">Currency</label>
          <input id="currency" name="currency" defaultValue={initial?.currency ?? "USD"} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={initial?.status ?? "DRAFT"} className="input">
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="startDate">Start date *</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={toDateInputValue(initial?.startDate ?? startDate)}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="endDate">End date</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={toDateInputValue(initial?.endDate ?? null)}
            className="input"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Assigned employees</h3>
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

      <div>
        <h3 className="text-sm font-semibold mb-2">Payment schedule (4 stages)</h3>
        <p className="text-xs text-slate-500 mb-3">
          Defaults split the total into 4 equal stages, one per month. Adjust as needed.
        </p>
        <div className="space-y-3">
          {milestones.map((m, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-12 items-end card p-3">
              <div className="sm:col-span-1 text-sm font-semibold text-slate-500 sm:pt-2">
                #{i + 1}
              </div>
              <div className="sm:col-span-5">
                <label className="label" htmlFor={`milestone_${i + 1}_label`}>Label</label>
                <input
                  id={`milestone_${i + 1}_label`}
                  name={`milestone_${i + 1}_label`}
                  required
                  defaultValue={m.label}
                  className="input"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="label" htmlFor={`milestone_${i + 1}_amount`}>Amount</label>
                <input
                  id={`milestone_${i + 1}_amount`}
                  name={`milestone_${i + 1}_amount`}
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={Number(m.amount).toFixed(2)}
                  className="input"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="label" htmlFor={`milestone_${i + 1}_dueDate`}>Due date</label>
                <input
                  id={`milestone_${i + 1}_dueDate`}
                  name={`milestone_${i + 1}_dueDate`}
                  type="date"
                  required
                  defaultValue={toDateInputValue(m.dueDate)}
                  className="input"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
