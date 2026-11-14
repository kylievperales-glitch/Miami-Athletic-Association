import Link from "next/link";
import { calendarCopy, categories, categoryById, organizerFilters } from "@/content/calendar";
import { calendarHref, type CalendarState } from "@/lib/events/calendarUrl";
import { cellTime, eventsOn, locationLine, occursOn, timeOnDay } from "@/lib/events/schedule";
import type { PublicEvent } from "@/lib/events/types";
import {
  addDays,
  addMonths,
  formatLongDate,
  formatMonthYear,
  formatShortDate,
  lastOfMonth,
  firstOfMonth,
  monthGrid,
  monthOf,
  type PlainDate,
} from "@/lib/time";
import { Arrow, cx } from "@/components/ui";
import { CategoryTag, EventVisual } from "./EventVisual";

const WEEKDAYS = [
  ["Sun", "Sunday"],
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
];

const MAX_PREVIEWS = 3;

type Props = {
  state: CalendarState;
  events: PublicEvent[];
  today: PlainDate;
  notice?: string | null;
};

export const eventHref = (e: PublicEvent) => `/calendar/events/${e.id}`;

/* -------------------------------------------------------------------------- */
/* Toolbar: month navigation and filters                                      */
/* -------------------------------------------------------------------------- */

function NavButton({ href, label, children, className }: { href: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      className={cx(
        "inline-flex min-h-11 min-w-11 items-center justify-center border border-ink/25 px-3 font-display text-[0.875rem] font-semibold transition-colors [font-stretch:106%] hover:border-ink hover:bg-ink hover:text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function Chip({ href, active, children, swatch }: { href: string; active: boolean; children: React.ReactNode; swatch?: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cx(
        "inline-flex min-h-10 shrink-0 items-center gap-2 border px-3.5 text-[0.875rem] font-medium transition-colors",
        active ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink hover:border-ink",
      )}
    >
      {swatch && <span aria-hidden="true" className="size-2.5 ring-1 ring-white/40" style={{ background: swatch }} />}
      {children}
    </Link>
  );
}

