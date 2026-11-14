import Link from "next/link";
import { EventTable } from "@/components/admin/EventTable";
import { ButtonLink, Notice, PageHeader, buttonClass, statusMeta } from "@/components/admin/ui";
import { control } from "@/components/Forms";
import { cx } from "@/components/ui";
import { categories, categoryIds } from "@/content/calendar";
import { requireAdmin } from "@/lib/auth";
import { PAGE_SIZE, listEvents } from "@/lib/events/admin";
import { eventStatuses, type EventStatus } from "@/lib/events/types";
import { isValidPlainDate } from "@/lib/time";

type Search = Record<string, string | undefined>;

const titles: Partial<Record<EventStatus, string>> = { pending: "Pending Submissions", published: "Published Events" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const status = eventStatuses.includes(sp.status as EventStatus) ? (sp.status as EventStatus) : null;
  const cat = categoryIds.includes(sp.cat as never) ? sp.cat! : null;
  const when = sp.when === "upcoming" || sp.when === "past" ? sp.when : null;
  const from = sp.from && isValidPlainDate(sp.from) ? sp.from : null;
  const to = sp.to && isValidPlainDate(sp.to) ? sp.to : null;
  const q = (sp.q ?? "").slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);

  const { events, total } = await listEvents(supabase, { status, cat, when, from, to, q, page });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (change: Search) => {
    const p = new URLSearchParams();
    const merged = { status: status ?? undefined, cat: cat ?? undefined, when: when ?? undefined, from: from ?? undefined, to: to ?? undefined, q: q || undefined, ...change };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return `/admin/events${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title={status ? (titles[status] ?? `${statusMeta[status].label} Events`) : "All Events"} eyebrow="Calendar Management">
        <ButtonLink href="/admin/events/new">+ Add Event</ButtonLink>
      </PageHeader>

      {sp.deleted && (
        <div className="mb-5">
          <Notice tone="success">The event was deleted.</Notice>
        </div>
      )}

      <nav aria-label="Status" className="mb-5 flex flex-wrap gap-2">
        {[null, ...eventStatuses].map((s) => (
          <Link
            key={s ?? "all"}
            href={href({ status: s ?? undefined, page: undefined })}
            aria-current={status === s ? "true" : undefined}
            className={cx(
              "inline-flex min-h-9 items-center border px-3 text-[0.875rem]",
              status === s ? "border-ink bg-ink text-white" : "border-ink/20 bg-white hover:border-ink",
            )}
          >
            {s ? statusMeta[s].label : "All"}
          </Link>
        ))}
      </nav>

      <form method="get" className="mb-6 grid gap-3 border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="text-[0.8125rem] font-semibold">
          Search
          <input name="q" defaultValue={q} placeholder="Title, organizer or venue" className={cx(control, "mt-1 py-2")} />
        </label>
        <label className="text-[0.8125rem] font-semibold">
          Category
          <select name="cat" defaultValue={cat ?? ""} className={cx(control, "mt-1 py-2")}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="text-[0.8125rem] font-semibold">
          Timing
          <select name="when" defaultValue={when ?? ""} className={cx(control, "mt-1 py-2")}>
            <option value="">Any</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </label>
        <label className="text-[0.8125rem] font-semibold">
          From
          <input type="date" name="from" defaultValue={from ?? ""} className={cx(control, "mt-1 py-2")} />
        </label>
        <label className="text-[0.8125rem] font-semibold">
          To
          <input type="date" name="to" defaultValue={to ?? ""} className={cx(control, "mt-1 py-2")} />
        </label>
        <div className="flex gap-2">
          <button type="submit" className={buttonClass("primary")}>Filter</button>
          <Link href={href({ q: undefined, cat: undefined, when: undefined, from: undefined, to: undefined })} className={buttonClass("ghost")}>
            Clear
          </Link>
        </div>
      </form>

      <p className="mb-3 text-[0.875rem] text-muted">
        {total} event{total === 1 ? "" : "s"}
        {status === "pending" && " · oldest submissions first"}
      </p>

      {events.length ? (
        <EventTable events={events} showSubmitted={status === "pending"} />
      ) : (
        <div className="border border-dashed border-ink/30 bg-white px-6 py-10 text-center text-muted">
          {status === "pending" ? "No submissions are waiting for review." : "No events match these filters."}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center justify-between">
          {page > 1 ? <Link href={href({ page: String(page - 1) })} className={buttonClass("outline")}>Previous</Link> : <span />}
          <span className="text-[0.875rem] text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={href({ page: String(page + 1) })} className={buttonClass("outline")}>Next</Link> : <span />}
        </nav>
      )}
    </>
  );
}
