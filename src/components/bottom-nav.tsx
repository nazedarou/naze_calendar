"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/permissions";

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9" /><path d="M5 10v10h5v-5h4v5h5V10" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </svg>
  );
}
function ClientsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 20c0-2-1-3.47-3-5" />
    </svg>
  );
}
function ContractsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}
function EmployeesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="4" />
      <path d="M4 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

const baseLinks = [
  { href: "/",          label: "Home",     icon: HomeIcon,      exact: true  },
  { href: "/calendar",  label: "Calendar", icon: CalendarIcon,  exact: false },
  { href: "/clients",   label: "Clients",  icon: ClientsIcon,   exact: false },
  { href: "/contracts", label: "Projects", icon: ContractsIcon, exact: false },
];

export function BottomNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const links = user.role === "OWNER"
    ? [...baseLinks, { href: "/employees", label: "Team", icon: EmployeesIcon, exact: false }]
    : baseLinks;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-warm-200 flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
              active ? "text-brand-600" : "text-warm-400"
            }`}
          >
            <Icon />
            <span className="text-[9px] font-medium tracking-wide uppercase">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
