"use client";

import { useActionState, useEffect, useId, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/admin/actions";
import { cx } from "@/components/ui";
import { buttonClass, type BtnVariant } from "./ui";

type Action = (prev: FormState, data: FormData) => Promise<FormState>;

function SubmitButton({ children, variant, pendingLabel, className }: { children: ReactNode; variant: BtnVariant; pendingLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={buttonClass(variant, className)}>
      {pending ? pendingLabel : children}
    </button>
  );
}

function Result({ state }: { state: FormState }) {
  return (
    <div role="status" aria-live="polite">
      {state.message && (
        <p className={cx("mt-2 border-l-4 bg-white px-3 py-2 text-[0.875rem]", state.ok ? "border-green" : "border-[#b3261e]")}>{state.message}</p>
      )}
    </div>
  );
}

/**
 * A single-button server action. The button disables itself while the request
 * runs; the server action is also idempotent, so a repeated request is harmless.
 */
export function ActionButton({
  action,
  fields,
  children,
  variant = "outline",
  pendingLabel = "Working…",
  className,
}: {
  action: Action;
  fields: Record<string, string>;
  children: ReactNode;
  variant?: BtnVariant;
  pendingLabel?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton variant={variant} pendingLabel={pendingLabel}>
        {children}
      </SubmitButton>
      <Result state={state} />
    </form>
  );
}

/** A server action behind a confirmation dialog, optionally with extra inputs. */
export function ConfirmAction({
  action,
  fields,
  trigger,
  title,
  body,
  confirmLabel,
  variant = "danger",
  triggerVariant,
  extra,
}: {
  action: Action;
  fields: Record<string, string>;
  trigger: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  variant?: BtnVariant;
  triggerVariant?: BtnVariant;
  extra?: ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (state.message) dialog.current?.close();
  }, [state]);

  return (
    <div>
      <button type="button" onClick={() => dialog.current?.showModal()} className={buttonClass(triggerVariant ?? variant)}>
        {trigger}
      </button>
      <Result state={state} />
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] border border-ink bg-white p-0 text-ink backdrop:bg-ink/50"
      >
        <form action={formAction} className="p-6">
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <h2 id={titleId} className="display text-[1.5rem]">
            {title}
          </h2>
          <div className="mt-3 text-[0.9375rem] text-muted">{body}</div>
          {extra && <div className="mt-5">{extra}</div>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => dialog.current?.close()} className={buttonClass("outline")}>
              Cancel
            </button>
            <SubmitButton variant={variant} pendingLabel="Working…">
              {confirmLabel}
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </div>
  );
}
