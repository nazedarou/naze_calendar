"use client";

import { useRouter } from "next/navigation";

type Props = {
  employees: { id: string; name: string }[];
  current: string | null;
  params: Record<string, string>;
};

export function EmployeeFilter({ employees, current, params }: Props) {
  const router = useRouter();

  const buildUrl = (assignedTo: string | null) => {
    const sp = new URLSearchParams(params);
    sp.delete("page");
    if (assignedTo) sp.set("assignedTo", assignedTo);
    else sp.delete("assignedTo");
    return `?${sp.toString()}`;
  };

  return (
    <select
      value={current ?? ""}
      onChange={(e) => router.push(buildUrl(e.target.value || null))}
      className="input py-2 text-xs pr-8"
    >
      <option value="">All employees</option>
      {employees.map((e) => (
        <option key={e.id} value={e.id}>{e.name}</option>
      ))}
    </select>
  );
}
