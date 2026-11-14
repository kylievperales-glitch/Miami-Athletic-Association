-- =============================================================================
-- Miami Athletic Association: community events calendar
--
-- Security model
--   * anon (public visitors) can read a fixed set of columns of PUBLISHED events,
--     and nothing else. Submissions go through the website's server, which
--     validates them and inserts with the service role.
--   * authenticated users can do nothing unless their user id is in
--     public.admins. Admins can read and manage everything below.
--   * Private organizer contact details live in event_private, which only
--     admins (and the server) can read.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.event_status as enum ('pending', 'draft', 'published', 'rejected', 'archived');
create type public.event_category as enum (
  'running_endurance',
  'sports_competitions',
  'fitness_wellness',
  'networking_community',
  'other'
);
create type public.organizer_type as enum ('maa', 'third_party');
create type public.admission_type as enum ('free', 'paid', 'registration_varies');
create type public.event_source as enum ('public_submission', 'admin');
create type public.email_status as enum ('pending', 'sending', 'sent', 'failed');

-- ---------------------------------------------------------------------------
-- Administrators
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now()
);

comment on table public.admins is
  'Users allowed into the MAA dashboard. Add rows with SQL in the Supabase dashboard; there is no API to self-register.';

-- Security definer so policies can call it without recursing through admins RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------
-- Events (public-facing fields + moderation metadata)
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  status public.event_status not null default 'pending',
  source public.event_source not null,

  title text not null check (char_length(title) between 3 and 140),
  description text not null check (char_length(description) between 20 and 4000),
  category public.event_category not null,

  -- Timing. starts_at/ends_at are exact instants. start_date/end_date are the
  -- Miami calendar dates the event covers, used for calendar placement and as
  -- the source of truth for all-day events.
  all_day boolean not null default false,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  start_date date not null,
  end_date date not null,
  time_zone text not null default 'America/New_York' check (time_zone = 'America/New_York'),

  -- Location
  is_online boolean not null default false,
  venue_name text check (char_length(venue_name) <= 160),
  street_address text check (char_length(street_address) <= 200),
  city text check (char_length(city) <= 100),
  state text check (char_length(state) <= 60),
  postal_code text check (char_length(postal_code) <= 12),

  -- Organizer (public name only; contact details are in event_private)
  organizer_name text not null check (char_length(organizer_name) between 2 and 160),
  organizer_type public.organizer_type not null default 'third_party',

  event_url text not null check (event_url ~* '^https://[^\s]+$' and char_length(event_url) <= 500),
  admission_type public.admission_type not null,
  admission_price text check (char_length(admission_price) <= 80),

  -- Images. image_path is in the private bucket. public_image_path is a copy in
  -- the public bucket that exists only while the event is published.
  image_path text,
  public_image_path text,

  -- Moderation
  submitted_at timestamptz,
  published_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references auth.users (id) on delete set null,
  rejection_reason text check (char_length(rejection_reason) <= 1000),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint events_ends_after_start check (ends_at >= starts_at),
  constraint events_dates_in_order check (end_date >= start_date),
  constraint events_dates_match_times check (
    all_day
    or (
      start_date = (starts_at at time zone time_zone)::date
      and end_date = (ends_at at time zone time_zone)::date
    )
  ),
  constraint events_location_required check (
    is_online
    or (
      coalesce(venue_name, '') <> ''
      and coalesce(street_address, '') <> ''
      and coalesce(city, '') <> ''
      and coalesce(state, '') <> ''
    )
  ),
  constraint events_public_image_only_when_published check (public_image_path is null or status = 'published')
);

create index events_status_dates_idx on public.events (status, start_date, end_date);
create index events_published_range_idx on public.events (start_date, end_date) where status = 'published';
create index events_created_at_idx on public.events (created_at desc);

