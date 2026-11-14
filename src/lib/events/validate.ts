/**
 * Event validation shared by the browser (for instant feedback) and the server
 * (the authority). The server never trusts the browser's result.
 */
import { admissionTypes, categoryIds, organizerTypes, type OrganizerType } from "@/content/calendar";
import {
  InvalidMiamiTime,
  addDays,
  daysBetween,
  isValidPlainDate,
  isValidTime,
  miamiDateOf,
  miamiToday,
  miamiWallToInstant,
} from "@/lib/time";
import type { ContactRecord, EventRecord } from "./types";

export const limits = {
  title: 140,
  descriptionMin: 20,
  descriptionPublic: 2000,
  descriptionAdmin: 4000,
  venue: 160,
  street: 200,
  city: 100,
  state: 60,
  postal: 12,
  url: 500,
  price: 80,
  organizer: 160,
  contactName: 120,
  email: 254,
  phone: 40,
  maxDays: 62,
  imageBytes: 5 * 1024 * 1024,
};

export const imageTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export type Mode = "public" | "admin";
export type Values = Record<string, string>;
export type Errors = Record<string, string>;

/** Remove control characters (keeping newlines in multiline fields) and trim. */
export function clean(value: unknown, multiline = false): string {
  const s = typeof value === "string" ? value : "";
  const stripped = multiline
    ? s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    : s.replace(/[\u0000-\u001F\u007F]/g, " ");
  return (multiline ? stripped.replace(/\n{3,}/g, "\n\n") : stripped.replace(/\s+/g, " ")).trim();
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const PHONE_RE = /^[0-9+().\-\s]{7,25}(\s*(ext\.?|x)\s*\d{1,6})?$/i;
const US_ZIP_RE = /^\d{5}(-\d{4})?$/;

export const isEmail = (v: string) => v.length <= limits.email && EMAIL_RE.test(v);

/** Accept only https URLs to a real-looking public host, with no embedded credentials. */
export function normalizeUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || host.endsWith(".") || /^[\d.]+$/.test(host) || host.startsWith("[")) return null;
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  const href = url.toString();
  return href.length <= limits.url ? href : null;
}

const isFlorida = (state: string) => /^(fl|fla|florida)\.?$/i.test(state.trim());

export type ParsedEvent = {
  event: EventRecord;
  contact: ContactRecord;
  organizerType: OrganizerType;
  newsletter: boolean;
};

