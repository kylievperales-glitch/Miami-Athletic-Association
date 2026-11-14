/** Placing events on Miami calendar days. Safe for client and server. */
import {
  addDays,
  formatLongDate,
  formatMediumDate,
  formatMiamiTime,
  formatShortDate,
  miamiTimeOf,
  miamiZoneAbbr,
  type PlainDate,
} from "@/lib/time";
import type { PublicEvent } from "./types";

type Timing = Pick<PublicEvent, "all_day" | "starts_at" | "ends_at" | "start_date" | "end_date">;

/** Last Miami day an event occupies. A timed event ending at exactly midnight doesn't spill into the next day. */
export function lastDay(e: Timing): PlainDate {
  if (!e.all_day && e.end_date > e.start_date && miamiTimeOf(e.ends_at) === "00:00") return addDays(e.end_date, -1);
  return e.end_date;
}

export const occursOn = (e: Timing, day: PlainDate) => e.start_date <= day && lastDay(e) >= day;

export const isMultiDay = (e: Timing) => lastDay(e) > e.start_date;

/** Events on a day: all-day and continuing events first, then by start time. */
export function eventsOn<T extends PublicEvent>(events: T[], day: PlainDate): T[] {
  const rank = (e: T) => (e.all_day || e.start_date < day ? 0 : 1);
  return events
    .filter((e) => occursOn(e, day))
    .sort((a, b) => rank(a) - rank(b) || a.starts_at.localeCompare(b.starts_at) || a.title.localeCompare(b.title));
}

/** Short time label for a calendar cell: "10:00 AM", "All day", "Continues". */
export function cellTime(e: Timing, day: PlainDate) {
  if (e.all_day) return "All day";
  if (e.start_date < day) return "Continues";
  return formatMiamiTime(e.starts_at).replace(":00", "");
}

/** Time line for one day of an event, e.g. "10:00 AM – 2:00 PM EST". */
export function timeOnDay(e: Timing, day: PlainDate) {
  if (e.all_day) return "All day";
  const startsToday = e.start_date === day;
  const endsToday = lastDay(e) === day;
  const zone = miamiZoneAbbr(e.starts_at);
  if (startsToday && endsToday) {
    return e.starts_at === e.ends_at
      ? `${formatMiamiTime(e.starts_at)} ${zone}`
      : `${formatMiamiTime(e.starts_at)} – ${formatMiamiTime(e.ends_at)} ${zone}`;
  }
  if (startsToday) return `Starts ${formatMiamiTime(e.starts_at)} ${zone}`;
  if (endsToday) return `Until ${formatMiamiTime(e.ends_at)} ${miamiZoneAbbr(e.ends_at)}`;
  return "All day (continuing)";
}

/** Full date and time description for the detail view. */
export function fullSchedule(e: Timing): { date: string; time: string } {
  const end = lastDay(e);
  if (e.all_day) {
    return {
      date: end === e.start_date ? formatLongDate(e.start_date) : `${formatMediumDate(e.start_date)} – ${formatMediumDate(end)}`,
      time: "All day",
    };
  }
  const startZone = miamiZoneAbbr(e.starts_at);
  const endZone = miamiZoneAbbr(e.ends_at);
  if (end === e.start_date) {
    return {
      date: formatLongDate(e.start_date),
      time:
        e.starts_at === e.ends_at
          ? `${formatMiamiTime(e.starts_at)} ${startZone}`
          : `${formatMiamiTime(e.starts_at)} – ${formatMiamiTime(e.ends_at)} ${endZone}`,
    };
  }
  return {
    date: `${formatMediumDate(e.start_date)} – ${formatMediumDate(e.end_date)}`,
    time: `${formatShortDate(e.start_date)}, ${formatMiamiTime(e.starts_at)} ${startZone} – ${formatShortDate(e.end_date)}, ${formatMiamiTime(e.ends_at)} ${endZone}`,
  };
}

export function locationLine(e: Pick<PublicEvent, "is_online" | "venue_name" | "city">) {
  if (e.is_online) return "Online event";
  return [e.venue_name, e.city].filter(Boolean).join(", ");
}

export function fullAddress(e: Pick<PublicEvent, "street_address" | "city" | "state" | "postal_code">) {
  const cityLine = [e.city, [e.state, e.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [e.street_address, cityLine].filter(Boolean).join(", ");
}
