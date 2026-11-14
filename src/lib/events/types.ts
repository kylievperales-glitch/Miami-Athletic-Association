import type { AdmissionType, CategoryId, OrganizerType } from "@/content/calendar";

export type EventStatus = "pending" | "draft" | "published" | "rejected" | "archived";
export const eventStatuses: EventStatus[] = ["pending", "draft", "published", "rejected", "archived"];

/** Columns the public may read. Must match the anon column grant in the migration. */
export const PUBLIC_EVENT_COLUMNS =
  "id,title,description,category,all_day,starts_at,ends_at,start_date,end_date,is_online,venue_name,street_address,city,state,postal_code,organizer_name,organizer_type,event_url,admission_type,admission_price,public_image_path";

export type PublicEvent = {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  all_day: boolean;
  starts_at: string;
  ends_at: string;
  start_date: string;
  end_date: string;
  is_online: boolean;
  venue_name: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  organizer_name: string;
  organizer_type: OrganizerType;
  event_url: string;
  admission_type: AdmissionType;
  admission_price: string | null;
  public_image_path: string | null;
};

export type AdminEvent = PublicEvent & {
  status: EventStatus;
  source: "public_submission" | "admin";
  image_path: string | null;
  submitted_at: string | null;
  published_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  event_private: EventPrivate | null;
};

export type EventPrivate = {
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  newsletter_consent: boolean;
  newsletter_consent_at: string | null;
  accuracy_confirmed_at: string | null;
  original_submission: Record<string, unknown> | null;
};

export type AuditEntry = {
  id: number;
  actor_label: string;
  action: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  note: string | null;
  created_at: string;
};

export type OutboxEmail = {
  id: string;
  event_id: string | null;
  kind: "submission_confirmation" | "admin_new_submission" | "event_approved" | "event_rejected";
  to_emails: string[];
  reply_to: string | null;
  subject: string;
  html: string;
  text_body: string;
  status: "pending" | "sending" | "sent" | "failed";
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
};

/** Event fields as written to the database. */
export type EventRecord = {
  title: string;
  description: string;
  category: CategoryId;
  all_day: boolean;
  starts_at: string;
  ends_at: string;
  start_date: string;
  end_date: string;
  is_online: boolean;
  venue_name: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  organizer_name: string;
  event_url: string;
  admission_type: AdmissionType;
  admission_price: string | null;
};

export type ContactRecord = {
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};
