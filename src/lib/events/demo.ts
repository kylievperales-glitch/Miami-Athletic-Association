/**
 * DEVELOPMENT-ONLY sample events for previewing the calendar layout before
 * Supabase is connected. Enabled only when CALENDAR_DEMO=1 AND the app runs
 * with `next dev`. Production builds ignore it entirely, and the page shows a
 * "Demo data" banner whenever it is on. These are not real events.
 */
import { addDays, miamiToday, miamiWallToInstant } from "@/lib/time";
import type { PublicEvent } from "./types";

export const isDemoMode = process.env.NODE_ENV === "development" && process.env.CALENDAR_DEMO === "1";

export function demoEvents(): PublicEvent[] {
  const today = miamiToday();
  const day = (offset: number) => addDays(today, offset);
  const timed = (
    n: number,
    title: string,
    category: PublicEvent["category"],
    date: string,
    start: string,
    end: string,
    extra: Partial<PublicEvent> = {},
  ): PublicEvent => {
    const s = miamiWallToInstant(date, start);
    const endDate = end < start ? addDays(date, 1) : date;
    const e = miamiWallToInstant(endDate, end);
    return {
      id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
      title,
      description:
        "Sample listing used only to preview the calendar layout in development. It is not a real event, and it never appears on the live site.",
      category,
      all_day: false,
      starts_at: s.toISOString(),
      ends_at: e.toISOString(),
      start_date: date,
      end_date: endDate,
      is_online: false,
      venue_name: "Sample Venue",
      street_address: "100 Example Street",
      city: "Miami",
      state: "FL",
      postal_code: "33131",
      organizer_name: "Sample Organizer",
      organizer_type: "third_party",
      event_url: "https://example.com/",
      admission_type: "free",
      admission_price: null,
      public_image_path: null,
      ...extra,
    };
  };
  return [
    timed(1, "[Demo] Sunrise Beach Run", "running_endurance", day(2), "06:30", "08:00"),
    timed(2, "[Demo] Morning Yoga Session", "fitness_wellness", day(2), "09:00", "10:00"),
    timed(3, "[Demo] Community Pickleball", "sports_competitions", day(2), "11:00", "13:00"),
    timed(4, "[Demo] Networking Walk", "networking_community", day(2), "17:30", "19:00", { organizer_type: "maa", organizer_name: "Miami Athletic Association" }),
    timed(5, "[Demo] Evening Spin Class", "fitness_wellness", day(2), "19:30", "20:30"),
    timed(6, "[Demo] Late Night Ride", "running_endurance", day(5), "22:00", "01:00"),
    timed(7, "[Demo] Online Training Talk", "other", day(9), "12:00", "13:00", { is_online: true, venue_name: null, street_address: null, city: null, state: null, postal_code: null }),
    {
      ...timed(8, "[Demo] Weekend Tournament", "sports_competitions", day(12), "00:00", "23:59"),
      all_day: true,
      end_date: day(14),
      ends_at: miamiWallToInstant(day(14), "23:59").toISOString(),
      admission_type: "paid",
      admission_price: "$25",
    },
  ];
}
