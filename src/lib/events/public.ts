import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/server";
import { demoEvents, isDemoMode } from "./demo";
import { PUBLIC_EVENT_COLUMNS, type PublicEvent } from "./types";

/**
 * Public reads. These run with the anonymous key and no session, so Row Level
 * Security limits them to published events and their public columns.
 */

export type LoadResult = { events: PublicEvent[]; state: "ok" | "unconfigured" | "error" | "demo" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Published events overlapping [from, to] (Miami dates, inclusive). */
export async function getPublishedEvents(from: string, to: string): Promise<LoadResult> {
  if (isDemoMode) {
    return { events: demoEvents().filter((e) => e.start_date <= to && e.end_date >= from), state: "demo" };
  }
  if (!isSupabaseConfigured) return { events: [], state: "unconfigured" };
  const { data, error } = await createPublicClient()
    .from("events")
    .select(PUBLIC_EVENT_COLUMNS)
    .lte("start_date", to)
    .gte("end_date", from)
    .order("starts_at", { ascending: true })
    .limit(1000);
  if (error) {
    console.error("[calendar] failed to load events:", error.message);
    return { events: [], state: "error" };
  }
  return { events: (data ?? []) as unknown as PublicEvent[], state: "ok" };
}

export async function getPublishedEvent(id: string): Promise<PublicEvent | null> {
  if (!UUID_RE.test(id)) return null;
  if (isDemoMode) return demoEvents().find((e) => e.id === id) ?? null;
  if (!isSupabaseConfigured) return null;
  const { data, error } = await createPublicClient().from("events").select(PUBLIC_EVENT_COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    console.error("[calendar] failed to load event:", error.message);
    return null;
  }
  return (data as unknown as PublicEvent) ?? null;
}
