import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 overflow-y-auto px-10 py-10">
        <div className="mx-auto max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  );
}
