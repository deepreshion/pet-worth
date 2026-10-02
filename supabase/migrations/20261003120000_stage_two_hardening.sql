create table public.storage_cleanup_outbox (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  bucket_id text not null check (bucket_id = 'medical-attachments'),
  object_path text not null,
  created_at timestamptz not null default now(),
  unique (bucket_id, object_path)
);

create index storage_cleanup_outbox_family_created_idx on public.storage_cleanup_outbox(family_id, created_at);
alter table public.storage_cleanup_outbox enable row level security;
revoke all on table public.storage_cleanup_outbox from anon, authenticated;
grant select on table public.storage_cleanup_outbox to authenticated;
create policy "storage_cleanup_outbox_select_editors" on public.storage_cleanup_outbox
  for select to authenticated using (public.can_edit_family(family_id));

create or replace function public.ack_storage_cleanup(p_outbox_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare item public.storage_cleanup_outbox%rowtype; affected integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into item from public.storage_cleanup_outbox where id = p_outbox_id for update;
  if item.id is null or not public.can_edit_family(item.family_id) then
    raise exception 'Cleanup item is not editable' using errcode = '42501';
  end if;
  if exists (select 1 from storage.objects where bucket_id = item.bucket_id and name = item.object_path) then
    raise exception 'Storage object still exists' using errcode = 'P0001';
  end if;
  delete from public.storage_cleanup_outbox where id = p_outbox_id;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Cleanup acknowledgement failed' using errcode = 'P0001'; end if;
  return true;
end;
$$;

create or replace function public.save_medical_event(
  p_event_id uuid, p_pet_id uuid, p_request_id uuid, p_type public.medical_event_type,
  p_title text, p_notes text, p_event_date date, p_event_time time without time zone,
  p_event_timezone text, p_reminder_enabled boolean, p_notification_id integer,
  p_new_attachments jsonb default '[]'::jsonb, p_retained_attachment_ids uuid[] default '{}'::uuid[]
)
returns table (event_id uuid, removed_storage_paths text[], reminder_notification_id integer, reminder_scheduled_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  target_family_id uuid; old_event public.medical_events%rowtype; old_reminder public.reminders%rowtype;
  was_existing boolean := false; expected_retained integer; attachment jsonb; attachment_id uuid;
  attachment_path text; attachment_name text; attachment_type text; attachment_size bigint;
  effective_timezone text; normalized_time time without time zone; calculated_at timestamptz;
  event_fields_changed boolean := false; reminder_changed boolean := false; inserted_attachment boolean;
  removed_record record; object_metadata jsonb; object_mime text; object_size bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(p_new_attachments) <> 'array' then raise exception 'Attachments must be an array' using errcode = '22023'; end if;
  select p.family_id into target_family_id from public.pets p where p.id = p_pet_id;
  if target_family_id is null or not public.can_edit_family(target_family_id) then raise exception 'Medical event is not editable' using errcode = '42501'; end if;
  if exists (select 1 from public.medical_events me where me.created_by = auth.uid() and me.creation_request_id = p_request_id and me.id <> p_event_id) then
    raise exception 'Request id already belongs to another event' using errcode = '23505';
  end if;
  select * into old_event from public.medical_events where id = p_event_id for update;
  was_existing := old_event.id is not null;
  if was_existing and (old_event.pet_id <> p_pet_id or not public.can_edit_family(target_family_id)) then raise exception 'Medical event is not editable' using errcode = '42501'; end if;
  normalized_time := case when p_reminder_enabled then p_event_time else null end;
  effective_timezone := case when was_existing and old_event.event_date is not distinct from p_event_date and old_event.event_time is not distinct from normalized_time then old_event.event_timezone else p_event_timezone end;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = effective_timezone) then raise exception 'Invalid event timezone' using errcode = '22023'; end if;
  if p_reminder_enabled and (p_event_time is null or p_notification_id is null or p_notification_id <= 0) then raise exception 'Reminder time and notification id are required' using errcode = '22023'; end if;
  if p_reminder_enabled then
    calculated_at := ((p_event_date + p_event_time) at time zone effective_timezone) - interval '24 hours';
    if calculated_at < now() then raise exception 'Reminder must be at least 24 hours before the event' using errcode = '22023'; end if;
  end if;
  select r.* into old_reminder from public.reminders r where r.event_id = p_event_id;
  event_fields_changed := not was_existing or old_event.type is distinct from p_type or old_event.title is distinct from trim(p_title)
    or old_event.notes is distinct from nullif(trim(p_notes), '') or old_event.event_date is distinct from p_event_date
    or old_event.event_time is distinct from normalized_time or old_event.event_timezone is distinct from effective_timezone;
  reminder_changed := (p_reminder_enabled <> (old_reminder.id is not null))
    or (p_reminder_enabled and (old_reminder.scheduled_at is distinct from calculated_at or old_reminder.notification_id is distinct from p_notification_id));
  if was_existing then
    if event_fields_changed then
      update public.medical_events set type=p_type, title=trim(p_title), notes=nullif(trim(p_notes),''), event_date=p_event_date, event_time=normalized_time, event_timezone=effective_timezone where id=p_event_id;
      if not found then raise exception 'Medical event update failed' using errcode = 'P0001'; end if;
    end if;
  else
    insert into public.medical_events(id,pet_id,created_by,creation_request_id,type,title,notes,event_date,event_time,event_timezone)
    values(p_event_id,p_pet_id,auth.uid(),p_request_id,p_type,trim(p_title),nullif(trim(p_notes),''),p_event_date,normalized_time,effective_timezone);
  end if;
  if reminder_changed then
    if p_reminder_enabled then
      insert into public.reminders(event_id,created_by,scheduled_at,notification_id) values(p_event_id,auth.uid(),calculated_at,p_notification_id)
      on conflict(event_id) do update set created_by=excluded.created_by,scheduled_at=excluded.scheduled_at,notification_id=excluded.notification_id;
    else delete from public.reminders r where r.event_id=p_event_id; end if;
  end if;
  select count(*) into expected_retained from public.medical_attachments ma where ma.event_id=p_event_id and ma.id=any(p_retained_attachment_ids);
  if expected_retained <> coalesce(array_length(p_retained_attachment_ids,1),0) then raise exception 'Retained attachment does not belong to event' using errcode = '22023'; end if;
  removed_storage_paths := '{}'::text[];
  for removed_record in select ma.id,ma.storage_path from public.medical_attachments ma where ma.event_id=p_event_id and not(ma.id=any(p_retained_attachment_ids)) and not exists(select 1 from jsonb_array_elements(p_new_attachments) x where (x->>'id')::uuid=ma.id) loop
    removed_storage_paths := array_append(removed_storage_paths,removed_record.storage_path);
    insert into public.storage_cleanup_outbox(family_id,created_by,bucket_id,object_path) values(target_family_id,auth.uid(),'medical-attachments',removed_record.storage_path) on conflict(bucket_id,object_path) do nothing;
    insert into public.activity_logs(family_id,actor_user_id,action,entity_type,entity_id) values(target_family_id,auth.uid(),'medical_attachment_removed','medical_attachment',removed_record.id);
  end loop;
  delete from public.medical_attachments ma where ma.event_id=p_event_id and not(ma.id=any(p_retained_attachment_ids)) and not exists(select 1 from jsonb_array_elements(p_new_attachments) x where (x->>'id')::uuid=ma.id);
  for attachment in select value from jsonb_array_elements(p_new_attachments) loop
    attachment_id := (attachment->>'id')::uuid; attachment_path := attachment->>'storage_path'; attachment_name := attachment->>'file_name'; attachment_type := attachment->>'media_type'; attachment_size := (attachment->>'size_bytes')::bigint;
    if split_part(attachment_path,'/',1)<>target_family_id::text or split_part(attachment_path,'/',2)<>p_event_id::text or split_part(attachment_path,'/',3)<>attachment_id::text or split_part(attachment_path,'/',4)<>attachment_name or array_length(string_to_array(attachment_path,'/'),1)<>4 then raise exception 'Invalid canonical attachment path' using errcode='22023'; end if;
    select metadata into object_metadata from storage.objects where bucket_id='medical-attachments' and name=attachment_path;
    if not found then raise exception 'Attachment object is missing' using errcode='22023'; end if;
    object_mime := coalesce(object_metadata->>'mimetype',object_metadata->>'contentType'); object_size := nullif(object_metadata->>'size','')::bigint;
    if object_mime is not null and object_mime<>attachment_type then raise exception 'Attachment content type mismatch' using errcode='22023'; end if;
    if object_size is not null and object_size<>attachment_size then raise exception 'Attachment size mismatch' using errcode='22023'; end if;
    inserted_attachment := not exists(select 1 from public.medical_attachments where id=attachment_id);
    insert into public.medical_attachments(id,event_id,created_by,storage_path,file_name,media_type,size_bytes) values(attachment_id,p_event_id,auth.uid(),attachment_path,attachment_name,attachment_type,attachment_size) on conflict(id) do nothing;
    if not exists(select 1 from public.medical_attachments where id=attachment_id and event_id=p_event_id and storage_path=attachment_path and file_name=attachment_name and media_type=attachment_type and size_bytes=attachment_size) then raise exception 'Attachment id conflict' using errcode='23505'; end if;
    if inserted_attachment then insert into public.activity_logs(family_id,actor_user_id,action,entity_type,entity_id) values(target_family_id,auth.uid(),'medical_attachment_added','medical_attachment',attachment_id); end if;
  end loop;
  if not was_existing then insert into public.activity_logs(family_id,actor_user_id,action,entity_type,entity_id,metadata) values(target_family_id,auth.uid(),'medical_event_created','medical_event',p_event_id,jsonb_build_object('type',p_type,'event_date',p_event_date));
  elsif event_fields_changed or reminder_changed then insert into public.activity_logs(family_id,actor_user_id,action,entity_type,entity_id,metadata) values(target_family_id,auth.uid(),'medical_event_updated','medical_event',p_event_id,jsonb_build_object('type',p_type,'event_date',p_event_date)); end if;
  event_id:=p_event_id; select r.notification_id,r.scheduled_at into reminder_notification_id,reminder_scheduled_at from public.reminders r where r.event_id=p_event_id; return next;
end;
$$;

create or replace function public.delete_medical_event(p_event_id uuid)
returns table (removed_storage_paths text[], reminder_notification_id integer)
language plpgsql security definer set search_path = '' as $$
declare target_family_id uuid; affected integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select p.family_id into target_family_id from public.medical_events me join public.pets p on p.id=me.pet_id where me.id=p_event_id for update of me;
  if target_family_id is null or not public.can_edit_family(target_family_id) then raise exception 'Medical event is not editable' using errcode='42501'; end if;
  select coalesce(array_agg(ma.storage_path),'{}'::text[]) into removed_storage_paths from public.medical_attachments ma where ma.event_id=p_event_id;
  select r.notification_id into reminder_notification_id from public.reminders r where r.event_id=p_event_id;
  insert into public.storage_cleanup_outbox(family_id,created_by,bucket_id,object_path) select target_family_id,auth.uid(),'medical-attachments',ma.storage_path from public.medical_attachments ma where ma.event_id=p_event_id on conflict(bucket_id,object_path) do nothing;
  insert into public.activity_logs(family_id,actor_user_id,action,entity_type,entity_id) select target_family_id,auth.uid(),'medical_attachment_removed','medical_attachment',ma.id from public.medical_attachments ma where ma.event_id=p_event_id;
  insert into public.activity_logs(family_id,actor_user_id,action,entity_type,entity_id) values(target_family_id,auth.uid(),'medical_event_deleted','medical_event',p_event_id);
  delete from public.medical_events where id=p_event_id; get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Medical event delete failed' using errcode='P0001'; end if; return next;
end;
$$;

revoke all on function public.ack_storage_cleanup(uuid) from public,anon;
grant execute on function public.ack_storage_cleanup(uuid) to authenticated;