-- ---------------------------------------------------------------------------
-- Private submission data (admins and server only)
-- ---------------------------------------------------------------------------
create table public.event_private (
  event_id uuid primary key references public.events (id) on delete cascade,
  contact_name text check (char_length(contact_name) <= 120),
  contact_email text check (char_length(contact_email) <= 254),
  contact_phone text check (char_length(contact_phone) <= 40),
  newsletter_consent boolean not null default false,
  newsletter_consent_at timestamptz,
  accuracy_confirmed_at timestamptz,
  -- Snapshot of the event exactly as submitted, kept for review after edits.
  original_submission jsonb,
  -- Idempotency key generated by the submission form; repeats are ignored.
  submission_key text unique,
  -- Salted hash of the submitter's IP, for abuse review. Never the raw IP.
  submitter_fingerprint text,
  created_at timestamptz not null default now(),
  constraint event_private_consent_time check (not newsletter_consent or newsletter_consent_at is not null)
);

create index event_private_contact_email_idx on public.event_private (lower(contact_email));

-- ---------------------------------------------------------------------------
-- Audit trail
-- ---------------------------------------------------------------------------
create table public.event_audit (
  id bigint generated always as identity primary key,
  event_id uuid references public.events (id) on delete set null,
  event_title text,
  actor_id uuid,
  actor_label text not null,
  action text not null,
  changes jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index event_audit_event_idx on public.event_audit (event_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Email outbox
-- Rows are written in the same transaction as the change that triggers them,
-- so a notification is never lost and never queued twice (dedupe_key).
-- ---------------------------------------------------------------------------
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete set null,
  kind text not null check (
    kind in ('submission_confirmation', 'admin_new_submission', 'event_approved', 'event_rejected')
  ),
  dedupe_key text not null unique,
  to_emails text[] not null check (cardinality(to_emails) between 1 and 10),
  reply_to text,
  subject text not null,
  html text not null,
  text_body text not null,
  status public.email_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  provider_message_id text,
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_outbox_due_idx on public.email_outbox (status, next_attempt_at);

-- ---------------------------------------------------------------------------
-- Rate limiting for the public submission endpoint
-- ---------------------------------------------------------------------------
create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  key text not null,
  hit_at timestamptz not null default now()
);

create index rate_limit_hits_key_idx on public.rate_limit_hits (key, hit_at desc);

-- =============================================================================
-- Triggers
-- =============================================================================

create function public.actor_label(p_actor uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select display_name from public.admins where user_id = p_actor),
    case when p_actor is null then 'Website' else 'Unknown user' end
  );
$$;

create function public.events_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if (select auth.uid()) is not null then
    new.updated_by := (select auth.uid());
    if tg_op = 'INSERT' then
      new.created_by := coalesce(new.created_by, (select auth.uid()));
    end if;
  end if;
  return new;
end;
$$;

create trigger events_before_write
before insert or update on public.events
for each row execute function public.events_before_write();

-- Records every insert, edit, status change and deletion.
create function public.events_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_changes jsonb;
  v_action text;
begin
  if tg_op = 'INSERT' then
    insert into public.event_audit (event_id, event_title, actor_id, actor_label, action, changes)
    values (
      new.id, new.title, v_actor, public.actor_label(v_actor),
      case when new.source = 'public_submission' then 'submitted' else 'created' end,
      jsonb_build_object('status', new.status)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value))
      into v_changes
      from jsonb_each(to_jsonb(new)) n
      join jsonb_each(to_jsonb(old)) o using (key)
     where n.value is distinct from o.value
       and n.key not in ('updated_at', 'updated_by', 'public_image_path');
    if v_changes is null then
      return new;
    end if;
    v_action := case
      when new.status is distinct from old.status then
        case new.status
          when 'published' then 'published'
          when 'rejected' then 'rejected'
          when 'archived' then 'archived'
          when 'draft' then (case when old.status = 'published' then 'unpublished' else 'moved_to_draft' end)
          when 'pending' then 'returned_to_pending'
        end
      else 'edited'
    end;
    insert into public.event_audit (event_id, event_title, actor_id, actor_label, action, changes)
    values (new.id, new.title, v_actor, public.actor_label(v_actor), v_action, v_changes);
    return new;
  else
    insert into public.event_audit (event_id, event_title, actor_id, actor_label, action, changes)
    values (null, old.title, v_actor, public.actor_label(v_actor), 'deleted', to_jsonb(old));
    return old;
  end if;
