"use client";

import Script from "next/script";
import { useActionState, useEffect, useId, useRef, useState, startTransition, type FormEvent } from "react";
import { submitEvent, type SubmitState } from "@/app/calendar/actions";
import { calendarCopy } from "@/content/calendar";
import { org } from "@/content/site";
import { limits, validateEvent, type Errors } from "@/lib/events/validate";
import { control } from "@/components/Forms";
import { Arrow, cx } from "@/components/ui";
import { Checkbox, EventFields, FieldShell, Fieldset, described } from "./EventFields";

declare global {
  interface Window {
    turnstile?: { reset: (el?: string | HTMLElement) => void };
  }
}

const FIELD_ORDER = [
  "title", "description", "category", "startDate", "startTime", "endDate", "endTime", "venueName", "streetAddress",
  "city", "state", "postalCode", "eventUrl", "admissionType", "admissionPrice", "organizerName", "contactName",
  "contactEmail", "contactPhone", "image", "accuracy",
];

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2));

export function SubmitEventForm({ available, turnstileSiteKey }: { available: boolean; turnstileSiteKey: string }) {
  const idPrefix = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(submitEvent, { status: "idle" });
  const [clientErrors, setClientErrors] = useState<Errors>({});
  const [startedAt] = useState(() => Date.now());
  const [submissionKey, setSubmissionKey] = useState(newKey);
  const [formKey, setFormKey] = useState(0);
  const [dismissed, setDismissed] = useState<SubmitState | null>(null);

  const errors: Errors = { ...(state.status === "invalid" ? state.errors : {}), ...clientErrors };

  useEffect(() => {
    if (state.status === "invalid") {
      const first = FIELD_ORDER.find((f) => state.errors[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
    if (state.status === "invalid" || state.status === "error") window.turnstile?.reset();
    if (state.status === "success") {
      document.getElementById(`${idPrefix}-done`)?.focus();
    }
  }, [state, idPrefix]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    // Submitted by hand (not via the form action) so a server-side error never wipes what the visitor typed.
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const values = Object.fromEntries([...data.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
    const { errors: found } = validateEvent(values, "public");
    const image = data.get("image");
    if (image instanceof File && image.size > limits.imageBytes) found.image = "Images must be 5 MB or smaller.";
    setClientErrors(found);
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    startTransition(() => formAction(data));
  }

  if (state.status === "success" && state !== dismissed) {
    return (
      <div id={`${idPrefix}-done`} tabIndex={-1} role="status" className="border-l-4 border-green bg-white p-6 outline-none sm:p-8">
        <h3 className="display display-sm">{calendarCopy.form.successTitle}</h3>
        {state.duplicate ? (
          <p className="mt-4">
            We already have this submission on file, so there&apos;s no need to send it again. It is pending review, and if approved it
            will appear on our public calendar.
          </p>
        ) : (
          <p className="mt-4">{calendarCopy.form.successText}</p>
        )}
        {!state.duplicate && (
          <p className="mt-3 text-muted">
            {state.email === "sent"
              ? calendarCopy.form.emailSent
              : state.email === "not-sent"
                ? "We weren't able to send a confirmation email just now, but your submission has been saved."
                : "Email confirmations aren't available yet, but your submission has been saved."}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setSubmissionKey(newKey());
            setClientErrors({});
            setFormKey((k) => k + 1);
            setDismissed(state);
          }}
          className="mt-6 font-semibold text-blue underline underline-offset-4 hover:text-navy"
        >
          Submit another event
        </button>
      </div>
    );
  }

  return (
    <form key={formKey} ref={formRef} onSubmit={onSubmit} noValidate encType="multipart/form-data" className="space-y-10">
      {!available && (
        <p className="border-l-4 border-sun bg-white px-4 py-3 text-[0.9375rem]">
          Online event submissions are not open yet. In the meantime, you can send event details to{" "}
          <a href={`mailto:${org.email}`} className="break-all font-semibold underline underline-offset-2">
            {org.email}
          </a>
          .
        </p>
      )}

      <EventFields mode="public" errors={errors} idPrefix={idPrefix} />

      <Fieldset legend="Organizer Information" note="Contact details are for MAA's review only and are never shown publicly.">
        <FieldShell id={`${idPrefix}-organizerName`} label="Organizer / organization name" error={errors.organizerName} className="sm:col-span-2">
          <input {...described(`${idPrefix}-organizerName`, errors.organizerName)} name="organizerName" maxLength={limits.organizer} autoComplete="organization" className={control} />
        </FieldShell>
        <FieldShell id={`${idPrefix}-contactName`} label="Contact person" error={errors.contactName}>
          <input {...described(`${idPrefix}-contactName`, errors.contactName)} name="contactName" maxLength={limits.contactName} autoComplete="name" className={control} />
        </FieldShell>
        <FieldShell id={`${idPrefix}-contactEmail`} label="Contact email" error={errors.contactEmail}>
          <input {...described(`${idPrefix}-contactEmail`, errors.contactEmail)} name="contactEmail" type="email" maxLength={limits.email} autoComplete="email" className={control} />
        </FieldShell>
        <FieldShell id={`${idPrefix}-contactPhone`} label="Contact phone" error={errors.contactPhone} optional>
          <input {...described(`${idPrefix}-contactPhone`, errors.contactPhone)} name="contactPhone" type="tel" maxLength={limits.phone} autoComplete="tel" className={control} />
        </FieldShell>
      </Fieldset>

      <Fieldset legend="Event Image">
        <FieldShell
          id={`${idPrefix}-image`}
          label="Upload an image"
          error={errors.image}
          optional
          className="sm:col-span-2"
          help="JPG, PNG or WebP, up to 5 MB. A wide (landscape) image works best. If you don't add one, the listing uses a category graphic."
        >
          <input
            {...described(`${idPrefix}-image`, errors.image, true)}
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={cx(control, "file:mr-4 file:border-0 file:bg-paper file:px-3 file:py-1.5 file:font-semibold")}
          />
        </FieldShell>
      </Fieldset>

      <div className="space-y-4 border-t border-ink pt-6">
        <Checkbox name="accuracy" label={calendarCopy.form.accuracy} error={errors.accuracy} idPrefix={idPrefix} required />
        <Checkbox name="newsletter" label={calendarCopy.form.newsletter} idPrefix={idPrefix} />
      </div>

      {/* Bot traps: invisible to people. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="submissionKey" value={submissionKey} />

      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
        </>
      )}

      <div>
        <button
          type="submit"
          disabled={pending || !available}
          className="group/btn inline-flex min-h-13 w-full items-center justify-center gap-3 bg-blue px-7 py-3 font-display font-semibold text-white transition-colors [font-stretch:108%] hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Submitting…" : calendarCopy.form.submit}
          <Arrow />
        </button>
        <div role="status" aria-live="polite">
          {(state.status === "invalid" || state.status === "error") && (
            <p className="mt-4 border-l-4 border-[#b3261e] bg-white px-4 py-3 text-[0.9375rem]">{state.message}</p>
          )}
          {Object.keys(clientErrors).length > 0 && state.status !== "invalid" && (
            <p className="mt-4 border-l-4 border-[#b3261e] bg-white px-4 py-3 text-[0.9375rem]">Please correct the highlighted fields.</p>
          )}
          {state.status === "unavailable" && (
            <p className="mt-4 border-l-4 border-sun bg-white px-4 py-3 text-[0.9375rem]">
              Online submissions are not open yet. Please email the details to {org.email}.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
