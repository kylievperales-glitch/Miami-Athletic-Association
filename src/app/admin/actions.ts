"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isEmailConfigured, processOutbox } from "@/lib/email/outbox";
import { eventApproved, eventRejected } from "@/lib/email/templates";
import { getEvent, removeAllImages, syncPublicImage } from "@/lib/events/admin";
import type { EventStatus } from "@/lib/events/types";
import { clean, inspectImage, isEmail, validateEvent, type Errors } from "@/lib/events/validate";
import { siteUrl } from "@/lib/metadata";
import { BUCKET_UPLOADS, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type FormState = { ok?: boolean; message?: string; errors?: Errors };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every page that shows event data. */
function refresh(eventId?: string) {
  revalidatePath("/calendar", "layout");
  revalidatePath("/admin", "layout");
  if (eventId) revalidatePath(`/calendar/events/${eventId}`);
}

const safeNext = (value: FormDataEntryValue | null) => {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/admin") && !v.startsWith("//") && !v.includes("\\") ? v : "/admin";
};

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { message: "The dashboard isn't connected to Supabase yet." };
  const email = clean(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!isEmail(email) || !password) return { message: "Please enter your email address and password." };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { message: "That email and password combination wasn't recognized." };

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { message: "This account doesn't have access to the MAA dashboard." };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { message: "The dashboard isn't connected to Supabase yet." };
  const email = clean(formData.get("email")).toLowerCase();
  if (!isEmail(email)) return { message: "Please enter a valid email address." };
  const supabase = await createSessionClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/admin/auth/confirm?next=/admin/account`,
  });
  // Same answer whether or not the account exists.
  return { ok: true, message: "If that address belongs to a dashboard account, a password reset link is on its way." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 12) return { errors: { password: "Use at least 12 characters." } };
  if (password !== confirm) return { errors: { confirm: "The passwords don't match." } };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { message: error.message };
  return { ok: true, message: "Your password has been updated." };
}

/* -------------------------------------------------------------------------- */
/* Create and edit                                                            */
/* -------------------------------------------------------------------------- */

const EVENT_FIELDS = [
  "title", "description", "category", "startDate", "startTime", "endDate", "endTime", "allDay", "isOnline",
  "venueName", "streetAddress", "city", "state", "postalCode", "eventUrl", "admissionType", "admissionPrice",
  "organizerName", "organizerType", "contactName", "contactEmail", "contactPhone",
];

async function uploadAdminImage(eventId: string, formData: FormData): Promise<{ path?: string | null; error?: string }> {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) return {};
  const check = await inspectImage(image);
  if (!check.ok) return { error: check.error };
  const path = `admin/${eventId}-${Date.now()}.${check.ext}`;
  const { error } = await createServiceClient().storage.from(BUCKET_UPLOADS).upload(path, image, { contentType: check.type });
  if (error) return { error: "The image couldn't be uploaded. Please try another file." };
  return { path };
}

export async function createEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const values = Object.fromEntries(EVENT_FIELDS.map((k) => [k, String(formData.get(k) ?? "")]));
  const { errors, parsed } = validateEvent(values, "admin");
  if (!parsed || Object.keys(errors).length) return { errors, message: "Please correct the highlighted fields." };

  const publish = formData.get("intent") === "publish";
  const id = crypto.randomUUID();
  const upload = await uploadAdminImage(id, formData);
  if (upload.error) return { errors: { image: upload.error }, message: "Please correct the highlighted fields." };

  const { error } = await supabase.from("events").insert({
    id,
    ...parsed.event,
    organizer_type: parsed.organizerType,
    status: "draft",
    source: "admin",
    image_path: upload.path ?? null,
  });
  if (error) {
    if (upload.path) await createServiceClient().storage.from(BUCKET_UPLOADS).remove([upload.path]);
    console.error("[admin] create failed:", error.message);
    return { message: "The event couldn't be saved. Please try again." };
  }

  const c = parsed.contact;
  if (c.contact_name || c.contact_email || c.contact_phone) {
    await supabase.from("event_private").insert({ event_id: id, ...c });
  }

  if (publish) {
    const { error: pubErr } = await supabase.rpc("approve_event", { p_event_id: id });
    if (pubErr) console.error("[admin] publish failed:", pubErr.message);
    await syncPublicImage(id);
  }

  refresh(id);
  redirect(`/admin/events/${id}?saved=${publish ? "published" : "draft"}`);
}

export async function updateEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return { message: "Unknown event." };

  const values = Object.fromEntries(EVENT_FIELDS.map((k) => [k, String(formData.get(k) ?? "")]));
  const { errors, parsed } = validateEvent(values, "admin");
  if (!parsed || Object.keys(errors).length) return { errors, message: "Please correct the highlighted fields." };

  const current = await getEvent(supabase, id);
  if (!current) return { message: "This event no longer exists." };
  // Optimistic concurrency: refuse to overwrite someone else's newer edit.
  if (String(formData.get("updatedAt") ?? "") !== current.updated_at) {
    return { message: "Someone else changed this event while you were editing. Reload the page to see their changes, then edit again." };
  }

  const upload = await uploadAdminImage(id, formData);
  if (upload.error) return { errors: { image: upload.error }, message: "Please correct the highlighted fields." };
  const removeImage = formData.get("removeImage") === "on";
  const nextImage = upload.path ?? (removeImage ? null : current.image_path);

  const { data: updated, error } = await supabase
    .from("events")
    .update({ ...parsed.event, organizer_type: parsed.organizerType, image_path: nextImage })
    .eq("id", id)
    .eq("updated_at", current.updated_at)
    .select("id");
  if (error || !updated?.length) {
    if (upload.path) await createServiceClient().storage.from(BUCKET_UPLOADS).remove([upload.path]);
    if (error) console.error("[admin] update failed:", error.message);
    return { message: error ? "The changes couldn't be saved. Please try again." : "Someone else changed this event while you were editing. Reload and try again." };
  }

  if (current.image_path && current.image_path !== nextImage) {
    await createServiceClient().storage.from(BUCKET_UPLOADS).remove([current.image_path]);
  }

  const c = parsed.contact;
  if (current.event_private) {
    await supabase.from("event_private").update(c).eq("event_id", id);
  } else if (c.contact_name || c.contact_email || c.contact_phone) {
    await supabase.from("event_private").insert({ event_id: id, ...c });
  }

  await syncPublicImage(id);
  refresh(id);
  redirect(`/admin/events/${id}?saved=edited`);
}

/* -------------------------------------------------------------------------- */
/* Moderation                                                                 */
/* -------------------------------------------------------------------------- */

type RpcResult = { result: "ok" | "noop" | "invalid" | "not_found"; status?: EventStatus };

export async function approveEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const event = await getEvent(supabase, id);
  if (!event) return { message: "This event no longer exists." };

  // Notify the submitter of a public submission, when email is set up.
  const to = event.event_private?.contact_email;
  const email =
    isEmailConfigured && event.source === "public_submission" && to
      ? eventApproved({
          to,
          contactName: event.event_private?.contact_name ?? null,
          title: event.title,
          publicUrl: `${siteUrl}/calendar/events/${id}`,
          siteUrl,
        })
      : null;

  const { data, error } = await supabase.rpc("approve_event", { p_event_id: id, p_email: email });
  if (error) {
    console.error("[admin] approve failed:", error.message);
    return { message: "The event couldn't be published. Please try again." };
  }
  const r = data as RpcResult;
  if (r.result === "not_found") return { message: "This event no longer exists." };

  await syncPublicImage(id);
  refresh(id);
  after(() => processOutbox(10));
  return {
    ok: true,
    message: r.result === "noop" ? "This event was already published." : "Published. The event is now live on the public calendar.",
  };
}

export async function rejectEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = clean(formData.get("reason"), true).slice(0, 1000) || null;
  const includeReason = formData.get("includeReason") === "on";
  const event = await getEvent(supabase, id);
  if (!event) return { message: "This event no longer exists." };

  const to = event.event_private?.contact_email;
  const email =
    isEmailConfigured && event.source === "public_submission" && to
      ? eventRejected({
          to,
          contactName: event.event_private?.contact_name ?? null,
          title: event.title,
          reason: includeReason ? reason : null,
          siteUrl,
        })
      : null;

  const { data, error } = await supabase.rpc("reject_event", { p_event_id: id, p_reason: reason, p_email: email });
  if (error) {
    console.error("[admin] reject failed:", error.message);
    return { message: "The submission couldn't be rejected. Please try again." };
  }
  const r = data as RpcResult;
  if (r.result === "invalid") return { message: "Only pending or draft events can be rejected. Unpublish or archive published events instead." };
  if (r.result === "not_found") return { message: "This event no longer exists." };

  await syncPublicImage(id);
  refresh(id);
  after(() => processOutbox(10));
  return { ok: true, message: r.result === "noop" ? "This submission was already rejected." : "Rejected. The event will not appear on the calendar." };
}

export async function setEventStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["draft", "archived", "pending"].includes(status)) return { message: "Unsupported status." };
  const { data, error } = await supabase.rpc("set_event_status", { p_event_id: id, p_status: status });
  if (error) {
    console.error("[admin] status change failed:", error.message);
    return { message: "The status couldn't be changed. Please try again." };
  }
  await syncPublicImage(id);
  refresh(id);
  const r = data as RpcResult;
  const label = status === "draft" ? "moved to drafts" : status === "archived" ? "archived" : "returned to pending review";
  return { ok: true, message: r.result === "noop" ? "No change was needed." : `The event was ${label}. It is not shown on the public calendar.` };
}

export async function deleteEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const event = await getEvent(supabase, id);
  if (!event) redirect("/admin/events");
  if (event.status === "published" || event.status === "pending") {
    return { message: "Unpublish, archive or reject this event before deleting it." };
  }
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    console.error("[admin] delete failed:", error.message);
    return { message: "The event couldn't be deleted. Please try again." };
  }
  await removeAllImages(id, event.image_path);
  refresh(id);
  redirect("/admin/events?deleted=1");
}

/* -------------------------------------------------------------------------- */
/* Email                                                                      */
/* -------------------------------------------------------------------------- */

export async function retryEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.rpc("retry_email", { p_email_id: id });
  if (error) return { message: "The email couldn't be queued again." };
  const result = await processOutbox(10);
  revalidatePath("/admin", "layout");
  return { ok: true, message: result.sent ? "Sent." : "Queued again. If it fails, check the error shown." };
}

export async function sendQueuedEmails(): Promise<FormState> {
  await requireAdmin();
  const result = await processOutbox(25);
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${result.sent} sent, ${result.failed} failed.` };
}
