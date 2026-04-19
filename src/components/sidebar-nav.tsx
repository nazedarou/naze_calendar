"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/permissions";

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10h5v-5h4v5h5V10" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="3" y="4" width="18" height="18" rx="0" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </svg>
  );
}
function ClientsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 20c0-2-1-3.47-3-5" />
    </svg>
  );
}
function ContractsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}
function EmployeesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <circle cx="10" cy="7" r="4" />
      <path d="M4 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

const baseLinks = [
  { href: "/",          label: "Dashboard", icon: HomeIcon,      exact: true  },
  { href: "/calendar",  label: "Calendar",  icon: CalendarIcon,  exact: false },
  { href: "/clients",   label: "Clients",   icon: ClientsIcon,   exact: false },
  { href: "/contracts", label: "Contracts", icon: ContractsIcon, exact: false },
];

export function SidebarNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const links = user.role === "OWNER"
    ? [...baseLinks, { href: "/employees", label: "Employees", icon: EmployeesIcon, exact: false }]
    : baseLinks;

  return (
    <nav className="flex-1 py-4">
      {links.map(({ href, label, icon: Icon, exact }, i) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 pl-4 pr-5 py-2.5 border-l-2 text-sm font-semibold transition-colors ${
              active
                ? "border-lime text-lime bg-lime-ghost"
                : "border-transparent text-ink-400 hover:text-ink-100 hover:bg-ink-800"
            }`}
          >
            <span
              className="w-5 shrink-0 text-ink-500 tabular-nums"
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <Icon />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
