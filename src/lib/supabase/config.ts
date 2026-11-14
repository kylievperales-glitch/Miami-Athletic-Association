/**
 * Supabase connection settings. The URL and publishable (anon) key are safe in
 * the browser: Row Level Security decides what they can reach. The secret
 * (service role) key is read only in src/lib/supabase/service.ts, which is
 * server-only.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const BUCKET_UPLOADS = "event-uploads";
export const BUCKET_PUBLIC = "event-images";

/** Public URL of an image in the public bucket. */
export function publicImageUrl(path: string | null) {
  if (!path || !supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_PUBLIC}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
