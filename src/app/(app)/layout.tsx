import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { requireUser } from "@/lib/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 overflow-y-auto px-4 py-6 md:px-10 md:py-10 pb-24 md:pb-10">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
      <BottomNav user={user} />
    </div>
  );
}
