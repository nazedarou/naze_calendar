import Link from "next/link";
import { signOut } from "@/lib/auth";
import type { SessionUser } from "@/lib/permissions";
import { SidebarNav } from "./sidebar-nav";

function ProfileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function Sidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-[#17120E] border-r border-[#251F18]">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 border-b border-[#251F18]">
        <Link href="/" className="block">
          <span className="font-serif text-[22px] text-[#E8D8C4]" style={{ letterSpacing: "0.18em" }}>
            FONK
          </span>
          <span className="block text-[9px] uppercase text-[#4A3D30] mt-0.5" style={{ letterSpacing: "0.3em" }}>
            Dashboard
          </span>
        </Link>
      </div>

      {/* Nav links */}
      <SidebarNav user={user} />

      {/* User + sign out */}
      <div className="px-3 pb-4 pt-3 border-t border-[#251F18] mt-auto space-y-0.5">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#7A6A58] hover:bg-[#221C16] hover:text-[#C0A882] transition-colors"
        >
          <ProfileIcon />
          <div className="flex-1 min-w-0">
            <div className="truncate text-[#B8A492] text-xs">{user.name}</div>
            <div className="text-[9px] uppercase text-[#4A3D30] tracking-wider">{user.role}</div>
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
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#4A3D30] hover:bg-[#221C16] hover:text-[#7A6A58] transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
