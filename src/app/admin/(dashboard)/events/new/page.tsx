import { AdminEventForm } from "@/components/admin/AdminEventForm";
import { PageHeader } from "@/components/admin/ui";
import { org } from "@/content/site";
import { requireAdmin } from "@/lib/auth";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add Event" eyebrow="Calendar Management" />
      <p className="mb-6 max-w-2xl text-muted">
        Events added here skip the public review queue. Publish to put the event on the calendar right away, or save it as a draft
        to finish later.
      </p>
      <AdminEventForm mode="create" defaults={{ organizerType: "maa", organizerName: org.name, state: "FL", city: "Miami" }} />
    </>
  );
}
