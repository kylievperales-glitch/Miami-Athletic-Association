-- =============================================================================
-- Event image storage
--
--   event-uploads  PRIVATE. Every uploaded image lands here first. Only the
--                  website server and admins can read it.
--   event-images   PUBLIC. The website copies an image here when its event is
--                  published, and removes it when the event is unpublished,
--                  rejected, archived or deleted. Unpublished images are
--                  therefore never reachable through a public URL.
--
-- Uploads are written by the website server with the service role after the
-- file type and size have been checked, so no upload policy for anon exists.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('event-uploads', 'event-uploads', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('event-images', 'event-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins read event uploads"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'event-uploads' and public.is_admin());

create policy "Admins manage event uploads"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('event-uploads', 'event-images') and public.is_admin());

create policy "Admins update event images"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('event-uploads', 'event-images') and public.is_admin())
  with check (bucket_id in ('event-uploads', 'event-images') and public.is_admin());

create policy "Admins delete event images"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('event-uploads', 'event-images') and public.is_admin());
