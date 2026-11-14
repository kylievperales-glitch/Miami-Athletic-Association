import { Suspense } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { requireAdmin } from "@/lib/auth";
import { getPendingCount } from "@/lib/events/admin";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const pending = await getPendingCount(admin.supabase);
  return (
    <div className="lg:flex">
      <Suspense>
        <Sidebar name={admin.name} email={admin.email} pending={pending} />
      </Suspense>
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