export function validateEvent(values: Values, mode: Mode, now = new Date()): { errors: Errors; parsed?: ParsedEvent } {
  const v = (k: string, multiline = false) => clean(values[k], multiline);
  const flag = (k: string) => values[k] === "on" || values[k] === "true" || values[k] === "1";
  const errors: Errors = {};
  const need = (k: string, message: string) => {
    if (!v(k)) errors[k] = message;
  };
  const max = (k: string, n: number, label: string) => {
    if (v(k).length > n) errors[k] = `${label} must be ${n} characters or fewer.`;
  };

  // Event information
  need("title", "Please enter the event name.");
  if (v("title") && v("title").length < 3) errors.title = "The event name is too short.";
  max("title", limits.title, "Event name");

  const description = v("description", true);
  const descMax = mode === "admin" ? limits.descriptionAdmin : limits.descriptionPublic;
  if (!description) errors.description = "Please describe the event.";
  else if (description.length < limits.descriptionMin)
    errors.description = `Please add a little more detail (at least ${limits.descriptionMin} characters).`;
  else if (description.length > descMax) errors.description = `Please keep the description under ${descMax} characters.`;

  const category = v("category");
  if (!categoryIds.includes(category as never)) errors.category = "Please choose a category.";

  // Dates and times (Miami local)
  const allDay = flag("allDay");
  const startDate = v("startDate");
  const endDate = v("endDate") || startDate;
  const startTime = v("startTime");
  const endTime = v("endTime");
  if (!startDate) errors.startDate = "Please choose a start date.";
  else if (!isValidPlainDate(startDate)) errors.startDate = "Please enter a valid start date.";
  if (!v("endDate")) errors.endDate = "Please choose an end date.";
  else if (!isValidPlainDate(endDate)) errors.endDate = "Please enter a valid end date.";
  if (!allDay) {
    if (!startTime) errors.startTime = "Please enter a start time, or mark the event as all-day.";
    else if (!isValidTime(startTime)) errors.startTime = "Please enter a valid start time.";
    if (!endTime) errors.endTime = "Please enter an end time, or mark the event as all-day.";
    else if (!isValidTime(endTime)) errors.endTime = "Please enter a valid end time.";
  }

  let startsAt: Date | null = null;
  let endsAt: Date | null = null;
  if (!errors.startDate && !errors.endDate && !errors.startTime && !errors.endTime && startDate && endDate) {
    if (endDate < startDate) {
      errors.endDate = "The end date can't be before the start date.";
    } else if (daysBetween(startDate, endDate) > limits.maxDays) {
      errors.endDate = `Events can span at most ${limits.maxDays} days.`;
    } else if (allDay) {
      startsAt = miamiWallToInstant(startDate, "00:00");
      endsAt = miamiWallToInstant(endDate, "23:59");
    } else {
      try {
        startsAt = miamiWallToInstant(startDate, startTime);
      } catch (e) {
        errors.startTime = e instanceof InvalidMiamiTime ? e.message : "Please enter a valid start time.";
      }
      try {
        endsAt = miamiWallToInstant(endDate, endTime);
      } catch (e) {
        errors.endTime = e instanceof InvalidMiamiTime ? e.message : "Please enter a valid end time.";
      }
      if (startsAt && endsAt && endsAt < startsAt) {
        errors.endTime = "The end time can't be before the start time.";
      }
    }
    if (mode === "public" && endsAt && !errors.endDate && !errors.endTime) {
      const lastDay = allDay ? endDate : miamiDateOf(endsAt);
      if (lastDay < miamiToday(now)) errors.endDate = "This event has already taken place.";
      else if (startDate > addDays(miamiToday(now), 3 * 366)) errors.startDate = "Please submit events within the next three years.";
    }
  }

  // Location
  const isOnline = flag("isOnline");
  if (!isOnline) {
    need("venueName", "Please enter the venue name.");
    need("streetAddress", "Please enter the street address.");
    need("city", "Please enter the city.");
    need("state", "Please enter the state.");
    need("postalCode", "Please enter the ZIP code.");
    if (v("postalCode") && isFlorida(v("state")) && !US_ZIP_RE.test(v("postalCode")))
      errors.postalCode = "Please enter a valid ZIP code, like 33139.";
  }
  max("venueName", limits.venue, "Venue name");
  max("streetAddress", limits.street, "Street address");
  max("city", limits.city, "City");
  max("state", limits.state, "State");
  max("postalCode", limits.postal, "ZIP code");

  // Registration and verification
  const url = normalizeUrl(v("eventUrl"));
  if (!v("eventUrl")) errors.eventUrl = "Please provide an official event or registration link.";
  else if (!url) errors.eventUrl = "Please enter a valid secure link starting with https://, like https://example.com/event.";

  const admission = v("admissionType");
  if (!admissionTypes.some((a) => a.id === admission)) errors.admissionType = "Please choose an admission type.";
  max("admissionPrice", limits.price, "Admission price");

  // Organizer
  need("organizerName", "Please enter the organizer or organization name.");
  max("organizerName", limits.organizer, "Organizer name");

  const organizerType = (mode === "admin" ? v("organizerType") : "third_party") as OrganizerType;
  if (!organizerTypes.some((o) => o.id === organizerType)) errors.organizerType = "Please choose the organizer type.";

  const contactEmail = v("contactEmail").toLowerCase();
  if (mode === "public") {
    need("contactName", "Please enter a contact person.");
    if (!contactEmail) errors.contactEmail = "Please enter a contact email.";
  }
  if (contactEmail && !isEmail(contactEmail)) errors.contactEmail = "Please enter a valid email address, like name@example.com.";
  max("contactName", limits.contactName, "Contact name");
  if (v("contactPhone") && !PHONE_RE.test(v("contactPhone"))) errors.contactPhone = "Please enter a valid phone number.";

  if (mode === "public" && !flag("accuracy")) errors.accuracy = "Please confirm the information is accurate.";

  if (Object.keys(errors).length || !startsAt || !endsAt || !url) return { errors };

  const opt = (k: string) => v(k) || null;
  return {
    errors,
    parsed: {
      event: {
        title: v("title"),
        description,
        category: category as EventRecord["category"],
        all_day: allDay,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        start_date: allDay ? startDate : miamiDateOf(startsAt),
        end_date: allDay ? endDate : miamiDateOf(endsAt),
        is_online: isOnline,
        venue_name: isOnline ? null : opt("venueName"),
        street_address: isOnline ? null : opt("streetAddress"),
        city: isOnline ? null : opt("city"),
        state: isOnline ? null : opt("state"),
        postal_code: isOnline ? null : opt("postalCode"),
        organizer_name: v("organizerName"),
        event_url: url,
        admission_type: admission as EventRecord["admission_type"],
        admission_price: admission === "free" ? null : opt("admissionPrice"),
      },
      contact: {
        contact_name: opt("contactName"),
        contact_email: contactEmail || null,
        contact_phone: opt("contactPhone"),
      },
      organizerType,
      newsletter: flag("newsletter"),
    },
  };
}

/** Check an uploaded image by its bytes, not its claimed type or name. */
export async function inspectImage(file: File): Promise<{ ok: true; type: string; ext: string } | { ok: false; error: string }> {
  if (file.size > limits.imageBytes) return { ok: false, error: "Images must be 5 MB or smaller." };
  if (file.size < 100) return { ok: false, error: "That image file appears to be empty." };
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const is = (bytes: number[], offset = 0) => bytes.every((b, i) => head[offset + i] === b);
  if (is([0xff, 0xd8, 0xff])) return { ok: true, type: "image/jpeg", ext: "jpg" };
  if (is([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ok: true, type: "image/png", ext: "png" };
  if (is([0x52, 0x49, 0x46, 0x46]) && is([0x57, 0x45, 0x42, 0x50], 8)) return { ok: true, type: "image/webp", ext: "webp" };
  return { ok: false, error: "Please upload a JPG, PNG or WebP image." };
}
