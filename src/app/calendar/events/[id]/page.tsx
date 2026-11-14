import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CategoryTag, EventVisual } from "@/components/calendar/EventVisual";
import { Arrow, Button } from "@/components/ui";
import { admissionLabel, calendarCopy } from "@/content/calendar";
import { googleCalendarUrl } from "@/lib/events/addToCalendar";
import { getPublishedEvent } from "@/lib/events/public";
import { fullAddress, fullSchedule } from "@/lib/events/schedule";
import { pageMeta, siteUrl } from "@/lib/metadata";
import { publicImageUrl } from "@/lib/supabase/config";
import { monthOf } from "@/lib/time";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const event = await getPublishedEvent((await params).id);
  if (!event) return { title: "Event not found", robots: { index: false } };
  const meta = pageMeta(event.title, event.description.slice(0, 160), `/calendar/events/${event.id}`);
  const image = publicImageUrl(event.public_image_path);
  if (image && meta.openGraph) meta.openGraph.images = [{ url: image, alt: event.title }];
  return meta;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-4">
      <dt className="label text-muted">{label}</dt>
      <dd className="mt-1.5 text-[1.0125rem]">{children}</dd>
    </div>
  );
}

export default async function EventPage({ params }: Props) {
  await connection();
  const event = await getPublishedEvent((await params).id);
  if (!event) notFound();

  const schedule = fullSchedule(event);
  const pageUrl = `${siteUrl}/calendar/events/${event.id}`;
  const backHref = `/calendar?month=${monthOf(event.start_date)}&day=${event.start_date}#explore`;
  const isMaa = event.organizer_type === "maa";

  return (
    <article className="bg-white">
      <div className="wrap pb-16 pt-8 lg:pb-24 lg:pt-12">
        <Link
          href={backHref}
          className="group/btn inline-flex min-h-11 items-center gap-2.5 font-display text-[0.9rem] font-semibold [font-stretch:106%] hover:text-blue"
        >
          <Arrow className="rotate-180 group-hover/btn:-translate-x-1 group-hover/btn:translate-x-0" />
          Back to Calendar
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <CategoryTag category={event.category} />
              {isMaa && <span className="label bg-sun px-2 py-1 text-ink">MAA Event</span>}
            </div>
            <h1 className="display display-lg mt-5">{event.title}</h1>
            <p className="display display-sm mt-6 text-blue">{schedule.date}</p>
            <p className="mt-2 text-[1.0625rem] font-semibold">
              {schedule.time}
              {!event.all_day && <span className="font-normal text-muted"> (Miami time)</span>}
            </p>

            <EventVisual
              category={event.category}
              imagePath={event.public_image_path}
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="mt-8 aspect-[16/9]"
              size="lg"
              priority
            />

            <div className="mt-8 max-w-2xl space-y-4 whitespace-pre-line text-[1.0625rem] leading-relaxed">{event.description}</div>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="lg:sticky lg:top-28">
              <dl>
                <Detail label="Date">{schedule.date}</Detail>
                <Detail label="Time">{schedule.time}</Detail>
                <Detail label="Location">
                  {event.is_online ? (
                    "Online event"
                  ) : (
                    <>
                      <span className="font-semibold">{event.venue_name}</span>
                      <br />
                      {fullAddress(event)}
                      <br />
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue_name}, ${fullAddress(event)}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-[0.9375rem] text-blue underline underline-offset-4"
                      >
                        View map<span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </>
                  )}
                </Detail>
                <Detail label="Organizer">{event.organizer_name}</Detail>
                <Detail label="Admission">
                  {admissionLabel(event.admission_type)}
                  {event.admission_price && <span className="text-muted"> · {event.admission_price}</span>}
                </Detail>
              </dl>

              <div className="mt-6 border-t border-ink pt-6">
                <Button href={event.event_url} external className="w-full">
                  View Event Details / Register
                </Button>
                <div className="mt-5">
                  <p className="label mb-2 text-muted">Add to Calendar</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.9375rem]">
                    <a href={googleCalendarUrl(event, pageUrl)} target="_blank" rel="noopener noreferrer" className="inline-block py-1 text-blue underline underline-offset-4">
                      Google Calendar<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <a href={`/calendar/events/${event.id}/ics`} className="inline-block py-1 text-blue underline underline-offset-4">
                      Apple / Outlook (.ics)
                    </a>
                  </div>
                </div>
                {!isMaa && <p className="mt-6 border-l-4 border-line pl-4 text-[0.875rem] text-muted">{calendarCopy.thirdParty}</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