end;
$$;

create trigger events_audit
after insert or update or delete on public.events
for each row execute function public.events_audit();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger email_outbox_touch
before update on public.email_outbox
for each row execute function public.touch_updated_at();

-- =============================================================================
-- Functions
-- =============================================================================

-- Queue an email described as jsonb. Ignored if the dedupe key was used before.
create function public.enqueue_email(p_event_id uuid, p_email jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_email is null or jsonb_typeof(p_email) <> 'object' then
    return;
  end if;
  insert into public.email_outbox (event_id, kind, dedupe_key, to_emails, reply_to, subject, html, text_body)
  values (
    p_event_id,
    p_email ->> 'kind',
    p_email ->> 'dedupe_key',
    array(select jsonb_array_elements_text(p_email -> 'to')),
    p_email ->> 'reply_to',
    p_email ->> 'subject',
    p_email ->> 'html',
    p_email ->> 'text'
  )
  on conflict (dedupe_key) do nothing;
end;
$$;

-- Public submission. Called only by the website server (service role) after
-- validation, bot checks and rate limiting. Atomic and idempotent.
create function public.submit_public_event(p_event jsonb, p_private jsonb, p_emails jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_existing uuid;
  v_id uuid;
  v_email jsonb;
begin
  select event_id into v_existing
    from public.event_private
   where submission_key = p_private ->> 'submission_key';
  if v_existing is not null then
    return jsonb_build_object('result', 'duplicate', 'id', v_existing);
  end if;

  -- Same contact submitting the same event title for the same date.
  select p.event_id into v_existing
    from public.event_private p
    join public.events e on e.id = p.event_id
   where lower(p.contact_email) = lower(p_private ->> 'contact_email')
     and lower(e.title) = lower(p_event ->> 'title')
     and e.start_date = (p_event ->> 'start_date')::date
     and e.status in ('pending', 'published', 'draft')
   limit 1;
  if v_existing is not null then
    return jsonb_build_object('result', 'duplicate', 'id', v_existing);
  end if;

  insert into public.events (
    id, status, source, title, description, category, all_day, starts_at, ends_at, start_date, end_date,
    is_online, venue_name, street_address, city, state, postal_code, organizer_name, organizer_type,
    event_url, admission_type, admission_price, image_path, submitted_at
  )
  values (
    coalesce((p_event ->> 'id')::uuid, gen_random_uuid()), 'pending', 'public_submission',
    p_event ->> 'title', p_event ->> 'description', (p_event ->> 'category')::public.event_category,
    (p_event ->> 'all_day')::boolean, (p_event ->> 'starts_at')::timestamptz, (p_event ->> 'ends_at')::timestamptz,
    (p_event ->> 'start_date')::date, (p_event ->> 'end_date')::date,
    (p_event ->> 'is_online')::boolean, p_event ->> 'venue_name', p_event ->> 'street_address',
    p_event ->> 'city', p_event ->> 'state', p_event ->> 'postal_code',
    p_event ->> 'organizer_name', 'third_party',
    p_event ->> 'event_url', (p_event ->> 'admission_type')::public.admission_type, p_event ->> 'admission_price',
    p_event ->> 'image_path', now()
  )
  returning id into v_id;

  insert into public.event_private (
    event_id, contact_name, contact_email, contact_phone, newsletter_consent, newsletter_consent_at,
    accuracy_confirmed_at, original_submission, submission_key, submitter_fingerprint
  )
  select
    v_id, p_private ->> 'contact_name', p_private ->> 'contact_email', p_private ->> 'contact_phone',
    (p_private ->> 'newsletter_consent')::boolean,
    case when (p_private ->> 'newsletter_consent')::boolean then now() end,
    now(), to_jsonb(e), p_private ->> 'submission_key', p_private ->> 'submitter_fingerprint'
  from public.events e
  where e.id = v_id;

  if p_emails is not null and jsonb_typeof(p_emails) = 'array' then
    for v_email in select * from jsonb_array_elements(p_emails) loop
      perform public.enqueue_email(v_id, v_email || jsonb_build_object('dedupe_key', (v_email ->> 'kind') || ':' || v_id));
    end loop;
  end if;

  return jsonb_build_object('result', 'created', 'id', v_id);
end;
$$;

-- Moderation transitions. Security invoker: RLS applies, and each one checks
-- is_admin() explicitly as well. Each locks the row, so double clicks and
-- concurrent admins cannot apply a transition twice or send duplicate email.
create function public.approve_event(p_event_id uuid, p_email jsonb default null)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_status public.event_status;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select status into v_status from public.events where id = p_event_id for update;
  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;
  if v_status = 'published' then
    return jsonb_build_object('result', 'noop', 'status', v_status);
  end if;

  update public.events
     set status = 'published',
         published_at = now(),
         approved_at = coalesce(approved_at, now()),
         approved_by = coalesce(approved_by, (select auth.uid())),
         rejected_at = null,
         rejected_by = null,
         rejection_reason = null
   where id = p_event_id;

  if p_email is not null then
    perform public.enqueue_email(p_event_id, p_email || jsonb_build_object('dedupe_key', 'event_approved:' || p_event_id));
  end if;

  return jsonb_build_object('result', 'ok', 'status', 'published', 'from', v_status);
end;
$$;

create function public.reject_event(p_event_id uuid, p_reason text default null, p_email jsonb default null)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_status public.event_status;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select status into v_status from public.events where id = p_event_id for update;
  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;
  if v_status = 'rejected' then
    return jsonb_build_object('result', 'noop', 'status', v_status);
  end if;
  if v_status not in ('pending', 'draft') then
    return jsonb_build_object('result', 'invalid', 'status', v_status);
  end if;

  update public.events
     set status = 'rejected',
         rejected_at = now(),
         rejected_by = (select auth.uid()),
         rejection_reason = nullif(btrim(p_reason), '')
   where id = p_event_id;

  if p_email is not null then
    perform public.enqueue_email(p_event_id, p_email || jsonb_build_object('dedupe_key', 'event_rejected:' || p_event_id));
  end if;

  return jsonb_build_object('result', 'ok', 'status', 'rejected', 'from', v_status);
end;
$$;

-- Move between non-publishing states: draft, archived, pending.
create function public.set_event_status(p_event_id uuid, p_status public.event_status)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_status public.event_status;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_status not in ('draft', 'archived', 'pending') then
    return jsonb_build_object('result', 'invalid', 'status', p_status);
  end if;

  select status into v_status from public.events where id = p_event_id for update;
  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;
  if v_status = p_status then
    return jsonb_build_object('result', 'noop', 'status', v_status);
  end if;

  update public.events
     set status = p_status,
         public_image_path = null
   where id = p_event_id;

  return jsonb_build_object('result', 'ok', 'status', p_status, 'from', v_status);
end;
$$;

-- Fixed-window rate limit. Returns false when the caller is over the limit.
create function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));
  delete from public.rate_limit_hits where hit_at < now() - interval '2 days';
  select count(*) into v_count
    from public.rate_limit_hits
   where key = p_key
     and hit_at > now() - make_interval(secs => p_window_seconds);
  if v_count >= p_max then
    return false;
  end if;
  insert into public.rate_limit_hits (key) values (p_key);
  return true;
