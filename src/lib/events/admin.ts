import "server-only";
import type { AdminSession } from "@/lib/auth";
import { BUCKET_PUBLIC, BUCKET_UPLOADS } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";
import { firstOfMonth, lastOfMonth, miamiToday, monthOf } from "@/lib/time";
import type { AdminEvent, AuditEntry, EventStatus, OutboxEmail } from "./types";

/**
 * Dashboard reads. These use the admin's own session, so Row Level Security
 * applies: a session that is not in public.admins gets nothing back.
 */

type Db = AdminSession["supabase"];

const ADMIN_COLUMNS = `*, event_private(contact_name, contact_email, contact_phone, newsletter_consent, newsletter_consent_at, accuracy_confirmed_at, original_submission)`;

export async function getStats(db: Db) {
  const today = miamiToday();
  const month = monthOf(today);
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const head = () => db.from("events").select("id", { count: "exact", head: true });
  const [pending, published, upcoming, thisMonth] = await Promise.all([
    count(head().eq("status", "pending")),
    count(head().eq("status", "published")),
    count(head().eq("status", "published").gte("end_date", today)),
    count(head().eq("status", "published").lte("start_date", lastOfMonth(month)).gte("end_date", firstOfMonth(month))),
  ]);
  return { pending, published, upcoming, thisMonth };
}

export async function getPendingCount(db: Db) {
  const { count } = await db.from("events").select("id", { count: "exact", head: true }).eq("status", "pending");
  return count ?? 0;
}

export type ListFilters = {
  status?: EventStatus | null;
  q?: string;
  cat?: string | null;
  when?: "upcoming" | "past" | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  /** Newest submissions first. */
  recent?: boolean;
};

export const PAGE_SIZE = 25;

/** Strip characters with meaning in PostgREST filter syntax. */
const safeSearch = (q: string) => q.replace(/[^\p{L}\p{N}\s'&.-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);

export async function listEvents(db: Db, f: ListFilters) {
  const today = miamiToday();
  const page = Math.max(1, f.page ?? 1);
  let query = db.from("events").select(ADMIN_COLUMNS, { count: "exact" });
  if (f.status) query = query.eq("status", f.status);
  if (f.cat) query = query.eq("category", f.cat);
  if (f.when === "upcoming") query = query.gte("end_date", today);
  if (f.when === "past") query = query.lt("end_date", today);
  if (f.from) query = query.gte("end_date", f.from);
  if (f.to) query = query.lte("start_date", f.to);
  const q = safeSearch(f.q ?? "");
  if (q) query = query.or(`title.ilike.%${q}%,organizer_name.ilike.%${q}%,venue_name.ilike.%${q}%`);

  // Review queue: oldest submission first. Otherwise by event date.
  query =
    f.recent
      ? query.order("submitted_at", { ascending: false, nullsFirst: false })
      : f.status === "pending"
      ? query.order("submitted_at", { ascending: true, nullsFirst: false })
      : f.when === "past"
        ? query.order("start_date", { ascending: false })
        : query.order("start_date", { ascending: true }).order("starts_at", { ascending: true });

  const { data, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) console.error("[admin] list failed:", error.message);
  return { events: (data ?? []) as unknown as AdminEvent[], total: count ?? 0, page };
}

export async function getEvent(db: Db, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("events").select(ADMIN_COLUMNS).eq("id", id).maybeSingle();
  return (data as unknown as AdminEvent) ?? null;
}

export async function getAudit(db: Db, id: string) {
  const { data } = await db
    .from("event_audit")
    .select("id, actor_label, action, changes, note, created_at")
    .eq("event_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as AuditEntry[];
}

export async function getEventEmails(db: Db, id: string) {
  const { data } = await db
    .from("email_outbox")
    .select("id, kind, to_emails, subject, status, attempts, last_error, sent_at, created_at")
    .eq("event_id", id)
    .order("created_at", { ascending: true });
  return (data ?? []) as OutboxEmail[];
}

export async function listEmails(db: Db, status?: string | null) {
  let q = db
    .from("email_outbox")
    .select("id, event_id, kind, to_emails, subject, status, attempts, last_error, sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []) as OutboxEmail[];
}

/** Short-lived link to a private uploaded image, for admin preview only. */
export async function signedImageUrl(path: string | null) {
  if (!path) return null;
  const { data } = await createServiceClient().storage.from(BUCKET_UPLOADS).createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

/**
 * Make the public image bucket match the event's state: a copy exists only
 * while the event is published. Called after every status or image change.
 */
export async function syncPublicImage(eventId: string) {
  const db = createServiceClient();
  const { data: ev } = await db.from("events").select("status, image_path, public_image_path").eq("id", eventId).maybeSingle();
  const folder = eventId;
  const { data: existing } = await db.storage.from(BUCKET_PUBLIC).list(folder);
  const existingPaths = (existing ?? []).map((o) => `${folder}/${o.name}`);

  const wanted = ev?.status === "published" && ev.image_path ? `${folder}/${ev.image_path.split("/").pop()}` : null;

  if (wanted && !existingPaths.includes(wanted)) {
    const { data: file, error } = await db.storage.from(BUCKET_UPLOADS).download(ev!.image_path!);
    if (error || !file) {
      console.error("[images] could not read upload:", error?.message);
      return;
    }
    const { error: upErr } = await db.storage.from(BUCKET_PUBLIC).upload(wanted, file, { contentType: file.type, upsert: true });
    if (upErr) {
      console.error("[images] could not publish image:", upErr.message);
      return;
    }
  }

  const stale = existingPaths.filter((p) => p !== wanted);
  if (stale.length) await db.storage.from(BUCKET_PUBLIC).remove(stale);
  if (ev && (ev.public_image_path ?? null) !== wanted) {
    await db.from("events").update({ public_image_path: wanted }).eq("id", eventId);
  }
}

export async function removeAllImages(eventId: string, imagePath: string | null) {
  const db = createServiceClient();
  const { data: existing } = await db.storage.from(BUCKET_PUBLIC).list(eventId);
  const paths = (existing ?? []).map((o) => `${eventId}/${o.name}`);
  if (paths.length) await db.storage.from(BUCKET_PUBLIC).remove(paths);
  if (imagePath) await db.storage.from(BUCKET_UPLOADS).remove([imagePath]);
}
