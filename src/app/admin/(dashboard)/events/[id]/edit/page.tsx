import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEventForm } from "@/components/admin/AdminEventForm";
import { Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { getEvent } from "@/lib/events/admin";
import { miamiTimeOf } from "@/lib/time";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const e = await getEvent(supabase, id);
  if (!e) notFound();
  const p = e.event_private;

  const defaults = {
    title: e.title,
    description: e.description,
    category: e.category,
    allDay: e.all_day,
    startDate: e.start_date,
    endDate: e.end_date,
    startTime: e.all_day ? "" : miamiTimeOf(e.starts_at),
    endTime: e.all_day ? "" : miamiTimeOf(e.ends_at),
    isOnline: e.is_online,
    venueName: e.venue_name ?? "",
    streetAddress: e.street_address ?? "",
    city: e.city ?? "",
    state: e.state ?? "",
    postalCode: e.postal_code ?? "",
    eventUrl: e.event_url,
    admissionType: e.admission_type,
    admissionPrice: e.admission_price ?? "",
    organizerName: e.organizer_name,
    organizerType: e.organizer_type,
    contactName: p?.contact_name ?? "",
    contactEmail: p?.contact_email ?? "",
    contactPhone: p?.contact_phone ?? "",
  };

  return (
    <>
      <p className="mb-4 text-[0.875rem]">
        <Link href={`/admin/events/${e.id}`} className="text-blue underline-offset-4 hover:underline">
          ← Back to review
        </Link>
      </p>
      <PageHeader title="Edit Event" eyebrow={e.title}>
        <StatusBadge status={e.status} />
      </PageHeader>
      {e.status === "published" && (
        <div className="mb-6">
          <Notice tone="warning">This event is live. Saved changes appear on the public calendar immediately.</Notice>
        </div>
      )}
      {e.source === "public_submission" && (
        <p className="mb-6 text-[0.9375rem] text-muted">The original submission is kept, and changes are listed on the review page.</p>
      )}
      <AdminEventForm mode="edit" id={e.id} updatedAt={e.updated_at} hasImage={Boolean(e.image_path)} status={e.status} defaults={defaults} />
    </>
  );
}
