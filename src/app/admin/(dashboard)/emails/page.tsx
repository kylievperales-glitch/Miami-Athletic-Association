import Link from "next/link";
import { retryEmail, sendQueuedEmails } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ActionForm";
import { EmailBadge, Notice, PageHeader, emailKindLabel } from "@/components/admin/ui";
import { cx } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { adminNotificationEmails, isEmailConfigured } from "@/lib/email/outbox";
import { listEmails } from "@/lib/events/admin";

const stamp = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "—";

const filters = [null, "pending", "sent", "failed"] as const;

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const { status: raw } = await searchParams;
  const status = filters.includes(raw as never) ? (raw as string) : null;
  const emails = await listEmails(supabase, status);
  const admins = adminNotificationEmails();

  return (
    <>
      <PageHeader title="Email Notifications" eyebrow="Calendar Management">
        {isEmailConfigured && (
          <ActionButton action={sendQueuedEmails} fields={{}} variant="outline" pendingLabel="Sending…">
            Send Queued Emails Now
          </ActionButton>
        )}
      </PageHeader>

      <div className="mb-6 space-y-3">
        {isEmailConfigured ? (
          <Notice tone="info">
            Emails are sent through Resend. Failed emails are retried automatically a few times, and you can retry any of them here.
          </Notice>
        ) : (
          <Notice tone="warning">Email isn&apos;t connected yet, so nothing is being sent. See SETUP-CALENDAR.md, step 5.</Notice>
        )}
        <Notice tone={admins.length ? "info" : "warning"}>
          New-submission alerts go to: {admins.length ? admins.join(", ") : "nobody yet (set ADMIN_NOTIFICATION_EMAILS)"}.
        </Notice>
      </div>

      <nav aria-label="Status" className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f ?? "all"}
            href={f ? `/admin/emails?status=${f}` : "/admin/emails"}
            aria-current={status === f ? "true" : undefined}
            className={cx("inline-flex min-h-9 items-center border px-3 text-[0.875rem] capitalize", status === f ? "border-ink bg-ink text-white" : "border-ink/20 bg-white hover:border-ink")}
          >
            {f ?? "All"}
          </Link>
        ))}
      </nav>

      {emails.length ? (
        <ul className="divide-y divide-line border border-line bg-white">
          {emails.map((m) => (
            <li key={m.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <EmailBadge status={m.status} />
                  <span className="font-semibold">{emailKindLabel[m.kind]}</span>
                </div>
                <p className="mt-1 truncate text-[0.9375rem]">{m.subject}</p>
                <p className="break-all text-[0.8125rem] text-muted">
                  To {m.to_emails.join(", ")} · queued {stamp(m.created_at)}
                  {m.sent_at && ` · sent ${stamp(m.sent_at)}`} · {m.attempts} attempt{m.attempts === 1 ? "" : "s"}
                </p>
                {m.last_error && m.status !== "sent" && <p className="mt-1 text-[0.8125rem] text-[#8c1d18]">{m.last_error}</p>}
                {m.event_id && (
                  <Link href={`/admin/events/${m.event_id}`} className="mt-1 inline-block text-[0.8125rem] text-blue underline">
                    View event
                  </Link>
                )}
              </div>
              {m.status === "failed" && (
                <ActionButton action={retryEmail} fields={{ id: m.id }} pendingLabel="Retrying…">
                  Retry
                </ActionButton>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="border border-dashed border-ink/30 bg-white px-6 py-10 text-center text-muted">No emails yet.</div>
      )}
    </>
  );
}
