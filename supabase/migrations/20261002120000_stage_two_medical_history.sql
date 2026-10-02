create type public.medical_event_type as enum ('vaccination', 'vet_visit', 'analysis', 'procedure');

create table public.medical_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  creation_request_id uuid not null,
  type public.medical_event_type not null,
  title text not null check (char_length(trim(title)) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 10000),
  event_date date not null,
  event_time time without time zone,
  event_timezone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, creation_request_id)
);

create table public.medical_attachments (
  id uuid primary key,
  event_id uuid not null references public.medical_events(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  storage_path text not null unique,
  file_name text not null check (char_length(trim(file_name)) between 1 and 255 and position('/' in file_name) = 0),
  media_type text not null check (media_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  created_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.medical_events(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  scheduled_at timestamptz not null,
  notification_id integer not null check (notification_id > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id),
  action text not null check (action in ('medical_event_created', 'medical_event_updated', 'medical_event_deleted', 'medical_attachment_added', 'medical_attachment_removed')),
  entity_type text not null check (entity_type in ('medical_event', 'medical_attachment')),
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index medical_events_pet_date_idx on public.medical_events(pet_id, event_date desc, created_at desc);
create index medical_events_created_by_idx on public.medical_events(created_by);
create index medical_attachments_event_idx on public.medical_attachments(event_id);
create index medical_attachments_created_by_idx on public.medical_attachments(created_by);
create index reminders_created_by_scheduled_idx on public.reminders(created_by, scheduled_at);
create index activity_logs_family_created_idx on public.activity_logs(family_id, created_at desc);
create index activity_logs_actor_idx on public.activity_logs(actor_user_id);
create index activity_logs_action_entity_idx on public.activity_logs(action, entity_id);

create trigger medical_events_set_updated_at before update on public.medical_events for each row execute function public.set_updated_at();
create trigger reminders_set_updated_at before update on public.reminders for each row execute function public.set_updated_at();

create or replace function public.protect_medical_event_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.pet_id is distinct from old.pet_id or new.created_by is distinct from old.created_by or new.creation_request_id is distinct from old.creation_request_id then
    raise exception 'Medical event identity cannot be changed' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger medical_events_protect_identity before update on public.medical_events for each row execute function public.protect_medical_event_identity();

create or replace function public.validate_medical_attachment_path()
returns trigger language plpgsql set search_path = '' as $$
declare target_family_id uuid;
begin
  select p.family_id into target_family_id from public.medical_events me join public.pets p on p.id = me.pet_id where me.id = new.event_id;
  if target_family_id is null
    or split_part(new.storage_path, '/', 1) <> target_family_id::text
    or split_part(new.storage_path, '/', 2) <> new.event_id::text
    or split_part(new.storage_path, '/', 3) <> new.id::text
    or split_part(new.storage_path, '/', 4) <> new.file_name
    or array_length(string_to_array(new.storage_path, '/'), 1) <> 4 then
    raise exception 'Invalid canonical attachment path' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger medical_attachments_validate_path before insert or update on public.medical_attachments for each row execute function public.validate_medical_attachment_path();

create or replace function public.validate_reminder_schedule()
returns trigger language plpgsql set search_path = '' as $$
declare expected_at timestamptz;
begin
  select ((me.event_date + me.event_time) at time zone me.event_timezone) - interval '24 hours'
  into expected_at from public.medical_events me where me.id = new.event_id and me.event_time is not null;
  if expected_at is null or new.scheduled_at is distinct from expected_at then
    raise exception 'Reminder must be scheduled exactly 24 hours before the event' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger reminders_validate_schedule before insert or update on public.reminders for each row execute function public.validate_reminder_schedule();

alter table public.medical_events enable row level security;
alter table public.medical_attachments enable row level security;
alter table public.reminders enable row level security;
alter table public.activity_logs enable row level security;

revoke all on table public.medical_events, public.medical_attachments, public.reminders, public.activity_logs from anon, authenticated;
grant usage on type public.medical_event_type to authenticated;
grant select on table public.medical_events, public.medical_attachments, public.reminders, public.activity_logs to authenticated;

create policy "medical_events_select_members" on public.medical_events for select to authenticated using (
  exists (select 1 from public.pets p where p.id = medical_events.pet_id and public.is_family_member(p.family_id))
);
create policy "medical_attachments_select_members" on public.medical_attachments for select to authenticated using (
  exists (select 1 from public.medical_events me join public.pets p on p.id = me.pet_id where me.id = medical_attachments.event_id and public.is_family_member(p.family_id))
);
create policy "reminders_select_members" on public.reminders for select to authenticated using (
  exists (select 1 from public.medical_events me join public.pets p on p.id = me.pet_id where me.id = reminders.event_id and public.is_family_member(p.family_id))
);
create policy "activity_logs_select_members" on public.activity_logs for select to authenticated using (public.is_family_member(family_id));

create or replace function public.save_medical_event(
  p_event_id uuid,
  p_pet_id uuid,
  p_request_id uuid,
  p_type public.medical_event_type,
  p_title text,
  p_notes text,
  p_event_date date,
  p_event_time time without time zone,
  p_event_timezone text,
  p_reminder_enabled boolean,
  p_notification_id integer,
  p_new_attachments jsonb default '[]'::jsonb,
  p_retained_attachment_ids uuid[] default '{}'::uuid[]
)
returns table (event_id uuid, removed_storage_paths text[], reminder_notification_id integer, reminder_scheduled_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  target_family_id uuid;
  existing_event_id uuid;
  was_existing boolean := false;
  expected_retained integer;
  attachment jsonb;
  attachment_id uuid;
  attachment_path text;
  attachment_name text;
  attachment_type text;
  attachment_size bigint;
  calculated_at timestamptz;
  removed_record record;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_event_timezone) then
    raise exception 'Invalid event timezone' using errcode = '22023';
  end if;
  select p.family_id into target_family_id from public.pets p where p.id = p_pet_id;
  if target_family_id is null or not public.can_edit_family(target_family_id) then
    raise exception 'Medical event is not editable' using errcode = '42501';
  end if;

  select me.id into existing_event_id from public.medical_events me
  where me.created_by = auth.uid() and me.creation_request_id = p_request_id;
  if existing_event_id is not null and existing_event_id <> p_event_id then
    raise exception 'Request id already belongs to another event' using errcode = '23505';
  end if;

  select exists(select 1 from public.medical_events me where me.id = p_event_id) into was_existing;
  if was_existing then
    if not exists (
      select 1 from public.medical_events me join public.pets p on p.id = me.pet_id
      where me.id = p_event_id and me.pet_id = p_pet_id and public.can_edit_family(p.family_id)
    ) then raise exception 'Medical event is not editable' using errcode = '42501'; end if;
    update public.medical_events set type = p_type, title = trim(p_title), notes = nullif(trim(p_notes), ''), event_date = p_event_date,
      event_time = case when p_reminder_enabled then p_event_time else null end, event_timezone = p_event_timezone
    where id = p_event_id;
    if not found then raise exception 'Medical event update failed' using errcode = 'P0001'; end if;
  else
    insert into public.medical_events (id, pet_id, created_by, creation_request_id, type, title, notes, event_date, event_time, event_timezone)
    values (p_event_id, p_pet_id, auth.uid(), p_request_id, p_type, trim(p_title), nullif(trim(p_notes), ''), p_event_date,
      case when p_reminder_enabled then p_event_time else null end, p_event_timezone);
  end if;

  if p_reminder_enabled then
    if p_event_time is null or p_notification_id is null or p_notification_id <= 0 then
      raise exception 'Reminder time and notification id are required' using errcode = '22023';
    end if;
    calculated_at := ((p_event_date + p_event_time) at time zone p_event_timezone) - interval '24 hours';
    if calculated_at < now() then raise exception 'Reminder must be at least 24 hours before the event' using errcode = '22023'; end if;
    insert into public.reminders (event_id, created_by, scheduled_at, notification_id)
    values (p_event_id, auth.uid(), calculated_at, p_notification_id)
    on conflict (event_id) do update set created_by = excluded.created_by, scheduled_at = excluded.scheduled_at, notification_id = excluded.notification_id;
  else
    delete from public.reminders where reminders.event_id = p_event_id;
  end if;

  if jsonb_typeof(p_new_attachments) <> 'array' then raise exception 'Attachments must be an array' using errcode = '22023'; end if;
  select count(*) into expected_retained from public.medical_attachments ma
  where ma.event_id = p_event_id and ma.id = any(p_retained_attachment_ids);
  if expected_retained <> coalesce(array_length(p_retained_attachment_ids, 1), 0) then
    raise exception 'Retained attachment does not belong to event' using errcode = '22023';
  end if;

  select coalesce(array_agg(ma.storage_path), '{}'::text[]) into removed_storage_paths
  from public.medical_attachments ma where ma.event_id = p_event_id
    and not (ma.id = any(p_retained_attachment_ids))
    and not exists (select 1 from jsonb_array_elements(p_new_attachments) incoming where (incoming ->> 'id')::uuid = ma.id);
  for removed_record in select ma.id from public.medical_attachments ma where ma.event_id = p_event_id
    and not (ma.id = any(p_retained_attachment_ids))
    and not exists (select 1 from jsonb_array_elements(p_new_attachments) incoming where (incoming ->> 'id')::uuid = ma.id) loop
    insert into public.activity_logs (family_id, actor_user_id, action, entity_type, entity_id)
    values (target_family_id, auth.uid(), 'medical_attachment_removed', 'medical_attachment', removed_record.id);
  end loop;
  delete from public.medical_attachments ma where ma.event_id = p_event_id
    and not (ma.id = any(p_retained_attachment_ids))
    and not exists (select 1 from jsonb_array_elements(p_new_attachments) incoming where (incoming ->> 'id')::uuid = ma.id);

  for attachment in select value from jsonb_array_elements(p_new_attachments) loop
    attachment_id := (attachment ->> 'id')::uuid;
    attachment_path := attachment ->> 'storage_path';
    attachment_name := attachment ->> 'file_name';
    attachment_type := attachment ->> 'media_type';
    attachment_size := (attachment ->> 'size_bytes')::bigint;
    if split_part(attachment_path, '/', 1) <> target_family_id::text
      or split_part(attachment_path, '/', 2) <> p_event_id::text
      or split_part(attachment_path, '/', 3) <> attachment_id::text
      or split_part(attachment_path, '/', 4) <> attachment_name
      or array_length(string_to_array(attachment_path, '/'), 1) <> 4 then
      raise exception 'Invalid canonical attachment path' using errcode = '22023';
    end if;
    insert into public.medical_attachments (id, event_id, created_by, storage_path, file_name, media_type, size_bytes)
    values (attachment_id, p_event_id, auth.uid(), attachment_path, attachment_name, attachment_type, attachment_size)
    on conflict (id) do nothing;
    if not exists (
      select 1 from public.medical_attachments ma where ma.id = attachment_id and ma.event_id = p_event_id
        and ma.storage_path = attachment_path and ma.file_name = attachment_name and ma.media_type = attachment_type and ma.size_bytes = attachment_size
    ) then raise exception 'Attachment id conflict' using errcode = '23505'; end if;
    if not was_existing or not exists (select 1 from public.activity_logs al where al.action = 'medical_attachment_added' and al.entity_id = attachment_id) then
      insert into public.activity_logs (family_id, actor_user_id, action, entity_type, entity_id)
      values (target_family_id, auth.uid(), 'medical_attachment_added', 'medical_attachment', attachment_id);
    end if;
  end loop;

  insert into public.activity_logs (family_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (target_family_id, auth.uid(), case when was_existing then 'medical_event_updated' else 'medical_event_created' end,
    'medical_event', p_event_id, jsonb_build_object('type', p_type, 'event_date', p_event_date));

  event_id := p_event_id;
  select r.notification_id, r.scheduled_at into reminder_notification_id, reminder_scheduled_at from public.reminders r where r.event_id = p_event_id;
  return next;
end;
$$;

create or replace function public.delete_medical_event(p_event_id uuid)
returns table (removed_storage_paths text[], reminder_notification_id integer)
language plpgsql security definer set search_path = '' as $$
declare target_family_id uuid; affected integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select p.family_id into target_family_id from public.medical_events me join public.pets p on p.id = me.pet_id where me.id = p_event_id for update of me;
  if target_family_id is null or not public.can_edit_family(target_family_id) then
    raise exception 'Medical event is not editable' using errcode = '42501';
  end if;
  select coalesce(array_agg(ma.storage_path), '{}'::text[]) into removed_storage_paths from public.medical_attachments ma where ma.event_id = p_event_id;
  select r.notification_id into reminder_notification_id from public.reminders r where r.event_id = p_event_id;
  insert into public.activity_logs (family_id, actor_user_id, action, entity_type, entity_id)
  select target_family_id, auth.uid(), 'medical_attachment_removed', 'medical_attachment', ma.id
  from public.medical_attachments ma where ma.event_id = p_event_id;
  insert into public.activity_logs (family_id, actor_user_id, action, entity_type, entity_id)
  values (target_family_id, auth.uid(), 'medical_event_deleted', 'medical_event', p_event_id);
  delete from public.medical_events where id = p_event_id;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Medical event delete failed' using errcode = 'P0001'; end if;
  return next;
end;
$$;

revoke all on function public.protect_medical_event_identity() from public;
revoke all on function public.validate_medical_attachment_path() from public;
revoke all on function public.validate_reminder_schedule() from public;
revoke all on function public.save_medical_event(uuid, uuid, uuid, public.medical_event_type, text, text, date, time without time zone, text, boolean, integer, jsonb, uuid[]) from public, anon;
revoke all on function public.delete_medical_event(uuid) from public, anon;
grant execute on function public.save_medical_event(uuid, uuid, uuid, public.medical_event_type, text, text, date, time without time zone, text, boolean, integer, jsonb, uuid[]) to authenticated;
grant execute on function public.delete_medical_event(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medical-attachments', 'medical-attachments', false, 20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "medical_attachments_objects_select_members" on storage.objects for select to authenticated using (
  bucket_id = 'medical-attachments' and exists (
    select 1 from public.family_memberships fm where fm.family_id::text = split_part(name, '/', 1) and fm.user_id = (select auth.uid())
  )
);
create policy "medical_attachments_objects_insert_editors" on storage.objects for insert to authenticated with check (
  bucket_id = 'medical-attachments' and array_length(string_to_array(name, '/'), 1) = 4 and exists (
    select 1 from public.family_memberships fm where fm.family_id::text = split_part(name, '/', 1)
      and fm.user_id = (select auth.uid()) and fm.role in ('owner', 'member')
  )
);
create policy "medical_attachments_objects_delete_editors" on storage.objects for delete to authenticated using (
  bucket_id = 'medical-attachments' and exists (
    select 1 from public.family_memberships fm where fm.family_id::text = split_part(name, '/', 1)
      and fm.user_id = (select auth.uid()) and fm.role in ('owner', 'member')
  )
);
