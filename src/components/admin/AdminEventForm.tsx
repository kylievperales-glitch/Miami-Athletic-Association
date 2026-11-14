"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createEvent, updateEvent, type FormState } from "@/app/admin/actions";
import { Checkbox, EventFields, FieldShell, Fieldset, described, type EventDefaults } from "@/components/calendar/EventFields";
import { control } from "@/components/Forms";
import { cx } from "@/components/ui";
import { organizerTypes } from "@/content/calendar";
import { limits, validateEvent, type Errors } from "@/lib/events/validate";
import { buttonClass } from "./ui";

type Props =
  | { mode: "create"; defaults?: EventDefaults }
  | { mode: "edit"; defaults: EventDefaults; id: string; updatedAt: string; hasImage: boolean; status: string };

export function AdminEventForm(props: Props) {
  const idPrefix = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.mode === "create" ? createEvent : updateEvent, {});
  const [clientErrors, setClientErrors] = useState<Errors>({});
  const errors = { ...(state.errors ?? {}), ...clientErrors };
  const d = props.defaults ?? {};

  useEffect(() => {
    const first = Object.keys(state.errors ?? {})[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }, [state]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) data.set(submitter.name, submitter.value);
    const values = Object.fromEntries([...data.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
    const { errors: found } = validateEvent(values, "admin");
    const image = data.get("image");
    if (image instanceof File && image.size > limits.imageBytes) found.image = "Images must be 5 MB or smaller.";
    setClientErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    startTransition(() => formAction(data));
  }

  const text = (name: string, label: string, opts: { type?: string; max?: number; optional?: boolean } = {}) => (
    <FieldShell id={`${idPrefix}-${name}`} label={label} error={errors[name]} optional={opts.optional}>
      <input
        {...described(`${idPrefix}-${name}`, errors[name])}
        name={name}
        type={opts.type ?? "text"}
        maxLength={opts.max}
        defaultValue={typeof d[name] === "string" ? (d[name] as string) : ""}
        className={control}
      />
    </FieldShell>
  );

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-10 border border-line bg-white p-5 sm:p-8">
      {props.mode === "edit" && (
        <>
          <input type="hidden" name="id" value={props.id} />
          <input type="hidden" name="updatedAt" value={props.updatedAt} />
        </>
      )}

      <EventFields mode="admin" errors={errors} defaults={d} idPrefix={idPrefix} />

      <Fieldset legend="Organizer">
        {text("organizerName", "Organizer / organization name", { max: limits.organizer })}
        <FieldShell id={`${idPrefix}-organizerType`} label="Organizer type" error={errors.organizerType}>
          <select
            {...described(`${idPrefix}-organizerType`, errors.organizerType)}
            name="organizerType"
            defaultValue={typeof d.organizerType === "string" ? d.organizerType : "third_party"}
            className={cx(control, "min-h-[3.25rem]")}
          >
            {organizerTypes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldShell>
        <p className="text-[0.875rem] text-muted sm:col-span-2">
          MAA events are labeled &ldquo;MAA Event&rdquo; and don&apos;t show the third-party disclaimer.
        </p>
      </Fieldset>

      <Fieldset legend="Private Contact" note="Never shown publicly. Optional for events added here.">
        {text("contactName", "Contact person", { max: limits.contactName, optional: true })}
        {text("contactEmail", "Contact email", { type: "email", max: limits.email, optional: true })}
        {text("contactPhone", "Contact phone", { type: "tel", max: limits.phone, optional: true })}
      </Fieldset>

      <Fieldset legend="Image">
        <FieldShell
          id={`${idPrefix}-image`}
          label={props.mode === "edit" && props.hasImage ? "Replace image" : "Upload an image"}
          error={errors.image}
          optional
          className="sm:col-span-2"
          help="JPG, PNG or WebP, up to 5 MB."
        >
          <input
            {...described(`${idPrefix}-image`, errors.image, true)}
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={cx(control, "file:mr-4 file:border-0 file:bg-paper file:px-3 file:py-1.5 file:font-semibold")}
          />
        </FieldShell>
        {props.mode === "edit" && props.hasImage && (
          <Checkbox name="removeImage" label="Remove the current image (use the category graphic instead)" idPrefix={idPrefix} />
        )}
      </Fieldset>

      <div className="flex flex-col gap-4 border-t border-ink pt-6 sm:flex-row sm:items-center">
        {props.mode === "create" ? (
          <>
            <button type="submit" name="intent" value="publish" disabled={pending} className={buttonClass("green", "min-h-13 px-6")}>
              {pending ? "Saving…" : "Publish Event"}
            </button>
            <button type="submit" name="intent" value="draft" disabled={pending} className={buttonClass("outline", "min-h-13 px-6")}>
              Save as Draft
            </button>
          </>
        ) : (
          <button type="submit" disabled={pending} className={buttonClass("primary", "min-h-13 px-6")}>
            {pending ? "Saving…" : props.status === "published" ? "Save Changes (updates the live listing)" : "Save Changes"}
          </button>
        )}
      </div>
      <div role="status" aria-live="polite">
        {state.message && <p className="border-l-4 border-[#b3261e] bg-paper px-4 py-3 text-[0.9375rem]">{state.message}</p>}
        {!state.message && Object.keys(clientErrors).length > 0 && (
          <p className="border-l-4 border-[#b3261e] bg-paper px-4 py-3 text-[0.9375rem]">Please correct the highlighted fields.</p>
        )}
      </div>
    </form>
  );
}
