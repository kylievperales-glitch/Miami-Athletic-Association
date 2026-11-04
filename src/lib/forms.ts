import { org } from "@/content/site";

/**
 * Form delivery.
 *
 * No newsletter provider or form backend has been chosen yet. Until one is, a
 * form with no endpoint falls back to a pre-filled email draft that the visitor
 * sends themselves. Nothing is ever reported as "sent" in that mode.
 *
 * To connect a form, set its NEXT_PUBLIC_*_ENDPOINT variable (see .env.example).
 * The form then POSTs JSON to that URL and shows a real success or failure state.
 */

export type FormKind = "newsletter" | "partnership" | "general";

export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "email" | "url" | "select" | "textarea";
  required?: boolean;
  autoComplete?: string;
  options?: string[];
  half?: boolean;
};

export type FormConfig = {
  kind: FormKind;
  subject: string;
  fields: FieldConfig[];
};

const endpoints: Record<FormKind, string | undefined> = {
  newsletter: process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT,
  partnership: process.env.NEXT_PUBLIC_PARTNERSHIP_ENDPOINT,
  general: process.env.NEXT_PUBLIC_INQUIRY_ENDPOINT,
};

export const isConnected = (kind: FormKind) => Boolean(endpoints[kind]);

export type Delivery = "sent" | "email-draft" | "failed";

export function mailtoHref(subject: string, lines: string[]) {
  return `mailto:${org.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

export async function deliver(
  kind: FormKind,
  subject: string,
  values: { label: string; name: string; value: string }[],
): Promise<Delivery> {
  const endpoint = endpoints[kind];

  if (!endpoint) {
    const lines = values.filter((v) => v.value).map((v) => `${v.label}: ${v.value}`);
    window.location.href = mailtoHref(`${subject} — Miami Athletic Association website`, lines);
    return "email-draft";
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.fromEntries(values.map((v) => [v.name, v.value]))),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export function validateField(field: Pick<FieldConfig, "type" | "required" | "label">, raw: string) {
  const value = raw.trim();
  if (!value) return field.required ? `Please enter your ${field.label.toLowerCase()}.` : "";
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return "Please enter a valid email address, like name@example.com.";
  }
  if (field.type === "url" && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(value)) {
    return "Please enter a valid website, like example.com.";
  }
  return "";
}
