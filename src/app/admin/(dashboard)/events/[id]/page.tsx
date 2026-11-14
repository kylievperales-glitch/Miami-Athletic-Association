import Link from "next/link";
import { notFound } from "next/navigation";
import { approveEvent, deleteEvent, rejectEvent, retryEmail, setEventStatus } from "@/app/admin/actions";
import { ActionButton, ConfirmAction } from "@/components/admin/ActionForm";
import { EmailBadge, Notice, PageHeader, Panel, StatusBadge, buttonClass, emailKindLabel } from "@/components/admin/ui";
import { CategoryTag } from "@/components/calendar/EventVisual";
import { control } from "@/components/Forms";
import { admissionLabel, categoryById, organizerTypes } from "@/content/calendar";
import { requireAdmin } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email/outbox";
import { getAudit, getEvent, getEventEmails, signedImageUrl } from "@/lib/events/admin";
import { fullAddress, fullSchedule } from "@/lib/events/schedule";
import { publicImageUrl } from "@/lib/supabase/config";

const stamp = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) + " ET"
    : "—";

const savedMessages: Record<string, string> = {
  published: "Event created and published. It is now live on the public calendar.",
  draft: "Event saved as a draft. It is not visible on the public calendar until you publish it.",
  edited: "Changes saved.",
};

const actionLabels: Record<string, string> = {
  submitted: "Submitted through the website",
  created: "Created in the dashboard",
  edited: "Edited",
  published: "Approved & published",
  rejected: "Rejected",
  unpublished: "Unpublished",
  archived: "Archived",
  moved_to_draft: "Moved to drafts",
  returned_to_pending: "Returned to pending review",
};

const fieldLabels: Record<string, string> = {
  title: "Title", description: "Description", category: "Category", all_day: "All-day", starts_at: "Start", ends_at: "End",
  start_date: "Start date", end_date: "End date", is_online: "Online", venue_name: "Venue", street_address: "Street address",
  city: "City", state: "State", postal_code: "ZIP code", organizer_name: "Organizer", organizer_type: "Organizer type",
  event_url: "Event link", admission_type: "Admission", admission_price: "Price", image_path: "Image", status: "Status",
  rejection_reason: "Rejection reason",
};

