"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, updatePassword, type FormState } from "@/app/admin/actions";
import { control } from "@/components/Forms";
import { buttonClass } from "./ui";

function Message({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p role="status" className={`border-l-4 bg-paper px-3 py-2 text-[0.9375rem] ${state.ok ? "border-green" : "border-[#b3261e]"}`}>
      {state.message}
    </p>
  );
}

const labelClass = "mb-1.5 block text-[0.9375rem] font-semibold";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={control} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={control} />
      </div>
      <Message state={state} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "min-h-13 w-full")}>
        {pending ? "Signing in…" : "Sign In"}
      </button>
      <p className="text-center text-[0.875rem]">
        <Link href="/admin/forgot-password" className="text-blue underline underline-offset-4">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={control} />
      </div>
      <Message state={state} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "min-h-13 w-full")}>
        {pending ? "Sending…" : "Send Reset Link"}
      </button>
      <p className="text-center text-[0.875rem]">
        <Link href="/admin/login" className="text-blue underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <form action={action} className="max-w-md space-y-5">
      <div>
        <label htmlFor="password" className={labelClass}>New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required aria-describedby="password-note" className={control} />
        <p id="password-note" className={`mt-1.5 text-[0.875rem] ${state.errors?.password ? "text-[#b3261e]" : "text-muted"}`}>
          {state.errors?.password ?? "At least 12 characters."}
        </p>
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={control} />
        {state.errors?.confirm && <p className="mt-1.5 text-[0.875rem] text-[#b3261e]">{state.errors.confirm}</p>}
      </div>
      <Message state={state} />
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Saving…" : "Update Password"}
      </button>
    </form>
  );
}
