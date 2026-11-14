import { categoryIds } from "@/content/calendar";
import { isValidMonth, isValidPlainDate, monthOf, type MonthKey, type PlainDate } from "@/lib/time";

export type CalendarState = {
  month: MonthKey;
  day: PlainDate | null;
  cat: string | null;
  org: "maa" | "community" | null;
  view: "month" | "list";
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Read calendar state from the URL, falling back to the current Miami month. */
export function parseCalendarParams(params: Params, today: PlainDate): CalendarState {
  const dayRaw = one(params.day);
  const day = isValidPlainDate(dayRaw) ? dayRaw : null;
  const monthRaw = one(params.month);
  const month = isValidMonth(monthRaw) ? monthRaw : day ? monthOf(day) : monthOf(today);
  const catRaw = one(params.cat);
  const orgRaw = one(params.org);
  return {
    month,
    day,
    cat: categoryIds.includes(catRaw as never) ? catRaw : null,
    org: orgRaw === "maa" || orgRaw === "community" ? orgRaw : null,
    view: one(params.view) === "list" ? "list" : "month",
  };
}

export function calendarHref(state: CalendarState, change: Partial<CalendarState> = {}, hash = "explore") {
  const s = { ...state, ...change };
  const q = new URLSearchParams();
  q.set("month", s.month);
  if (s.day) q.set("day", s.day);
  if (s.cat) q.set("cat", s.cat);
  if (s.org) q.set("org", s.org);
  if (s.view === "list") q.set("view", "list");
  return `/calendar?${q.toString()}${hash ? `#${hash}` : ""}`;
}
