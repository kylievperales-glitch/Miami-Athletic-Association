"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { org } from "@/content/site";
import { deliver, isConnected, validateField, type Delivery, type FormConfig, type FieldConfig } from "@/lib/forms";
import { Arrow, cx } from "@/components/ui";

export const control =
  "w-full border border-ink/35 bg-white px-4 py-3 text-base text-ink transition-colors placeholder:text-muted hover:border-ink focus:border-blue aria-[invalid=true]:border-[#b3261e]";

function Field({
  field,
  error,
  defaultValue,
  idPrefix,
}: {
  field: FieldConfig;
  error?: string;
  defaultValue?: string;
  idPrefix: string;
}) {
  const id = `${idPrefix}-${field.name}`;
  const common = {
    id,
    name: field.name,
    required: field.required,
    autoComplete: field.autoComplete,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    className: control,
    defaultValue,
  };

  return (
    <div className={cx(field.half ? "sm:col-span-1" : "sm:col-span-2")}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-3 text-[0.9375rem] font-semibold">
        {field.label}
        {!field.required && <span className="text-[0.8125rem] font-normal text-muted">Optional</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea {...common} rows={6} className={cx(control, "resize-y")} />
      ) : field.type === "select" ? (
        <select {...common} defaultValue={defaultValue ?? ""} className={cx(control, "min-h-[3.25rem]")}>
          <option value="" disabled>
            Select one
          </option>
          {field.options?.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input {...common} type={field.type} inputMode={field.type === "url" ? "url" : undefined} />
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[0.875rem] font-medium text-[#b3261e]">
          {error}
        </p>
      )}
    </div>
  );
}

function Outcome({ result, tone = "light" }: { result: Delivery | null; tone?: "light" | "dark" }) {
  const email = (
    <a href={`mailto:${org.email}`} className="break-all font-semibold underline underline-offset-2">
      {org.email}
    </a>
  );
  return (
    <div role="status" aria-live="polite">
      {result && (
        <div
          className={cx(
            "mt-5 border-l-4 px-4 py-3 text-[0.9375rem]",
            result === "failed" ? "border-[#b3261e]" : "border-green",
            tone === "light" ? "bg-paper text-ink" : "bg-white text-ink",
          )}
        >
          {result === "email-draft" && (
            <p>
              Your email app should now be open with a draft. <strong>Nothing has been sent yet</strong>: press send
              there to reach us. If no draft opened, write to {email}.
            </p>
          )}
          {result === "sent" && <p>Thank you. We&apos;ve received your details.</p>}
          {result === "failed" && <p>That didn&apos;t go through. Please try again, or write to {email}.</p>}
        </div>
      )}
    </div>
  );
}

/** Partnership and general inquiry form, driven by config in content/forms.ts. */
export function InquiryForm({ config, defaults }: { config: FormConfig; defaults?: Record<string, string> }) {
  const idPrefix = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Delivery | null>(null);
  const connected = isConnected(config.kind);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const values = config.fields.map((f) => ({
      name: f.name,
      label: f.label,
      value: String(data.get(f.name) ?? "").trim(),
    }));

    const next: Record<string, string> = {};
    config.fields.forEach((f, i) => {
      const message = validateField(f, values[i].value);
      if (message) next[f.name] = message;
    });
    setErrors(next);
    setResult(null);

    const firstBad = config.fields.find((f) => next[f.name]);
    if (firstBad) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstBad.name}"]`)?.focus();
      return;
    }

    setBusy(true);
    const outcome = await deliver(config.kind, config.subject, values);
    setBusy(false);
    setResult(outcome);
    if (outcome === "sent") formRef.current?.reset();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {config.fields.map((f) => (
          <Field key={f.name} field={f} error={errors[f.name]} defaultValue={defaults?.[f.name]} idPrefix={idPrefix} />
        ))}
      </div>

      {!connected && (
        <p className="mt-5 text-[0.9375rem] text-muted">
          Online submission isn&apos;t available yet. This button opens your email app with your message filled in, ready
          for you to review and send.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="group/btn mt-5 inline-flex min-h-13 w-full items-center justify-center gap-3 bg-blue px-7 py-3 font-display font-semibold text-white transition-colors [font-stretch:108%] hover:bg-navy disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Sending…" : connected ? "Send Message" : "Open Email to Send"}
        <Arrow />
      </button>

      <Outcome result={result} />
    </form>
  );
}

/** Newsletter signup. Never reports a subscription until a provider is connected. */
export function Newsletter({ tone = "light", id }: { tone?: "light" | "dark"; id?: string }) {
  const inputId = useId();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Delivery | null>(null);
  const connected = isConnected("newsletter");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    const message = validateField({ type: "email", required: true, label: "email address" }, email);
    setError(message);
    setResult(null);
    if (message) {
      e.currentTarget.querySelector("input")?.focus();
      return;
    }
    setBusy(true);
    const outcome = await deliver("newsletter", "Newsletter request", [
      { name: "email", label: "Please add this address to MAA updates", value: email },
    ]);
    setBusy(false);
    setResult(outcome);
  }

  const dark = tone === "dark";

  return (
    <form id={id} onSubmit={onSubmit} noValidate className="w-full">
      <label htmlFor={inputId} className={cx("mb-2 block text-[0.9375rem] font-semibold", dark && "text-white")}>
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-0">
        <input
          id={inputId}
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-note`}
          className={cx(control, "min-h-13 flex-1 sm:border-r-0")}
        />
        <button
          type="submit"
          disabled={busy}
          className={cx(
            "group/btn inline-flex min-h-13 items-center justify-center gap-3 px-6 font-display font-semibold transition-colors [font-stretch:108%] disabled:cursor-wait disabled:opacity-60",
            dark ? "bg-sun text-ink hover:bg-white" : "bg-blue text-white hover:bg-navy",
          )}
        >
          {busy ? "Sending…" : connected ? "Subscribe" : "Subscribe by Email"}
          <Arrow />
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} className={cx("mt-2 text-[0.875rem] font-medium", dark ? "text-sun" : "text-[#b3261e]")}>
          {error}
        </p>
      ) : (
        !connected && (
          <p id={`${inputId}-note`} className={cx("mt-2.5 text-[0.875rem]", dark ? "text-white/85" : "text-muted")}>
            Online signup is coming soon. For now, this opens your email app with a request to join our list.
          </p>
        )
      )}
      <Outcome result={result} tone={tone} />
    </form>
  );
}
