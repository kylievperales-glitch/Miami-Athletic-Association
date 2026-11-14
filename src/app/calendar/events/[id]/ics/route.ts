import { icsFile } from "@/lib/events/addToCalendar";
import { getPublishedEvent } from "@/lib/events/public";
import { siteUrl } from "@/lib/metadata";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getPublishedEvent(id);
  if (!event) return new Response("Not found", { status: 404 });
  const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";
  return new Response(icsFile(event, `${siteUrl}/calendar/events/${event.id}`), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
