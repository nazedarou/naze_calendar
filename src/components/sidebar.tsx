import Link from "next/link";
import { signOut } from "@/lib/auth";
import type { SessionUser } from "@/lib/permissions";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="hidden md:flex w-52 flex-shrink-0 flex-col bg-ink-950 border-r border-ink-600">
      {/* Wordmark */}
      <div className="px-6 pt-7 pb-6 border-b border-ink-600">
        <Link href="/" className="block group">
          <div
            className="text-[32px] font-extrabold leading-none text-ink-100 tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FONK
          </div>
          <div
            className="mt-2 text-[9px] uppercase text-ink-500"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.28em" }}
          >
            Interior Mgmt
          </div>
        </Link>
      </div>

      {/* Nav */}
      <SidebarNav user={user} />

      {/* User + sign out */}
      <div className="px-4 pb-5 pt-4 border-t border-ink-600 mt-auto space-y-1">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-2 py-2 text-xs text-ink-400 hover:text-ink-100 transition-colors group"
        >
          <div className="w-6 h-6 border border-ink-600 group-hover:border-lime flex items-center justify-center shrink-0 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="truncate text-ink-200 text-xs font-semibold">{user.name}</div>
            <div
              className="text-[9px] uppercase text-ink-500"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
            >
              {user.role}
            </div>
          </div>
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="w-full text-left px-2 py-1.5 text-[11px] uppercase text-ink-500 hover:text-danger transition-colors"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
          >
            Sign out →
          </button>
        </form>
      </div>
    </aside>
  );
}
