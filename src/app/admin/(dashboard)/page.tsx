import Link from "next/link";
import { EventTable } from "@/components/admin/EventTable";
import { ButtonLink, Notice, PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email/outbox";
import { getStats, listEvents, listEmails } from "@/lib/events/admin";
import { formatMonthName, miamiToday, monthOf } from "@/lib/time";

export default async function Overview() {
  const { supabase, name } = await requireAdmin();
  const [stats, pending, failed] = await Promise.all([
    getStats(supabase),
    listEvents(supabase, { status: "pending", recent: true }),
    listEmails(supabase, "failed"),
  ]);
  const month = formatMonthName(monthOf(miamiToday()));

  const tiles = [
    { label: "Pending submissions", value: stats.pending, href: "/admin/events?status=pending", accent: "bg-sun" },
    { label: "Published events", value: stats.published, href: "/admin/events?status=published", accent: "bg-green" },
    { label: "Upcoming events", value: stats.upcoming, href: "/admin/events?status=published&when=upcoming", accent: "bg-blue" },
    { label: `Events in ${month}`, value: stats.thisMonth, href: "/calendar", accent: "bg-sky" },
  ];

  return (
    <>
      <PageHeader title="Overview" eyebrow={`Welcome, ${name.split(" ")[0]}`}>
        <ButtonLink href="/admin/events/new">+ Add Event</ButtonLink>
      </PageHeader>

      <div className="space-y-3">
        {!isEmailConfigured && (
          <Notice tone="warning">
            Email notifications are not connected yet, so no emails are being sent. See SETUP-CALENDAR.md, step 5.
          </Notice>
        )}
        {failed.length > 0 && (
          <Notice tone="error">
            {failed.length} email notification{failed.length > 1 ? "s" : ""} failed to send.{" "}
            <Link href="/admin/emails?status=failed" className="font-semibold underline underline-offset-2">
              Review and retry
            </Link>
          </Notice>
        )}
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="group block border border-line bg-white p-5 transition-colors hover:border-ink">
              <span aria-hidden="true" className={`block h-1 w-8 ${t.accent}`} />
              <span className="display mt-4 block text-[2.5rem] tabular-nums">{t.value}</span>
              <span className="mt-1 block text-[0.875rem] text-muted group-hover:text-ink">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Panel
          title="Most recent pending submissions"
          action={
            <Link href="/admin/events?status=pending" className="text-[0.875rem] font-semibold text-blue underline-offset-4 hover:underline">
              View all
            </Link>
          }
        >
          {pending.events.length ? (
            <EventTable events={pending.events.slice(0, 8)} showSubmitted />
          ) : (
            <p className="text-muted">No submissions are waiting for review.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