end;
$$;

-- Claim due emails for sending. SKIP LOCKED lets two workers run at once
-- without picking up the same message. Messages stuck in 'sending' for over
-- 10 minutes (a crashed worker) become due again.
create function public.claim_due_emails(p_limit integer default 10)
returns setof public.email_outbox
language plpgsql
set search_path = ''
as $$
begin
  return query
  update public.email_outbox o
     set status = 'sending',
         locked_at = now(),
         attempts = o.attempts + 1
   where o.id in (
     select id
       from public.email_outbox
      where (status in ('pending', 'failed') and next_attempt_at <= now() and attempts < 6)
         or (status = 'sending' and locked_at < now() - interval '10 minutes')
      order by created_at
      limit p_limit
      for update skip locked
   )
  returning o.*;
end;
$$;

-- Admin "retry now" for a failed email.
create function public.retry_email(p_email_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.email_outbox
     set status = 'pending',
         next_attempt_at = now(),
         attempts = least(attempts, 5)
   where id = p_email_id
     and status = 'failed';
end;
$$;

-- =============================================================================
-- Privileges and Row Level Security
-- Start from nothing, then grant exactly what each role needs.
-- =============================================================================

alter table public.admins enable row level security;
alter table public.events enable row level security;
alter table public.event_private enable row level security;
alter table public.event_audit enable row level security;
alter table public.email_outbox enable row level security;
alter table public.rate_limit_hits enable row level security;

revoke all on public.admins, public.events, public.event_private, public.event_audit, public.email_outbox,
  public.rate_limit_hits from anon, authenticated;
revoke all on sequence public.event_audit_id_seq, public.rate_limit_hits_id_seq from anon, authenticated;

grant all on public.admins, public.events, public.event_private, public.event_audit, public.email_outbox,
  public.rate_limit_hits to service_role;
grant usage on sequence public.event_audit_id_seq, public.rate_limit_hits_id_seq to service_role;

-- Public visitors: published events only, and only these columns.
grant select (
  id, status, title, description, category, all_day, starts_at, ends_at, start_date, end_date, time_zone,
  is_online, venue_name, street_address, city, state, postal_code, organizer_name, organizer_type,
  event_url, admission_type, admission_price, public_image_path, published_at
) on public.events to anon;

create policy "Public can read published events"
  on public.events for select
  to anon
  using (status = 'published');

-- Admins: full management of events and their private data.
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_private to authenticated;
grant select on public.event_audit to authenticated;
grant select, update on public.email_outbox to authenticated;
grant select on public.admins to authenticated;

create policy "Admins manage events"
  on public.events for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage private event data"
  on public.event_private for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins read audit trail"
  on public.event_audit for select
  to authenticated
  using (public.is_admin());

create policy "Admins read email outbox"
  on public.email_outbox for select
  to authenticated
  using (public.is_admin());

create policy "Admins update email outbox"
  on public.email_outbox for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Needed so admin-run functions can queue email under RLS.
grant insert on public.email_outbox to authenticated;
create policy "Admins queue email"
  on public.email_outbox for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins see the admin list"
  on public.admins for select
  to authenticated
  using (public.is_admin());

-- Functions: nothing is executable by default.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.actor_label(uuid) to authenticated, service_role;
grant execute on function public.enqueue_email(uuid, jsonb) to authenticated, service_role;
grant execute on function public.approve_event(uuid, jsonb) to authenticated;
grant execute on function public.reject_event(uuid, text, jsonb) to authenticated;
grant execute on function public.set_event_status(uuid, public.event_status) to authenticated;
grant execute on function public.retry_email(uuid) to authenticated;
grant execute on function public.submit_public_event(jsonb, jsonb, jsonb) to service_role;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
grant execute on function public.claim_due_emails(integer) to service_role;

-- Functions created later in this schema should not be callable by default either.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
