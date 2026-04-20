"use client";

import { useRouter } from "next/navigation";

type Props = {
  employees: { id: string; name: string }[];
  current: string | null;
  buildUrl: (assignedTo: string | null) => string;
};

export function EmployeeFilter({ employees, current, buildUrl }: Props) {
  const router = useRouter();
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