function Filters({ state }: { state: CalendarState }) {
  return (
    <div className="space-y-3">
      <nav aria-label="Filter by category" className="-mx-[clamp(1.25rem,4vw,3.5rem)] overflow-x-auto px-[clamp(1.25rem,4vw,3.5rem)] pb-1 md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex gap-2 md:flex-wrap">
          <li>
            <Chip href={calendarHref(state, { cat: null })} active={!state.cat}>
              All Events
            </Chip>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Chip href={calendarHref(state, { cat: c.id })} active={state.cat === c.id} swatch={c.color}>
                {c.label}
              </Chip>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Filter by organizer">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {organizerFilters.map((o) => {
            const value = o.id === "all" ? null : o.id;
            const active = state.org === value;
            return (
              <li key={o.id}>
                <Link
                  href={calendarHref(state, { org: value })}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={cx(
                    "inline-flex min-h-10 items-center text-[0.9rem] underline-offset-4",
                    active ? "font-semibold text-ink underline decoration-green decoration-2" : "text-muted hover:text-ink hover:underline",
                  )}
                >
                  {o.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Month view                                                                 */
/* -------------------------------------------------------------------------- */

function MonthGrid({ state, events, today }: Props) {
  const weeks = monthGrid(state.month);
  return (
    <table className="w-full table-fixed border-collapse">
      <caption className="sr-only">{formatMonthYear(state.month)}. Select a date to see its events.</caption>
      <thead>
        <tr>
          {WEEKDAYS.map(([short, long]) => (
            <th key={long} scope="col" className="label border-b border-ink pb-2.5 text-left font-semibold text-muted">
              <abbr title={long} className="no-underline">
                <span className="md:hidden">{short.charAt(0)}</span>
                <span className="hidden md:inline">{short}</span>
              </abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]}>
            {week.map((day) => {
              const inMonth = monthOf(day) === state.month;
              const dayEvents = eventsOn(events, day);
              const isToday = day === today;
              const overflow = dayEvents.length > MAX_PREVIEWS;
              const shown = overflow ? dayEvents.slice(0, MAX_PREVIEWS - 1) : dayEvents;
              const dayLink = calendarHref(state, { day });
              const label = `${formatLongDate(day)}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ", no events"}${isToday ? ", today" : ""}`;
              return (
                <td
                  key={day}
                  className={cx(
                    "group/day relative h-16 border-b border-r border-line align-top first:border-l md:h-36",
                    inMonth ? "bg-white" : "bg-paper/70",
                  )}
                >
                  {/* The whole cell opens the day view; event previews sit above this link. */}
                  <Link
                    href={dayLink}
                    scroll={false}
                    aria-label={label}
                    className="absolute inset-0 z-0 transition-colors hover:bg-paper focus-visible:z-20"
                  />
                  <div className="pointer-events-none relative z-10 flex h-full flex-col p-1.5 md:p-2">
                    <span
                      aria-hidden="true"
                      className={cx(
                        "inline-flex size-7 items-center justify-center self-start font-display text-[0.875rem] font-semibold [font-stretch:106%] md:size-8",
                        isToday ? "bg-blue text-white" : inMonth ? "text-ink" : "text-muted/70",
                      )}
                    >
                      {Number(day.slice(8))}
                    </span>

                    {/* Phone: dots */}
                    {dayEvents.length > 0 && (
                      <span aria-hidden="true" className="mt-auto flex flex-wrap gap-1 md:hidden">
                        {dayEvents.slice(0, 4).map((e) => (
                          <span key={e.id} className="size-2 ring-1 ring-ink/10" style={{ background: categoryById(e.category).color }} />
                        ))}
                      </span>
                    )}

                    {/* Desktop: previews */}
                    <ul className="mt-1 hidden min-w-0 space-y-1 md:block">
                      {shown.map((e) => (
                        <li key={e.id} className="min-w-0">
                          <Link
                            href={eventHref(e)}
                            className="pointer-events-auto flex min-w-0 items-baseline gap-1.5 border-l-[3px] bg-paper px-1.5 py-1 text-[0.75rem] leading-tight transition-colors hover:bg-ink hover:text-white"
                            style={{ borderColor: categoryById(e.category).color }}
                          >
                            <span className="shrink-0 font-semibold tabular-nums">{cellTime(e, day)}</span>
                            <span className="truncate">{e.title}</span>
                          </Link>
                        </li>
                      ))}
                      {overflow && (
                        <li>
                          <Link
                            href={dayLink}
                            scroll={false}
                            className="pointer-events-auto inline-block px-1.5 py-0.5 text-[0.75rem] font-semibold text-blue underline-offset-2 hover:underline"
                          >
                            +{dayEvents.length - shown.length} more
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Chronological list of the month's events, grouped by day. */
function Agenda({ state, events, today }: Props) {
  const first = firstOfMonth(state.month);
  const last = lastOfMonth(state.month);
  const days: PlainDate[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) if (events.some((e) => occursOn(e, d))) days.push(d);

  if (!days.length) return <EmptyState>{calendarCopy.emptyMonth}</EmptyState>;

  return (
    <ol className="space-y-8">
      {days.map((day) => (
        <li key={day}>
          <h3 className="flex items-baseline gap-3 border-b border-ink pb-2">
            <Link href={calendarHref(state, { day })} scroll={false} className="display display-sm underline-offset-4 hover:underline">
              {formatLongDate(day)}
            </Link>
            {day === today && <span className="label bg-blue px-2 py-1 text-white">Today</span>}
          </h3>
          <ul>
            {eventsOn(events, day).map((e) => (
              <li key={e.id} className="border-b border-line">
                <Link href={eventHref(e)} className="group/card grid grid-cols-[4px_1fr_auto] items-center gap-x-4 py-4">
                  <span aria-hidden="true" className="h-full min-h-10" style={{ background: categoryById(e.category).color }} />
                  <span className="min-w-0">
                    <span className="block text-[0.875rem] font-semibold text-muted tabular-nums">{timeOnDay(e, day)}</span>
                    <span className="mt-0.5 block font-display text-[1.0625rem] font-semibold leading-snug [font-stretch:106%] group-hover/card:text-blue">
                      {e.title}
                    </span>
                    <span className="mt-1 block text-[0.875rem] text-muted">
                      {categoryById(e.category).label}
                      {locationLine(e) && ` · ${locationLine(e)}`}
                    </span>
                  </span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/* Day view                                                                   */
/* -------------------------------------------------------------------------- */

function DayView({ state, events, today }: Props & { state: CalendarState & { day: PlainDate } }) {
  const day = state.day;
  const dayEvents = eventsOn(events, day);
  const prev = addDays(day, -1);
  const next = addDays(day, 1);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-4">
        <Link
          href={calendarHref(state, { day: null })}
          scroll={false}
          className="group/btn inline-flex min-h-11 items-center gap-2.5 bg-ink px-4 font-display text-[0.9rem] font-semibold text-white transition-colors [font-stretch:106%] hover:bg-blue"
        >
          <Arrow className="rotate-180 group-hover/btn:-translate-x-1 group-hover/btn:translate-x-0" />
          Back to Month
        </Link>
        <div className="flex gap-2">
          <NavButton href={calendarHref(state, { day: prev, month: monthOf(prev) })} label={`Previous day, ${formatLongDate(prev)}`}>
            <Arrow className="rotate-180" />
            <span className="ml-2 hidden sm:inline">{formatShortDate(prev)}</span>
          </NavButton>
          <NavButton href={calendarHref(state, { day: next, month: monthOf(next) })} label={`Next day, ${formatLongDate(next)}`}>
            <span className="mr-2 hidden sm:inline">{formatShortDate(next)}</span>
            <Arrow />
          </NavButton>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h3 className="display display-md" aria-live="polite">
          {formatLongDate(day)}
        </h3>
        {day === today && <span className="label bg-blue px-2 py-1 text-white">Today</span>}
      </div>
      <p className="mt-2 text-[0.9375rem] text-muted">
        {dayEvents.length ? `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}
        {dayEvents.length ? " · " : ""}All times are Miami time (ET).
      </p>

      {dayEvents.length === 0 ? (
        <EmptyState>{calendarCopy.emptyDay}</EmptyState>
      ) : (
        <ol className="mt-8 space-y-5">
          {dayEvents.map((e) => (
            <li key={e.id}>
              <article className="group/card grid gap-5 border border-line bg-white p-4 transition-colors hover:border-ink sm:grid-cols-[minmax(0,15rem)_1fr] sm:p-5">
                <EventVisual
                  category={e.category}
                  imagePath={e.public_image_path}
                  sizes="(min-width: 640px) 15rem, 100vw"
                  className="aspect-[16/9] sm:aspect-[4/3]"
                />
                <div className="flex min-w-0 flex-col">
                  <p className="font-display text-[0.95rem] font-semibold text-blue tabular-nums [font-stretch:106%]">{timeOnDay(e, day)}</p>
                  <h4 className="display display-sm mt-1.5">
                    <Link href={eventHref(e)} className="underline-offset-4 hover:underline">
                      {e.title}
                    </Link>
                  </h4>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <CategoryTag category={e.category} />
                    {locationLine(e) && <span className="text-[0.9375rem] text-muted">{locationLine(e)}</span>}
                    {e.organizer_type === "maa" && <span className="label bg-sun px-2 py-1 text-ink">MAA Event</span>}
                  </div>
                  <p className="mt-3 line-clamp-3 text-[0.9375rem] text-muted">{e.description}</p>
                  <div className="mt-4">
                    <Link
                      href={eventHref(e)}
                      className="group/btn inline-flex min-h-11 items-center gap-2.5 font-display text-[0.9rem] font-semibold text-blue [font-stretch:106%] hover:text-navy"
                    >
                      View Full Details
                      <span className="sr-only">: {e.title}</span>
                      <Arrow />
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 flex flex-col items-start gap-4 border border-dashed border-ink/30 bg-paper px-6 py-10 sm:px-10">
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8 text-green" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="4" y="7" width="24" height="21" />
        <path d="M4 13h24M10 4v6M22 4v6" />
      </svg>
      <p className="max-w-xl text-[1.0625rem]">{children}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function CalendarView(props: Props) {
  const { state, today, notice } = props;
  const thisMonth = monthOf(today);
  const prevMonth = addMonths(state.month, -1);
  const nextMonth = addMonths(state.month, 1);
  const monthHasEvents = props.events.some(
    (e) => e.start_date <= lastOfMonth(state.month) && e.end_date >= firstOfMonth(state.month),
  );

  return (
    <div>
      <Filters state={state} />

      {notice && (
        <p role="status" className="mt-6 border-l-4 border-sun bg-paper px-4 py-3 text-[0.9375rem]">
          {notice}
        </p>
      )}

      <div className="mt-8">
        {state.day ? (
          <DayView {...props} state={{ ...state, day: state.day }} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
              <h3 className="display display-md" aria-live="polite">
                {formatMonthYear(state.month)}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-2 flex border border-ink/25" role="group" aria-label="View">
                  {(["month", "list"] as const).map((v) => (
                    <Link
                      key={v}
                      href={calendarHref(state, { view: v })}
                      scroll={false}
                      aria-current={state.view === v ? "true" : undefined}
                      className={cx(
                        "inline-flex min-h-11 items-center px-3.5 font-display text-[0.875rem] font-semibold [font-stretch:106%] transition-colors",
                        state.view === v ? "bg-ink text-white" : "hover:bg-paper",
                      )}
                    >
                      {v === "month" ? "Month" : "List"}
                    </Link>
                  ))}
                </div>
                <NavButton href={calendarHref(state, { month: prevMonth })} label={`Previous month, ${formatMonthYear(prevMonth)}`}>
                  <Arrow className="rotate-180" />
                </NavButton>
                <NavButton
                  href={calendarHref(state, { month: thisMonth })}
                  label={`Today, ${formatLongDate(today)}`}
                  className={state.month === thisMonth ? "border-ink/15 text-muted" : undefined}
                >
                  Today
                </NavButton>
                <NavButton href={calendarHref(state, { month: nextMonth })} label={`Next month, ${formatMonthYear(nextMonth)}`}>
                  <Arrow />
                </NavButton>
              </div>
            </div>

            {state.view === "list" ? (
              <Agenda {...props} />
            ) : (
              <>
                <MonthGrid {...props} />
                {!monthHasEvents && <EmptyState>{calendarCopy.emptyMonth}</EmptyState>}
                {/* On phones the grid is compact, so the month's events also appear as a list. */}
                {monthHasEvents && (
                  <div className="mt-10 md:hidden">
                    <h3 className="label mb-4 text-muted">This Month</h3>
                    <Agenda {...props} />
                  </div>
                )}
              </>
            )}
            <p className="mt-5 text-[0.875rem] text-muted">All times are Miami time (Eastern Time).</p>
          </>
        )}
      </div>
    </div>
  );
}
