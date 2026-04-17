import { STAGE_LABELS, STAGE_PERCENTAGES } from "./helpers";
import { formatMoney, toDateInputValue } from "@/lib/format";

type Initial = {
  clientId?: string;
  title?: string;
  description?: string | null;
  totalAmount?: number | string;
  stage1Amount?: number | string;
  status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate?: Date | string;
  assignedUserIds?: string[];
};

export function ContractForm({
  action,
  initial,
  clients,
  employees,
  submitLabel,
  defaultClientId,
  readOnly = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: Initial;
  clients: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  submitLabel: string;
  defaultClientId?: string;
  readOnly?: boolean;
}) {
  const total =
    typeof initial?.totalAmount === "string"
      ? Number(initial.totalAmount)
      : (initial?.totalAmount as number | undefined);

  const stage1Amount =
    typeof initial?.stage1Amount === "string"
      ? Number(initial.stage1Amount)
      : (initial?.stage1Amount as number | undefined);

  const startDate =
    initial?.startDate ? new Date(initial.startDate as string) : new Date();

  const assigned = new Set(initial?.assignedUserIds ?? []);

  const clientName = clients.find((c) => c.id === (initial?.clientId ?? defaultClientId))?.name ?? "";
  const displayStatus = initial?.status ?? "DRAFT";

  return (
    <form action={action} className="space-y-6">
      {/* Hidden passthrough fields when readOnly — disabled inputs don't submit */}
      {readOnly && (
        <>
          <input type="hidden" name="title" value={initial?.title ?? ""} />
          <input type="hidden" name="clientId" value={initial?.clientId ?? defaultClientId ?? ""} />
          <input type="hidden" name="totalAmount" value={String(total ?? "")} />
          <input type="hidden" name="startDate" value={toDateInputValue(initial?.startDate ?? startDate)} />
          <input type="hidden" name="status" value={displayStatus} />
          <input type="hidden" name="stage1Amount" value={stage1Amount?.toFixed(2) ?? "0"} />
          {Array.from(assigned).map((uid) => (
            <input key={uid} type="hidden" name="assignedUserIds" value={uid} />
          ))}
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Title</label>
          {readOnly ? (
            <p className="input bg-slate-50 text-slate-600">{initial?.title ?? ""}</p>
          ) : (
            <input id="title" name="title" required defaultValue={initial?.title ?? ""} className="input" />
          )}
        </div>
        <div>
          <label className="label">Client</label>
          {readOnly ? (
            <p className="input bg-slate-50 text-slate-600">{clientName}</p>
          ) : (
            <select
              id="clientId"
              name="clientId"
              required
              defaultValue={initial?.clientId ?? defaultClientId ?? ""}
              className="input"
            >
              <option value="" disabled>Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ""} className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Total amount</label>
          {readOnly ? (
            <p className="input bg-slate-50 text-slate-600">{total != null ? formatMoney(total) : "—"}</p>
          ) : (
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
          )}
        </div>
        <div>
          <label className="label">Start date</label>
          {readOnly ? (
            <p className="input bg-slate-50 text-slate-600">{toDateInputValue(initial?.startDate ?? startDate)}</p>
          ) : (
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              defaultValue={toDateInputValue(initial?.startDate ?? startDate)}
              className="input"
            />
          )}
        </div>
        <div>
          <label className="label">Status</label>
          {readOnly ? (
            <p className="input bg-slate-50 text-slate-600">{displayStatus}</p>
          ) : (
            <select id="status" name="status" defaultValue={displayStatus} className="input">
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Assigned employees</h3>
        {employees.length === 0 ? (
          <p className="text-xs text-slate-500">No employees yet.</p>
        ) : readOnly ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {employees.filter((e) => assigned.has(e.id)).map((e) => (
              <span key={e.id} className="text-sm text-slate-600">{e.name}</span>
            ))}
            {assigned.size === 0 && <p className="text-xs text-slate-500">None assigned.</p>}
          </div>
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
                <span>{e.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Payment schedule</h3>
        <div className="space-y-2">
          <div className="card p-3 flex items-center justify-between gap-4">
            <span className="text-sm font-medium">{STAGE_LABELS[0]}</span>
            {readOnly ? (
              <span className="text-sm text-slate-600 tabular-nums">
                {stage1Amount != null ? formatMoney(stage1Amount) : "—"}
              </span>
            ) : (
              <input
                id="stage1Amount"
                name="stage1Amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={stage1Amount?.toFixed(2) ?? ""}
                placeholder="0.00"
                className="input w-36 text-right"
              />
            )}
          </div>
          {STAGE_LABELS.slice(1).map((label, i) => {
            const pct = STAGE_PERCENTAGES[i + 1]!;
            const amount = total ? total * pct : null;
            return (
              <div key={label} className="card p-3 flex items-center justify-between gap-4 bg-slate-50">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="text-sm text-slate-500 text-right tabular-nums">
                  {(pct * 100).toFixed(0)}%{amount !== null ? ` = ${formatMoney(amount)}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
