/**
 * Miami time helpers.
 *
 * Every date and time on the calendar is Miami local time (America/New_York,
 * EST/EDT), whatever the visitor's own time zone. Two kinds of value are used:
 *
 *   - Plain dates ("2026-11-21"): calendar days. Arithmetic on them is done in
 *     UTC so the host time zone can never shift a day.
 *   - Instants (Date / ISO strings): exact moments, always displayed through
 *     Intl with timeZone: America/New_York, so daylight saving is handled by
 *     the platform's time zone database rather than a hard-coded offset.
 */

export const MIAMI_TZ = "America/New_York";

export type PlainDate = string; // YYYY-MM-DD

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: MIAMI_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Wall-clock fields of an instant in Miami. */
export function miamiParts(instant: Date) {
  const p: Record<string, number> = {};
  for (const { type, value } of partsFormatter.formatToParts(instant)) {
    if (type !== "literal") p[type] = Number(value);
  }
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, second: p.second };
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** The Miami calendar date of an instant. */
export function miamiDateOf(instant: Date | string): PlainDate {
  const { year, month, day } = miamiParts(new Date(instant));
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** The Miami wall-clock time of an instant, "HH:MM". */
export function miamiTimeOf(instant: Date | string): string {
  const { hour, minute } = miamiParts(new Date(instant));
  return `${pad(hour)}:${pad(minute)}`;
}

/** Today's date in Miami. */
export function miamiToday(now = new Date()): PlainDate {
  return miamiDateOf(now);
}

/** Offset of Miami from UTC at an instant, in minutes (e.g. -300 for EST). */
function offsetMinutes(instant: Date) {
  const p = miamiParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

export class InvalidMiamiTime extends Error {}

/**
 * Convert a Miami wall-clock date and time to the exact instant.
 *
 * Throws InvalidMiamiTime for a time skipped by the spring-forward change
 * (e.g. 2:30 AM on the second Sunday in March). For the repeated hour in
 * November the earlier (EDT) instant is used.
 */
export function miamiWallToInstant(date: PlainDate, time: string): Date {
  const d = DATE_RE.exec(date);
  const t = TIME_RE.exec(time);
  if (!d || !t || !isValidPlainDate(date)) throw new InvalidMiamiTime("Invalid date or time.");
  const naive = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));

  // Try both offsets that apply around this moment and keep the ones that
  // round-trip to the same wall clock.
  const candidates = new Set<number>();
  for (const probe of [naive - 864e5, naive, naive + 864e5]) {
    candidates.add(naive - offsetMinutes(new Date(probe)) * 60000);
  }
  const valid = [...candidates]
    .filter((ms) => miamiDateOf(new Date(ms)) === date && miamiTimeOf(new Date(ms)) === time)
    .sort((a, b) => a - b);
  if (!valid.length) {
    throw new InvalidMiamiTime("That time does not exist in Miami because of the daylight saving time change.");
  }
  return new Date(valid[0]);
}

export function isValidPlainDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d && y >= 2000 && y <= 2100;
}

export const isValidTime = (value: string) => TIME_RE.test(value);

// ---------------------------------------------------------------------------
// Plain date arithmetic (calendar days, no time zone involved)
// ---------------------------------------------------------------------------

const toUtc = (date: PlainDate) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const fromUtc = (dt: Date): PlainDate => `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;

export function addDays(date: PlainDate, n: number): PlainDate {
  const dt = toUtc(date);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fromUtc(dt);
}

/** 0 = Sunday. */
export const weekday = (date: PlainDate) => toUtc(date).getUTCDay();

export const daysBetween = (a: PlainDate, b: PlainDate) => Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 864e5);

// ---------------------------------------------------------------------------
// Months ("YYYY-MM")
// ---------------------------------------------------------------------------

export type MonthKey = string;

export const isValidMonth = (value: string) => {
  const m = MONTH_RE.exec(value);
  return Boolean(m && Number(m[1]) >= 2000 && Number(m[1]) <= 2100);
};
export const monthOf = (date: PlainDate): MonthKey => date.slice(0, 7);
export const firstOfMonth = (month: MonthKey): PlainDate => `${month}-01`;

export function addMonths(month: MonthKey, n: number): MonthKey {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

export function lastOfMonth(month: MonthKey): PlainDate {
  return addDays(firstOfMonth(addMonths(month, 1)), -1);
}

/** The Sunday-to-Saturday grid of whole weeks covering a month. */
export function monthGrid(month: MonthKey): PlainDate[][] {
  const first = firstOfMonth(month);
  const last = lastOfMonth(month);
  let cursor = addDays(first, -weekday(first));
  const end = addDays(last, 6 - weekday(last));
  const weeks: PlainDate[][] = [];
  while (cursor <= end) {
    const week: PlainDate[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

// Plain dates are formatted as UTC midnight with timeZone UTC, so the day never shifts.
const plainFmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts });

const fmtLongDate = plainFmt({ weekday: "long", month: "long", day: "numeric", year: "numeric" });
const fmtMediumDate = plainFmt({ weekday: "short", month: "short", day: "numeric", year: "numeric" });
const fmtShortDate = plainFmt({ month: "short", day: "numeric" });
const fmtMonthYear = plainFmt({ month: "long", year: "numeric" });
const fmtMonthName = plainFmt({ month: "long" });

/** "Saturday, November 21, 2026" */
export const formatLongDate = (date: PlainDate) => fmtLongDate.format(toUtc(date));
/** "Sat, Nov 21, 2026" */
export const formatMediumDate = (date: PlainDate) => fmtMediumDate.format(toUtc(date));
/** "Nov 21" */
export const formatShortDate = (date: PlainDate) => fmtShortDate.format(toUtc(date));
/** "November 2026" */
export const formatMonthYear = (month: MonthKey) => fmtMonthYear.format(toUtc(firstOfMonth(month)));
export const formatMonthName = (month: MonthKey) => fmtMonthName.format(toUtc(firstOfMonth(month)));

const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: MIAMI_TZ, hour: "numeric", minute: "2-digit" });
const zoneFmt = new Intl.DateTimeFormat("en-US", { timeZone: MIAMI_TZ, timeZoneName: "short" });

/** "10:00 AM" in Miami. */
export const formatMiamiTime = (instant: Date | string) => timeFmt.format(new Date(instant));

/** "EST" or "EDT" for that instant. */
export function miamiZoneAbbr(instant: Date | string) {
  const part = zoneFmt.formatToParts(new Date(instant)).find((p) => p.type === "timeZoneName")?.value ?? "ET";
  return /^GMT/.test(part) ? "ET" : part;
}

/** "10:00 AM" or "10:00 AM – 2:00 PM", without the zone. */
export function formatTimeRange(startsAt: string, endsAt: string) {
  const a = formatMiamiTime(startsAt);
  const b = formatMiamiTime(endsAt);
  return startsAt === endsAt ? a : `${a} – ${b}`;
}
