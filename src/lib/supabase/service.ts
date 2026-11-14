import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * Service-role client. Bypasses Row Level Security, so it is used only for:
 *   - inserting validated public submissions,
 *   - the email outbox worker,
 *   - storage copies between the private and public image buckets,
 * each after the server has checked the request itself. Never import this
 * from a Client Component; the "server-only" import above makes that a build error.
 */
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isServiceConfigured = Boolean(supabaseUrl && secretKey);

let client: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (!isServiceConfigured) throw new Error("SUPABASE_SECRET_KEY is not set.");
  client ??= createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
