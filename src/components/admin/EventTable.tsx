import Link from "next/link";
import { categoryById } from "@/content/calendar";
import type { AdminEvent } from "@/lib/events/types";
import { formatMediumDate, formatShortDate } from "@/lib/time";
import { StatusBadge } from "./ui";

const submitted = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) : "—";

export function eventDates(e: AdminEvent) {
  return e.start_date === e.end_date ? formatMediumDate(e.start_date) : `${formatShortDate(e.start_date)} – ${formatMediumDate(e.end_date)}`;
}

/** Events table on wide screens, stacked cards on phones. */
export function EventTable({ events, showSubmitted }: { events: AdminEvent[]; showSubmitted?: boolean }) {
  return (
    <>
      <div className="hidden overflow-x-auto border border-line bg-white md:block">
        <table className="w-full text-left text-[0.9rem]">
          <thead className="border-b border-ink">
            <tr className="label text-[0.6875rem] text-muted">
              <th scope="col" className="px-4 py-3 font-semibold">Event</th>
              <th scope="col" className="px-4 py-3 font-semibold">Date</th>
              <th scope="col" className="px-4 py-3 font-semibold">Category</th>
              <th scope="col" className="px-4 py-3 font-semibold">Organizer</th>
              {showSubmitted && <th scope="col" className="px-4 py-3 font-semibold">Submitted</th>}
              <th scope="col" className="px-4 py-3 font-semibold">Link</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0 hover:bg-paper">
                <td className="max-w-xs px-4 py-3">
                  <Link href={`/admin/events/${e.id}`} className="font-semibold text-ink underline-offset-4 hover:text-blue hover:underline">
                    {e.title}
                  </Link>
                  {e.source === "admin" && <span className="ml-2 text-[0.75rem] text-muted">Added by admin</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{eventDates(e)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className="size-2.5 shrink-0" style={{ background: categoryById(e.category).color }} />
                    {categoryById(e.category).short}
                  </span>
                </td>
                <td className="max-w-[12rem] truncate px-4 py-3">{e.organizer_name}</td>
                {showSubmitted && <td className="whitespace-nowrap px-4 py-3 text-muted">{submitted(e.submitted_at)}</td>}
                <td className="px-4 py-3">
                  <a href={e.event_url} target="_blank" rel="noopener noreferrer" className="text-blue underline underline-offset-2">
                    Verify<span className="sr-only"> {e.title} link (opens in a new tab)</span>
                  </a>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {events.map((e) => (
          <li key={e.id} className="border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/admin/events/${e.id}`} className="font-semibold underline-offset-4 hover:underline">
                {e.title}
              </Link>
              <StatusBadge status={e.status} />
            </div>
            <p className="mt-1.5 text-[0.875rem] text-muted">
              {eventDates(e)} · {categoryById(e.category).short} · {e.organizer_name}
            </p>
            {showSubmitted && <p className="mt-1 text-[0.8125rem] text-muted">Submitted {submitted(e.submitted_at)}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
