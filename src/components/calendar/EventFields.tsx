"use client";

import { useState, type ReactNode } from "react";
import { admissionTypes, calendarCopy, categories } from "@/content/calendar";
import { limits, type Errors, type Mode } from "@/lib/events/validate";
import { control } from "@/components/Forms";
import { cx } from "@/components/ui";

export type EventDefaults = Partial<Record<string, string | boolean>>;

const str = (v: string | boolean | undefined) => (typeof v === "string" ? v : "");
const bool = (v: string | boolean | undefined) => v === true || v === "on" || v === "true";

export function FieldShell({
  id,
  label,
  error,
  help,
  optional,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  help?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-3 text-[0.9375rem] font-semibold">
        {label}
        {optional && <span className="text-[0.8125rem] font-normal text-muted">Optional</span>}
      </label>
      {children}
      {help && !error && (
        <p id={`${id}-help`} className="mt-1.5 text-[0.875rem] text-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[0.875rem] font-medium text-[#b3261e]">
          {error}
        </p>
      )}
    </div>
  );
}

/** aria props tying an input to its help or error text. */
export const described = (id: string, error?: string, help?: boolean) => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : help ? `${id}-help` : undefined,
});

export function Fieldset({ legend, children, note }: { legend: string; children: ReactNode; note?: ReactNode }) {
  return (
    <fieldset className="border-t border-ink pt-6">
      <legend className="float-left mb-5 w-full">
        <span className="display display-sm block">{legend}</span>
        {note && <span className="mt-2 block text-[0.9375rem] font-normal text-muted">{note}</span>}
      </legend>
      <div className="clear-both grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function Checkbox({
  name,
  label,
  error,
  defaultChecked,
  onChange,
  idPrefix,
  required,
}: {
  name: string;
  label: ReactNode;
  error?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  idPrefix: string;
  required?: boolean;
}) {
  const id = `${idPrefix}-${name}`;
  return (
    <div className="sm:col-span-2">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-snug">
        <input
          {...described(id, error)}
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          required={required}
          onChange={(e) => onChange?.(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-blue"
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 pl-8 text-[0.875rem] font-medium text-[#b3261e]">
          {error}
        </p>
      )}
    </div>
  );
}

/** Event information, date/time, location and registration fields. */
export function EventFields({
  mode,
  errors,
  defaults = {},
  idPrefix,
}: {
  mode: Mode;
  errors: Errors;
  defaults?: EventDefaults;
  idPrefix: string;
}) {
  const [allDay, setAllDay] = useState(bool(defaults.allDay));
  const [online, setOnline] = useState(bool(defaults.isOnline));
  const [admission, setAdmission] = useState(str(defaults.admissionType));
  const [descLength, setDescLength] = useState(str(defaults.description).length);
  const id = (name: string) => `${idPrefix}-${name}`;
  const descMax = mode === "admin" ? limits.descriptionAdmin : limits.descriptionPublic;

  const text = (name: string, label: string, opts: { type?: string; max?: number; auto?: string; className?: string; optional?: boolean; help?: string; placeholder?: string } = {}) => (
    <FieldShell id={id(name)} label={label} error={errors[name]} help={opts.help} optional={opts.optional} className={opts.className}>
      <input
        {...described(id(name), errors[name], Boolean(opts.help))}
        name={name}
        type={opts.type ?? "text"}
        maxLength={opts.max}
        autoComplete={opts.auto ?? "off"}
        placeholder={opts.placeholder}
        defaultValue={str(defaults[name])}
        className={control}
      />
    </FieldShell>
  );

  return (
    <>
      <Fieldset legend="Event Information">
        {text("title", "Event name", { max: limits.title, className: "sm:col-span-2" })}
        <FieldShell
          id={id("description")}
          label="Event description"
          error={errors.description}
          className="sm:col-span-2"
          help={`${descLength} / ${descMax} characters. Describe the event, who it's for, and what to expect.`}
        >
          <textarea
            {...described(id("description"), errors.description, true)}
            name="description"
            rows={6}
            maxLength={descMax}
            defaultValue={str(defaults.description)}
            onChange={(e) => setDescLength(e.target.value.length)}
            className={cx(control, "resize-y")}
          />
        </FieldShell>
        <FieldShell id={id("category")} label="Event category" error={errors.category} className="sm:col-span-2">
          <select
            {...described(id("category"), errors.category)}
            name="category"
            defaultValue={str(defaults.category)}
            className={cx(control, "min-h-[3.25rem]")}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </FieldShell>
      </Fieldset>

      <Fieldset legend="Date & Time" note="Enter dates and times in Miami local time (Eastern Time).">
        <Checkbox name="allDay" label="All-day event" defaultChecked={allDay} onChange={setAllDay} idPrefix={idPrefix} />
        {text("startDate", "Start date", { type: "date" })}
        {!allDay && text("startTime", "Start time", { type: "time" })}
        {text("endDate", "End date", { type: "date" })}
        {!allDay && text("endTime", "End time", { type: "time" })}
      </Fieldset>

      <Fieldset legend="Location">
        <Checkbox
          name="isOnline"
          label="This is an online event"
          defaultChecked={online}
          onChange={setOnline}
          idPrefix={idPrefix}
        />
        {online ? (
          <p className="text-[0.9375rem] text-muted sm:col-span-2">
            The listing will show &ldquo;Online event.&rdquo; Please don&apos;t include private meeting links or passwords; visitors
            will use your event link to register or join.
          </p>
        ) : (
          <>
            {text("venueName", "Venue name", { max: limits.venue, className: "sm:col-span-2" })}
            {text("streetAddress", "Street address", { max: limits.street, auto: "street-address", className: "sm:col-span-2" })}
            {text("city", "City", { max: limits.city, auto: "address-level2" })}
            <div className="grid grid-cols-2 gap-5">
              <FieldShell id={id("state")} label="State" error={errors.state}>
                <input
                  {...described(id("state"), errors.state)}
                  name="state"
                  maxLength={limits.state}
                  autoComplete="address-level1"
                  defaultValue={str(defaults.state) || "FL"}
                  className={control}
                />
              </FieldShell>
              {text("postalCode", "ZIP code", { max: limits.postal, auto: "postal-code" })}
            </div>
          </>
        )}
      </Fieldset>

      <Fieldset legend="Registration & Verification">
        {text("eventUrl", "Official event website or registration link", {
          type: "url",
          max: limits.url,
          className: "sm:col-span-2",
          help: calendarCopy.form.urlHelp,
          placeholder: "https://",
        })}
        <FieldShell id={id("admissionType")} label="Admission type" error={errors.admissionType}>
          <select
            {...described(id("admissionType"), errors.admissionType)}
            name="admissionType"
            value={admission}
            onChange={(e) => setAdmission(e.target.value)}
            className={cx(control, "min-h-[3.25rem]")}
          >
            <option value="" disabled>
              Select one
            </option>
            {admissionTypes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </FieldShell>
        {admission && admission !== "free" &&
          text("admissionPrice", "Admission price", { max: limits.price, optional: true, placeholder: "e.g. $25, or $15–$40" })}
      </Fieldset>
    </>
  );
}
