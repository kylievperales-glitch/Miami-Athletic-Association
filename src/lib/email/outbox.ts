import "server-only";
import type { OutboxEmail } from "@/lib/events/types";
import { createServiceClient, isServiceConfigured } from "@/lib/supabase/service";

/**
 * Email delivery through Resend (https://resend.com), from the outbox table.
 *
 * Emails are queued in the database in the same transaction as the change
 * that causes them. This worker then claims due rows, sends them, and records
 * the result. A failed send is retried with backoff (up to 6 attempts) and
 * can be retried by hand from the dashboard. Resend's Idempotency-Key header
 * (the outbox row id) stops a retried request from sending twice.
 */

const apiKey = process.env.RESEND_API_KEY ?? "";
const from = process.env.EMAIL_FROM ?? "";

export const isEmailConfigured = Boolean(apiKey && from && isServiceConfigured);

/** Comma-separated list of admin notification addresses. */
export const adminNotificationEmails = () =>
  (process.env.ADMIN_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
    .slice(0, 10);

async function sendOne(email: OutboxEmail): Promise<{ ok: true; id: string } | { ok: false; error: string; permanent: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `maa-outbox-${email.id}`,
      },
      body: JSON.stringify({
        from,
        to: email.to_emails,
        subject: email.subject,
        html: email.html,
        text: email.text_body,
        ...(email.reply_to ? { reply_to: email.reply_to } : {}),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (res.ok && body.id) return { ok: true, id: body.id };
    const permanent = res.status >= 400 && res.status < 500 && res.status !== 429 && res.status !== 409;
    return { ok: false, error: `${res.status} ${body.name ?? ""} ${body.message ?? ""}`.trim().slice(0, 500), permanent };
  } catch (e) {
    return { ok: false, error: (e instanceof Error ? e.message : String(e)).slice(0, 500), permanent: false };
  } finally {
    clearTimeout(timer);
  }
}

/** Send up to `limit` due emails. Safe to call concurrently. Never throws. */
export async function processOutbox(limit = 10): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };
  if (!isEmailConfigured) return result;
  try {
    const db = createServiceClient();
    const { data, error } = await db.rpc("claim_due_emails", { p_limit: limit });
    if (error) {
      console.error("[email] claim failed:", error.message);
      return result;
    }
    for (const email of (data ?? []) as OutboxEmail[]) {
      const sent = await sendOne(email);
      if (sent.ok) {
        result.sent++;
        await db
          .from("email_outbox")
          .update({ status: "sent", provider_message_id: sent.id, sent_at: new Date().toISOString(), last_error: null, locked_at: null })
          .eq("id", email.id);
      } else {
        result.failed++;
        console.error(`[email] ${email.kind} ${email.id} failed: ${sent.error}`);
        const backoffMinutes = Math.min(2 ** email.attempts * 2, 240);
        await db
          .from("email_outbox")
          .update({
            status: "failed",
            last_error: sent.error,
            locked_at: null,
            next_attempt_at: new Date(Date.now() + backoffMinutes * 60_000).toISOString(),
            ...(sent.permanent ? { attempts: 6 } : {}),
          })
          .eq("id", email.id);
      }
    }
  } catch (e) {
    console.error("[email] outbox processing error:", e);
  }
  return result;
}

/** Status of one queued email, looked up by its dedupe key. */
export async function emailStatus(dedupeKey: string): Promise<OutboxEmail["status"] | null> {
  if (!isServiceConfigured) return null;
  const { data } = await createServiceClient().from("email_outbox").select("status").eq("dedupe_key", dedupeKey).maybeSingle();
  return (data?.status as OutboxEmail["status"]) ?? null;
}
