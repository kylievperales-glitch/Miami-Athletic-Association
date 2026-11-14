import { PasswordForm } from "@/components/admin/AuthForms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <>
      <PageHeader title="Account" eyebrow="Signed in as" />
      <Panel title={`${admin.name} · ${admin.email}`}>
        <h2 className="mb-4 font-semibold">Change password</h2>
        <PasswordForm />
      </Panel>
    </>
  );
}
