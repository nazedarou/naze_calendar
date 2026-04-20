import Link from "next/link";
import { signOut } from "@/lib/auth";
import type { SessionUser } from "@/lib/permissions";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-white border-r border-warm-200">
      {/* Wordmark */}
      <div className="px-6 pt-7 pb-5 border-b border-warm-100">
        <Link href="/" className="block group">
          <div
            className="text-3xl font-semibold leading-none text-warm-900 tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Fonk
          </div>
          <div className="mt-1 text-[10px] text-warm-400 tracking-widest uppercase font-medium">
            Interior Studio
          </div>
        </Link>
      </div>

      {/* Nav */}
      <SidebarNav user={user} />

      {/* User + sign out */}
      <div className="px-4 pb-5 pt-4 border-t border-warm-100 mt-auto space-y-1">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-2 py-2 rounded-md text-xs text-warm-500 hover:text-warm-900 hover:bg-warm-50 transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-warm-100 border border-warm-200 flex items-center justify-center shrink-0 text-warm-600 group-hover:border-brand-300 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="truncate text-warm-800 text-xs font-semibold">{user.name}</div>
            <div className="text-[10px] text-warm-400 capitalize">{user.role.toLowerCase()}</div>
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
            className="w-full text-left px-2 py-1.5 text-xs text-warm-400 hover:text-danger transition-colors rounded-md"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
