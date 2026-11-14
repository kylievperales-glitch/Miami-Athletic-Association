/** "Add to Calendar" helpers: a Google Calendar link and an .ics file. */
import { org } from "@/content/site";
import { addDays } from "@/lib/time";
import { fullAddress, lastDay } from "./schedule";
import type { PublicEvent } from "./types";

const utcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const dateStamp = (d: string) => d.replace(/-/g, "");

function location(e: PublicEvent) {
  return e.is_online ? "Online event" : [e.venue_name, fullAddress(e)].filter(Boolean).join(", ");
}

export function googleCalendarUrl(e: PublicEvent, pageUrl: string) {
  const dates = e.all_day
    ? `${dateStamp(e.start_date)}/${dateStamp(addDays(lastDay(e), 1))}`
    : `${utcStamp(e.starts_at)}/${utcStamp(e.ends_at)}`;
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates,
    details: `${e.description.slice(0, 1200)}\n\nDetails: ${e.event_url}\nListing: ${pageUrl}`,
    location: location(e),
    ctz: "America/New_York",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Fold lines to 75 octets as RFC 5545 requires. */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function icsFile(e: PublicEvent, pageUrl: string) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${org.name}//Calendar//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@miami-athletic-association`,
    `DTSTAMP:${utcStamp(new Date().toISOString())}`,
    ...(e.all_day
      ? [`DTSTART;VALUE=DATE:${dateStamp(e.start_date)}`, `DTEND;VALUE=DATE:${dateStamp(addDays(lastDay(e), 1))}`]
      : [`DTSTART:${utcStamp(e.starts_at)}`, `DTEND:${utcStamp(e.ends_at)}`]),
    `SUMMARY:${escapeText(e.title)}`,
    `DESCRIPTION:${escapeText(`${e.description}\n\nDetails: ${e.event_url}`)}`,
    `LOCATION:${escapeText(location(e))}`,
    `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
