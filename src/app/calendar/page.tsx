import { connection } from "next/server";
import { CalendarView } from "@/components/calendar/CalendarView";
import { SubmitEventForm } from "@/components/calendar/SubmitEventForm";
import { Button, Eyebrow } from "@/components/ui";
import { calendarCopy } from "@/content/calendar";
import { calendarHref, parseCalendarParams } from "@/lib/events/calendarUrl";
import { getPublishedEvents } from "@/lib/events/public";
import { pageMeta } from "@/lib/metadata";
import { turnstileSiteKey, isTurnstileEnabled } from "@/lib/spam";
import { isServiceConfigured } from "@/lib/supabase/service";
import { addDays, lastOfMonth, firstOfMonth, miamiToday, weekday } from "@/lib/time";

export const metadata = pageMeta("Calendar", calendarCopy.hero.description, "/calendar");

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Always rendered per request: "today" is Miami's today, and approved events appear immediately.
  await connection();
  const today = miamiToday();
  const state = parseCalendarParams(await searchParams, today);

  // Load the visible range: the whole month grid, or a single day.
  const first = firstOfMonth(state.month);
  const last = lastOfMonth(state.month);
  const from = state.day ?? addDays(first, -weekday(first));
  const to = state.day ?? addDays(last, 6 - weekday(last));
  const { events, state: loadState } = await getPublishedEvents(from, to);

  const filtered = events.filter(
    (e) =>
      (!state.cat || e.category === state.cat) &&
      (!state.org || (state.org === "maa" ? e.organizer_type === "maa" : e.organizer_type !== "maa")),
  );

  const notice =
    loadState === "demo"
      ? "Demo data: these sample listings appear only in local development (CALENDAR_DEMO=1). They are not real events and never appear on the live site."
      : loadState === "error"
        ? "We couldn't load events just now. Please refresh the page or try again shortly."
        : null;

  return (
    <>
      {/* Hero */}
      <section className="on-dark bg-navy text-white">
        <div className="wrap pb-14 pt-14 lg:pb-20 lg:pt-20">
          <Eyebrow className="enter mb-6 text-sun">{calendarCopy.hero.eyebrow}</Eyebrow>
          <h1 className="display display-xl enter enter-2 max-w-[15ch]">{calendarCopy.hero.title}</h1>
          <div className="enter enter-3 mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="lead text-white/90">{calendarCopy.hero.description}</p>
              <p className="mt-4 max-w-xl text-white/80">{calendarCopy.hero.secondary}</p>
            </div>
            <div className="lg:col-span-4 lg:col-start-9 lg:flex lg:justify-end">
              <Button href="#submit" variant="sun">
                {calendarCopy.hero.cta}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar */}
      <section id="explore" className="scroll-mt-20 bg-white py-14 lg:py-20">
        <div className="wrap">
          <div className="mb-10 max-w-3xl">
            <h2 className="display display-lg">{calendarCopy.explore.title}</h2>
            <p className="lead mt-5 text-muted">{calendarCopy.explore.text}</p>
          </div>
          <CalendarView state={state} events={filtered} today={today} notice={notice} />
        </div>
      </section>

      {/* Invitation */}
      <section className="bg-sun text-ink">
        <div className="wrap flex flex-col justify-between gap-8 py-14 lg:flex-row lg:items-end lg:py-16">
          <div className="max-w-3xl">
            <h2 className="display display-lg">{calendarCopy.invite.title}</h2>
            <p className="lead mt-5">{calendarCopy.invite.text}</p>
          </div>
          <div className="shrink-0 lg:max-w-xs">
            <Button href="#submit" variant="outline">
              {calendarCopy.invite.cta}
            </Button>
            <p className="mt-4 text-[0.875rem]">{calendarCopy.invite.note}</p>
          </div>
        </div>
      </section>

      {/* Submission */}
      <section id="submit" className="scroll-mt-20 bg-paper py-14 lg:py-24">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Eyebrow className="mb-4 text-green">Submit an Event</Eyebrow>
              <h2 className="display display-md">{calendarCopy.guidelines.title}</h2>
              <div className="mt-6 space-y-4 text-[0.9875rem] text-muted">
                {calendarCopy.guidelines.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <p className="mt-6 text-[0.875rem]">
                <a href={calendarHref(state, {}, "explore")} className="font-semibold text-blue underline underline-offset-4">
                  Back to the calendar
                </a>
              </p>
            </div>
          </aside>
          <div className="lg:col-span-7 lg:col-start-6">
            <SubmitEventForm available={isServiceConfigured} turnstileSiteKey={isTurnstileEnabled ? turnstileSiteKey : ""} />
          </div>
        </div>
      </section>
    </>
  );
}
