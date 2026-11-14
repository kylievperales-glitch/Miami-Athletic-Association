/**
 * Transactional email templates. Wording follows the MAA brief exactly.
 * Every user-supplied value is HTML-escaped before it is placed in markup.
 */
import { categoryById } from "@/content/calendar";
import { org } from "@/content/site";
import type { EventRecord } from "@/lib/events/types";
import { formatLongDate, formatMiamiTime, miamiZoneAbbr } from "@/lib/time";

export type EmailKind = "submission_confirmation" | "admin_new_submission" | "event_approved" | "event_rejected";

export type EmailMessage = {
  kind: EmailKind;
  to: string[];
  reply_to: string;
  subject: string;
  html: string;
  text: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const replyTo = () => process.env.EMAIL_REPLY_TO || org.email;

export function firstName(fullName: string | null | undefined) {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  return first || "there";
}

/** Plain-text description of when an event happens, in Miami time. */
export function eventWhen(e: Pick<EventRecord, "all_day" | "starts_at" | "ends_at" | "start_date" | "end_date">) {
  const days = e.start_date === e.end_date ? formatLongDate(e.start_date) : `${formatLongDate(e.start_date)} – ${formatLongDate(e.end_date)}`;
  if (e.all_day) return `${days} (all day)`;
  return `${days}, ${formatMiamiTime(e.starts_at)} – ${formatMiamiTime(e.ends_at)} ${miamiZoneAbbr(e.starts_at)}`;
}

type Block = { p: string } | { lines: [string, string][] } | { button: { href: string; label: string } } | { sign: string[] };

function render(heading: string, blocks: Block[], logoUrl: string | null) {
  const body = blocks
    .map((b) => {
      if ("p" in b) return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#10171d;">${esc(b.p)}</p>`;
      if ("lines" in b)
        return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-left:3px solid #1b7a4b;width:100%;">${b.lines
          .map(
            ([k, v]) =>
              `<tr><td style="padding:3px 0 3px 14px;font-size:14px;color:#4e5861;width:130px;vertical-align:top;">${esc(k)}</td><td style="padding:3px 0;font-size:15px;color:#10171d;">${esc(v)}</td></tr>`,
          )
          .join("")}</table>`;
      if ("button" in b)
        return `<p style="margin:4px 0 24px;"><a href="${esc(b.button.href)}" style="display:inline-block;background:#0f5e9c;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;">${esc(b.button.label)}</a></p>`;
      return `<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:#10171d;">${b.sign.map(esc).join("<br>")}</p>`;
    })
    .join("");
  const logo = logoUrl
    ? `<img src="${esc(logoUrl)}" width="44" height="39" alt="" style="display:block;border:0;margin-right:12px;">`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#f6f5f0;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f0;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;">
<tr><td style="background:#0b2c48;padding:18px 28px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="background:#ffffff;padding:3px;">${logo}</td>
<td style="padding-left:12px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:#ffffff;">${esc(org.name)}</td>
</tr></table></td></tr>
<tr><td style="height:4px;background:#1b7a4b;line-height:4px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:32px 28px 28px;">
<h1 style="margin:0 0 20px;font-size:22px;line-height:1.25;color:#0b2c48;">${esc(heading)}</h1>
${body}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #dcdbd3;font-size:13px;line-height:1.5;color:#4e5861;">
${esc(org.name)} · ${esc(org.location)}<br><a href="mailto:${esc(org.email)}" style="color:#0f5e9c;">${esc(org.email)}</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function toText(blocks: Block[]) {
  return blocks
    .map((b) => {
      if ("p" in b) return b.p;
      if ("lines" in b) return b.lines.map(([k, v]) => `${k}: ${v}`).join("\n");
      if ("button" in b) return `${b.button.label}:\n${b.button.href}`;
      return b.sign.join("\n");
    })
    .join("\n\n");
}

function build(kind: EmailKind, to: string[], subject: string, heading: string, blocks: Block[], siteUrl: string): EmailMessage {
  const logoUrl = siteUrl.startsWith("https://") ? `${siteUrl}/images/brand/maa-logo-white.png` : null;
  return { kind, to, reply_to: replyTo(), subject, html: render(heading, blocks, logoUrl), text: toText(blocks) };
}

// Subject lines are single-line; strip anything that could break a header.
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").slice(0, 120);

export function submissionConfirmation(input: { to: string; contactName: string | null; title: string; siteUrl: string }) {
  return build(
    "submission_confirmation",
    [input.to],
    "We've Received Your Event Submission | Miami Athletic Association",
    "We've received your event submission",
    [
      { p: `Hi ${firstName(input.contactName)},` },
      { p: `Thank you for submitting ${input.title} to the Miami Athletic Association calendar.` },
      { p: "We've received your event information, and it is now pending review." },
      { p: "If approved, your event will appear on our public calendar." },
      {
        p: "You don't need to take any additional action at this time. If we need clarification, we'll contact you using the email address provided.",
      },
      { sign: ["Thank you,", org.name, "", org.email] },
    ],
    input.siteUrl,
  );
}

export function adminNewSubmission(input: {
  to: string[];
  event: EventRecord;
  contactName: string | null;
  contactEmail: string | null;
  reviewUrl: string;
  siteUrl: string;
}) {
  const e = input.event;
  return build(
    "admin_new_submission",
    input.to,
    oneLine(`New Event Submission Pending Review — ${e.title}`),
    "New event submission received.",
    [
      {
        lines: [
          ["Event", e.title],
          ["Organizer", e.organizer_name],
          ["Date", eventWhen(e)],
          ["Category", categoryById(e.category).label],
          ["Submitted by", input.contactName ?? "—"],
          ["Contact email", input.contactEmail ?? "—"],
        ],
      },
      { p: "The event is pending review." },
      { button: { href: input.reviewUrl, label: "Review submission" } },
      { sign: [org.name] },
    ],
    input.siteUrl,
  );
}

export function eventApproved(input: { to: string; contactName: string | null; title: string; publicUrl: string; siteUrl: string }) {
  return build(
    "event_approved",
    [input.to],
    "Your Event Has Been Added to the MAA Calendar",
    "Your event is on the calendar",
    [
      { p: `Hi ${firstName(input.contactName)},` },
      { p: `Your event, ${input.title}, has been approved and added to the Miami Athletic Association calendar.` },
      { p: "You can view the listing here:" },
      { button: { href: input.publicUrl, label: "View your listing" } },
      { p: "Thank you for sharing your event with the Miami community." },
      { sign: ["Best,", org.name] },
    ],
    input.siteUrl,
  );
}

export function eventRejected(input: { to: string; contactName: string | null; title: string; reason: string | null; siteUrl: string }) {
  const blocks: Block[] = [
    { p: `Hi ${firstName(input.contactName)},` },
    { p: `Thank you for submitting ${input.title} to the Miami Athletic Association calendar.` },
    { p: "After reviewing the information provided, we won't be including this event on the calendar at this time." },
  ];
  if (input.reason) blocks.push({ p: `Note from our team: ${input.reason}` });
  blocks.push(
    { p: "We appreciate your interest in sharing events with the Miami community." },
    { p: `If you have questions, you can contact us at ${org.email}.` },
    { sign: ["Best,", org.name] },
  );
  return build(
    "event_rejected",
    [input.to],
    "Update on Your Event Submission | Miami Athletic Association",
    "Update on your event submission",
    blocks,
    input.siteUrl,
  );
}
