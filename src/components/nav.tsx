import Link from "next/link";
import { signOut } from "@/lib/auth";
import type { SessionUser } from "@/lib/permissions";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/clients", label: "Clients" },
];

export function Nav({ user }: { user: SessionUser }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-brand-700">
            Fonk Dashboard
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-slate-600 hover:text-brand-600"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/contracts" className="text-slate-600 hover:text-brand-600">
              Contracts
            </Link>
            {user.role === "OWNER" && (
              <Link href="/employees" className="text-slate-600 hover:text-brand-600">
                Employees
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/profile" className="text-slate-600 hover:text-brand-600">
            {user.name}{" "}
            <span className="badge bg-brand-100 text-brand-700">{user.role}</span>
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="btn-secondary">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
