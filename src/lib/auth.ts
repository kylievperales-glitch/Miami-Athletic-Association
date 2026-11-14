import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  email: string;
  name: string;
  supabase: Awaited<ReturnType<typeof createSessionClient>>;
};

/**
 * The signed-in administrator, or null. Verifies the user with Supabase Auth
 * (not just the cookie) and checks membership in public.admins.
 */
export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  // Always per request: admin pages must never be served from a static build.
  await connection();
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data: row } = await supabase.from("admins").select("display_name").eq("user_id", user.id).maybeSingle();
  if (!row) return null;
  return { userId: user.id, email: user.email ?? "", name: row.display_name, supabase };
});

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