function show(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "category") return categoryById(String(value)).label;
  if (key === "admission_type") return admissionLabel(String(value));
  if (key === "starts_at" || key === "ends_at") return stamp(String(value));
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-[0.8125rem] font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-[0.9375rem]">{children}</dd>
    </div>
  );
}

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  const event = await getEvent(supabase, id);
  if (!event) notFound();
  const [audit, emails, imageUrl] = await Promise.all([getAudit(supabase, id), getEventEmails(supabase, id), signedImageUrl(event.image_path)]);

  const p = event.event_private;
  const schedule = fullSchedule(event);
  const fromPublic = event.source === "public_submission";
  const original = p?.original_submission ?? null;
  const changed = original
    ? Object.keys(fieldLabels).filter((k) => k !== "status" && k !== "rejection_reason" && k in original && JSON.stringify(original[k]) !== JSON.stringify((event as Record<string, unknown>)[k]))
    : [];
  const willEmail = isEmailConfigured && fromPublic && Boolean(p?.contact_email);
  const idField = { id: event.id };

  return (
    <>
      <p className="mb-4 text-[0.875rem]">
        <Link href={event.status === "pending" ? "/admin/events?status=pending" : "/admin/events"} className="text-blue underline-offset-4 hover:underline">
          ← Back to {event.status === "pending" ? "pending submissions" : "events"}
        </Link>
      </p>
      <PageHeader title={event.title} eyebrow={fromPublic ? "Public submission" : "Added in the dashboard"}>
        <StatusBadge status={event.status} />
      </PageHeader>

      {saved && savedMessages[saved] && (
        <div className="mb-6">
          <Notice tone="success">{savedMessages[saved]}</Notice>
        </div>
      )}

      {/* Actions */}
      <section aria-label="Actions" className="mb-8 border border-ink bg-white p-5">
        <div className="flex flex-wrap items-start gap-3">
          {(event.status === "pending" || event.status === "draft" || event.status === "archived" || event.status === "rejected") && (
            <ActionButton action={approveEvent} fields={idField} variant="green" pendingLabel="Publishing…">
              {event.status === "pending" ? "Approve & Publish" : "Publish"}
            </ActionButton>
          )}
          <Link href={`/admin/events/${event.id}/edit`} className={buttonClass("outline")}>
            Edit Details
          </Link>
          {(event.status === "pending" || event.status === "draft") && (
            <ConfirmAction
              action={rejectEvent}
              fields={idField}
              trigger={event.status === "pending" ? "Reject Submission" : "Reject"}
              title="Reject this submission?"
              confirmLabel="Reject Submission"
              body={
                <>
                  The event will stay off the public calendar.
                  {willEmail ? " The submitter will receive a short, neutral email letting them know." : " No email will be sent."}
                </>
              }
              extra={
                <div className="space-y-3">
                  <label className="block text-[0.875rem] font-semibold">
                    Reason <span className="font-normal text-muted">(optional, for the record)</span>
                    <textarea name="reason" rows={3} maxLength={1000} className={`${control} mt-1`} />
                  </label>
                  {willEmail && (
                    <label className="flex items-start gap-2 text-[0.875rem]">
                      <input type="checkbox" name="includeReason" className="mt-0.5 size-4 accent-blue" />
                      Include this reason in the email to the submitter
                    </label>
                  )}
                </div>
              }
            />
          )}
          {event.status === "published" && (
            <>
              <Link href={`/calendar/events/${event.id}`} target="_blank" className={buttonClass("outline")}>
                View on Calendar ↗
              </Link>
              <ConfirmAction
                action={setEventStatus}
                fields={{ ...idField, status: "draft" }}
                trigger="Unpublish"
                triggerVariant="outline"
                title="Unpublish this event?"
                confirmLabel="Unpublish"
                body="It will be removed from the public calendar right away and kept as a draft. You can publish it again later."
              />
            </>
          )}
          {event.status !== "archived" && event.status !== "pending" && (
            <ConfirmAction
              action={setEventStatus}
              fields={{ ...idField, status: "archived" }}
              trigger="Archive"
              triggerVariant="outline"
              title="Archive this event?"
              confirmLabel="Archive"
              body="Archived events are hidden from the public calendar and kept for your records. You can restore them later."
            />
          )}
          {event.status === "archived" && (
            <ActionButton action={setEventStatus} fields={{ ...idField, status: "draft" }}>
              Restore to Drafts
            </ActionButton>
          )}
          {(event.status === "rejected" || event.status === "draft" || event.status === "archived") && (
            <ConfirmAction
              action={deleteEvent}
              fields={idField}
              trigger="Delete"
              title="Delete this event permanently?"
              confirmLabel="Delete Permanently"
              body="The event, its contact details and its image will be removed. This cannot be undone. Archiving keeps a record instead."
            />
          )}
        </div>
        {event.status === "pending" && (
          <p className="mt-4 text-[0.875rem] text-muted">
            Check the{" "}
            <a href={event.event_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue underline">
              event link
            </a>{" "}
            before approving. Approving publishes the event exactly as shown below{willEmail ? " and emails the submitter" : ""}.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel title="Event">
            <dl>
              <Row label="Title">{event.title}</Row>
              <Row label="Category"><CategoryTag category={event.category} /></Row>
              <Row label="Date">{schedule.date}</Row>
              <Row label="Time">{schedule.time}</Row>
              <Row label="Location">
                {event.is_online ? "Online event" : (
                  <>
                    {event.venue_name}
                    <br />
                    {fullAddress(event)}
                  </>
                )}
              </Row>
              <Row label="Organizer">
                {event.organizer_name}
                <span className="text-muted"> · {organizerTypes.find((o) => o.id === event.organizer_type)?.label}</span>
              </Row>
              <Row label="Event link">
                <a href={event.event_url} target="_blank" rel="noopener noreferrer" className="text-blue underline underline-offset-2">
                  {event.event_url}
                </a>
              </Row>
              <Row label="Admission">
                {admissionLabel(event.admission_type)}
                {event.admission_price && ` · ${event.admission_price}`}
              </Row>
              <Row label="Description"><p className="whitespace-pre-line">{event.description}</p></Row>
              <Row label="Image">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL to a private file
                  <img src={imageUrl} alt="Submitted event image" className="max-h-64 w-auto border border-line" />
                ) : (
                  <span className="text-muted">None. The listing uses the category graphic.</span>
                )}
                {event.public_image_path && (
                  <p className="mt-1 text-[0.8125rem] text-muted">
                    Public copy: <a className="underline" href={publicImageUrl(event.public_image_path) ?? "#"} target="_blank" rel="noopener noreferrer">open</a>
                  </p>
                )}
              </Row>
            </dl>
          </Panel>

          {changed.length > 0 && (
            <Panel title="Changes since submission">
              <ul className="space-y-3 text-[0.9375rem]">
                {changed.map((k) => (
                  <li key={k}>
                    <span className="font-semibold">{fieldLabels[k]}</span>
                    <span className="block text-muted">
                      Originally: <span className="whitespace-pre-line">{show(k, original![k]).slice(0, 400)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="History">
            <ol className="space-y-3 text-[0.9375rem]">
              {audit.map((a) => (
                <li key={a.id} className="border-l-2 border-line pl-3">
                  <span className="font-semibold">{actionLabels[a.action] ?? a.action}</span>
                  <span className="text-muted"> · {a.actor_label} · {stamp(a.created_at)}</span>
                  {a.action === "edited" && a.changes && (
                    <span className="block text-[0.8125rem] text-muted">
                      Changed: {Object.keys(a.changes).map((k) => fieldLabels[k] ?? k).join(", ")}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Submitter (private)">
            {p ? (
              <dl className="space-y-3 text-[0.9375rem]">
                <div><dt className="text-[0.8125rem] text-muted">Contact</dt><dd>{p.contact_name ?? "—"}</dd></div>
                <div>
                  <dt className="text-[0.8125rem] text-muted">Email</dt>
                  <dd className="break-all">{p.contact_email ? <a href={`mailto:${p.contact_email}`} className="text-blue underline">{p.contact_email}</a> : "—"}</dd>
                </div>
                <div><dt className="text-[0.8125rem] text-muted">Phone</dt><dd>{p.contact_phone ?? "—"}</dd></div>
                {fromPublic && (
                  <>
                    <div><dt className="text-[0.8125rem] text-muted">Accuracy confirmed</dt><dd>{stamp(p.accuracy_confirmed_at)}</dd></div>
                    <div>
                      <dt className="text-[0.8125rem] text-muted">Newsletter consent</dt>
                      <dd>{p.newsletter_consent ? `Yes · ${stamp(p.newsletter_consent_at)}` : "No"}</dd>
                    </div>
                  </>
                )}
              </dl>
            ) : (
              <p className="text-[0.9375rem] text-muted">No contact details on file.</p>
            )}
          </Panel>

          <Panel title="Record">
            <dl className="space-y-3 text-[0.875rem]">
              <div><dt className="text-muted">Submitted</dt><dd>{stamp(event.submitted_at ?? event.created_at)}</dd></div>
              {event.approved_at && <div><dt className="text-muted">First approved</dt><dd>{stamp(event.approved_at)}</dd></div>}
              {event.rejected_at && <div><dt className="text-muted">Rejected</dt><dd>{stamp(event.rejected_at)}</dd></div>}
              {event.rejection_reason && <div><dt className="text-muted">Rejection reason (private)</dt><dd className="whitespace-pre-line">{event.rejection_reason}</dd></div>}
              <div><dt className="text-muted">Last updated</dt><dd>{stamp(event.updated_at)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Emails">
            {emails.length ? (
              <ul className="space-y-3 text-[0.875rem]">
                {emails.map((m) => (
                  <li key={m.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{emailKindLabel[m.kind]}</span>
                      <EmailBadge status={m.status} />
                    </div>
                    <p className="break-all text-muted">To {m.to_emails.join(", ")}</p>
                    {m.sent_at && <p className="text-muted">Sent {stamp(m.sent_at)}</p>}
                    {m.status === "failed" && (
                      <>
                        <p className="text-[#8c1d18]">{m.last_error}</p>
                        <ActionButton action={retryEmail} fields={{ id: m.id }} className="mt-2" pendingLabel="Retrying…">Retry</ActionButton>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.875rem] text-muted">{isEmailConfigured ? "No emails for this event yet." : "Email isn't connected yet, so no emails are sent."}</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
