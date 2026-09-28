create extension if not exists pgcrypto with schema extensions;

create type public.membership_role as enum ('owner', 'member', 'viewer');
create type public.pet_species as enum ('cat', 'dog');
create type public.pet_sex as enum ('female', 'male', 'unknown');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 100),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  owner_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.family_memberships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null,
  joined_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  creation_request_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  species public.pet_species not null,
  breed text check (breed is null or char_length(breed) <= 100),
  sex public.pet_sex,
  birth_date date check (birth_date is null or birth_date <= current_date),
  birth_date_approximate boolean not null default false,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, creation_request_id),
  check (birth_date is not null or birth_date_approximate = false)
);

create table public.weight_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  value_kg numeric(6,2) not null check (value_kg > 0 and value_kg <= 200),
  measured_at date not null default current_date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index family_memberships_user_idx on public.family_memberships(user_id);
create index pets_family_idx on public.pets(family_id);
create index weight_records_pet_date_idx on public.weight_records(pet_id, measured_at desc, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pets_set_updated_at before update on public.pets
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_family_id uuid;
begin
  insert into public.profiles (id, display_name, timezone)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'UTC')
  )
  on conflict (id) do nothing;

  if not exists (select 1 from public.family_memberships where user_id = new.id) then
    insert into public.families (name, owner_user_id)
    values ('Моя семья', new.id)
    returning id into new_family_id;

    insert into public.family_memberships (family_id, user_id, role)
    values (new_family_id, new.id, 'owner');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_memberships
    where family_id = target_family_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_family(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_memberships
    where family_id = target_family_id
      and user_id = auth.uid()
      and role in ('owner', 'member')
  );
$$;

revoke all on function public.is_family_member(uuid) from public;
revoke all on function public.can_edit_family(uuid) from public;
grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.can_edit_family(uuid) to authenticated;

create or replace function public.create_pet_with_weight(
  p_request_id uuid,
  p_name text,
  p_species public.pet_species,
  p_breed text default null,
  p_sex public.pet_sex default null,
  p_birth_date date default null,
  p_birth_date_approximate boolean default false,
  p_weight_kg numeric default null
)
returns table (pet_id uuid, family_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_family_id uuid;
  selected_pet_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select p.id, p.family_id into selected_pet_id, selected_family_id
  from public.pets p
  where p.created_by = auth.uid() and p.creation_request_id = p_request_id;

  if selected_pet_id is not null then
    return query select selected_pet_id, selected_family_id;
    return;
  end if;

  select fm.family_id into selected_family_id
  from public.family_memberships fm
  where fm.user_id = auth.uid() and fm.role in ('owner', 'member')
  order by (fm.role = 'owner') desc, fm.joined_at asc
  limit 1;

  if selected_family_id is null then
    raise exception 'No editable family found' using errcode = '42501';
  end if;

  insert into public.pets (
    family_id, created_by, creation_request_id, name, species, breed, sex,
    birth_date, birth_date_approximate
  ) values (
    selected_family_id, auth.uid(), p_request_id, trim(p_name), p_species,
    nullif(trim(p_breed), ''), p_sex, p_birth_date, p_birth_date_approximate
  )
  returning id into selected_pet_id;

  if p_weight_kg is not null then
    insert into public.weight_records (pet_id, value_kg, created_by)
    values (selected_pet_id, p_weight_kg, auth.uid());
  end if;

  return query select selected_pet_id, selected_family_id;
end;
$$;

revoke all on function public.create_pet_with_weight(uuid, text, public.pet_species, text, public.pet_sex, date, boolean, numeric) from public;
grant execute on function public.create_pet_with_weight(uuid, text, public.pet_species, text, public.pet_sex, date, boolean, numeric) to authenticated;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_memberships enable row level security;
alter table public.pets enable row level security;
alter table public.weight_records enable row level security;

create policy "profiles_select_self" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "families_select_members" on public.families for select to authenticated using (public.is_family_member(id));
create policy "memberships_select_members" on public.family_memberships for select to authenticated using (public.is_family_member(family_id));

create policy "pets_select_members" on public.pets for select to authenticated using (public.is_family_member(family_id));
create policy "pets_insert_editors" on public.pets for insert to authenticated with check (created_by = auth.uid() and public.can_edit_family(family_id));
create policy "pets_update_editors" on public.pets for update to authenticated using (public.can_edit_family(family_id)) with check (public.can_edit_family(family_id));
create policy "pets_delete_owners" on public.pets for delete to authenticated using (
  exists (select 1 from public.family_memberships fm where fm.family_id = pets.family_id and fm.user_id = auth.uid() and fm.role = 'owner')
);

create policy "weights_select_members" on public.weight_records for select to authenticated using (
  exists (select 1 from public.pets p where p.id = weight_records.pet_id and public.is_family_member(p.family_id))
);
create policy "weights_insert_editors" on public.weight_records for insert to authenticated with check (
  created_by = auth.uid() and exists (select 1 from public.pets p where p.id = weight_records.pet_id and public.can_edit_family(p.family_id))
);
create policy "weights_update_editors" on public.weight_records for update to authenticated using (
  exists (select 1 from public.pets p where p.id = weight_records.pet_id and public.can_edit_family(p.family_id))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-photos', 'pet-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "pet_photos_select_members" on storage.objects for select to authenticated using (
  bucket_id = 'pet-photos' and public.is_family_member((storage.foldername(name))[1]::uuid)
);
create policy "pet_photos_insert_editors" on storage.objects for insert to authenticated with check (
  bucket_id = 'pet-photos'
  and public.can_edit_family((storage.foldername(name))[1]::uuid)
  and exists (
    select 1 from public.pets p
    where p.id = (storage.foldername(name))[2]::uuid
      and p.family_id = (storage.foldername(name))[1]::uuid
  )
);
create policy "pet_photos_delete_editors" on storage.objects for delete to authenticated using (
  bucket_id = 'pet-photos' and public.can_edit_family((storage.foldername(name))[1]::uuid)
);
