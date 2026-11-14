import { ForgotForm } from "@/components/admin/AuthForms";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="display text-[1.75rem]">Reset Your Password</h1>
      <p className="mt-2 text-[0.9375rem] text-muted">Enter your dashboard email address and we&apos;ll send you a link to choose a new password.</p>
      <div className="mt-7">
        <ForgotForm />
      </div>
    </>
  );
}
