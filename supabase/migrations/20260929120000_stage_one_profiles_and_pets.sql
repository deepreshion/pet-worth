drop policy if exists "pets_update_editors" on public.pets;
revoke update on table public.pets from authenticated;

create or replace function public.update_pet_with_weight(
  p_pet_id uuid,
  p_name text,
  p_species public.pet_species,
  p_breed text default null,
  p_sex public.pet_sex default null,
  p_birth_date date default null,
  p_birth_date_approximate boolean default false,
  p_weight_kg numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_family_id uuid;
  latest_weight numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select family_id into target_family_id from public.pets where id = p_pet_id;
  if target_family_id is null or not public.can_edit_family(target_family_id) then
    raise exception 'Pet is not editable' using errcode = '42501';
  end if;

  update public.pets
  set name = trim(p_name), species = p_species, breed = nullif(trim(p_breed), ''), sex = p_sex,
      birth_date = p_birth_date, birth_date_approximate = p_birth_date_approximate
  where id = p_pet_id;

  select value_kg into latest_weight
  from public.weight_records
  where pet_id = p_pet_id
  order by measured_at desc, created_at desc
  limit 1;

  if p_weight_kg is not null and p_weight_kg is distinct from latest_weight then
    insert into public.weight_records (pet_id, value_kg, created_by)
    values (p_pet_id, p_weight_kg, auth.uid());
  end if;
  return p_pet_id;
end;
$$;

revoke all on function public.update_pet_with_weight(uuid, text, public.pet_species, text, public.pet_sex, date, boolean, numeric) from public;
grant execute on function public.update_pet_with_weight(uuid, text, public.pet_species, text, public.pet_sex, date, boolean, numeric) to authenticated;

create or replace function public.replace_pet_photo_path(p_pet_id uuid, p_new_photo_path text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_family_id uuid;
  old_photo_path text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select family_id, photo_path into target_family_id, old_photo_path from public.pets where id = p_pet_id;
  if target_family_id is null or not public.can_edit_family(target_family_id) then
    raise exception 'Pet is not editable' using errcode = '42501';
  end if;
  if p_new_photo_path !~ ('^' || target_family_id::text || '/' || p_pet_id::text || '/[^/]+$') then
    raise exception 'Invalid photo path' using errcode = '22023';
  end if;
  update public.pets set photo_path = p_new_photo_path where id = p_pet_id;
  return old_photo_path;
end;
$$;

revoke all on function public.replace_pet_photo_path(uuid, text) from public;
grant execute on function public.replace_pet_photo_path(uuid, text) to authenticated;

revoke update on table public.weight_records from authenticated;
drop policy if exists "weights_update_editors" on public.weight_records;
