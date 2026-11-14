"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { adminNotificationEmails, emailStatus, isEmailConfigured, processOutbox } from "@/lib/email/outbox";
import { adminNewSubmission, submissionConfirmation } from "@/lib/email/templates";
import { inspectImage, validateEvent, type Errors } from "@/lib/events/validate";
import { siteUrl } from "@/lib/metadata";
import { clientIp, fingerprint, verifyTurnstile } from "@/lib/spam";
import { BUCKET_UPLOADS } from "@/lib/supabase/config";
import { createServiceClient, isServiceConfigured } from "@/lib/supabase/service";

export type SubmitState =
  | { status: "idle" }
  | { status: "invalid"; errors: Errors; message: string }
  | { status: "error"; message: string }
  | { status: "unavailable" }
  | { status: "success"; email: "sent" | "not-sent" | "unconfigured"; duplicate?: boolean };

const FIELDS = [
  "title", "description", "category", "startDate", "startTime", "endDate", "endTime", "allDay", "isOnline",
  "venueName", "streetAddress", "city", "state", "postalCode", "eventUrl", "admissionType", "admissionPrice",
  "organizerName", "contactName", "contactEmail", "contactPhone", "accuracy", "newsletter",
];

const MIN_FILL_MS = 4000;

/** Public event submission. Everything here is re-checked regardless of what the browser did. */
export async function submitEvent(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  if (!isServiceConfigured) return { status: "unavailable" };

  // Bot checks
  if (String(formData.get("company_website") ?? "") !== "") {
    return { status: "error", message: "We couldn't accept this submission. Please try again." };
  }
  const startedAt = Number(formData.get("startedAt"));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "error", message: "That was quick! Please review your details and submit again." };
  }
  // Validate
  const values = Object.fromEntries(FIELDS.map((k) => [k, String(formData.get(k) ?? "")]));
  const { errors, parsed } = validateEvent(values, "public");

  const image = formData.get("image");
  let imageCheck: Awaited<ReturnType<typeof inspectImage>> | null = null;
  if (image instanceof File && image.size > 0) {
    imageCheck = await inspectImage(image);
    if (!imageCheck.ok) errors.image = imageCheck.error;
  }
  if (!parsed || Object.keys(errors).length) {
    return { status: "invalid", errors, message: "Please correct the highlighted fields." };
  }

  const ip = await clientIp();
  if (!(await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip))) {
    return { status: "error", message: "Please complete the verification check and submit again." };
  }

  const db = createServiceClient();
  const fp = fingerprint(ip);
  const [perIp, overall] = await Promise.all([
    db.rpc("hit_rate_limit", { p_key: `submit:${fp}`, p_window_seconds: 3600, p_max: 5 }),
    db.rpc("hit_rate_limit", { p_key: "submit:all", p_window_seconds: 3600, p_max: 120 }),
  ]);
  if (perIp.error || overall.error) {
    console.error("[submit] rate limit check failed:", perIp.error?.message ?? overall.error?.message);
    return { status: "error", message: "Something went wrong on our side. Please try again in a few minutes." };
  }
  if (!perIp.data || !overall.data) {
    return { status: "error", message: "We've received several submissions from your connection recently. Please try again later." };
  }

  const submissionKey = String(formData.get("submissionKey") ?? "").slice(0, 64) || randomUUID();
  const eventId = randomUUID();

  // Image goes to the private bucket only.
  let imagePath: string | null = null;
  if (image instanceof File && imageCheck?.ok) {
    imagePath = `submissions/${eventId}.${imageCheck.ext}`;
    const { error } = await db.storage.from(BUCKET_UPLOADS).upload(imagePath, image, { contentType: imageCheck.type, upsert: false });
    if (error) {
      console.error("[submit] image upload failed:", error.message);
      return { status: "invalid", errors: { image: "We couldn't upload that image. Try another file, or submit without one." }, message: "Please correct the highlighted fields." };
    }
  }

  const { event, contact } = parsed;
  const emails = [];
  if (isEmailConfigured && contact.contact_email) {
    emails.push(submissionConfirmation({ to: contact.contact_email, contactName: contact.contact_name, title: event.title, siteUrl }));
  }
  const adminTo = adminNotificationEmails();
  if (isEmailConfigured && adminTo.length) {
    emails.push(
      adminNewSubmission({
        to: adminTo,
        event,
        contactName: contact.contact_name,
        contactEmail: contact.contact_email,
        reviewUrl: `${siteUrl}/admin/events/${eventId}`,
        siteUrl,
      }),
    );
  }

  const { data, error } = await db.rpc("submit_public_event", {
    p_event: { ...event, id: eventId, image_path: imagePath },
    p_private: { ...contact, newsletter_consent: parsed.newsletter, submission_key: submissionKey, submitter_fingerprint: fp },
    p_emails: emails,
  });

  if (error || !data) {
    console.error("[submit] insert failed:", error?.message);
    if (imagePath) await db.storage.from(BUCKET_UPLOADS).remove([imagePath]);
    return { status: "error", message: "Something went wrong saving your submission. Please try again." };
  }

  const result = data as { result: "created" | "duplicate"; id: string };
  if (result.result === "duplicate") {
    if (imagePath) await db.storage.from(BUCKET_UPLOADS).remove([imagePath]);
    return { status: "success", email: "not-sent", duplicate: true };
  }

  revalidatePath("/admin", "layout");

  if (!isEmailConfigured) return { status: "success", email: "unconfigured" };

  // Send now so the visitor is told accurately whether the confirmation went out.
  await Promise.race([processOutbox(5), new Promise((r) => setTimeout(r, 8000))]);
  const status = await emailStatus(`submission_confirmation:${result.id}`);
  after(() => processOutbox(10));
  return { status: "success", email: status === "sent" ? "sent" : "not-sent" };
}
