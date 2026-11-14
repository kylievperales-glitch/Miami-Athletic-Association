import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/AuthForms";
import { getAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

  return (
    <>
      <h1 className="display text-[1.75rem]">Dashboard Sign In</h1>
      <p className="mt-2 text-[0.9375rem] text-muted">For authorized Miami Athletic Association administrators.</p>
      <div className="mt-7">
        {isSupabaseConfigured ? (
          <>
            {error && (
              <p className="mb-5 border-l-4 border-[#b3261e] bg-paper px-3 py-2 text-[0.9375rem]">
                That link is invalid or has expired. Please sign in, or request a new reset link.
              </p>
            )}
            <LoginForm next={safeNext} />
          </>
        ) : (
          <p className="border-l-4 border-sun bg-paper px-3 py-2 text-[0.9375rem]">
            The dashboard isn&apos;t connected yet. Add the Supabase environment variables described in SETUP-CALENDAR.md, then
            reload this page.
          </p>
        )}
      </div>
    </>
  );
}
