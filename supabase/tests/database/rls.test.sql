begin;
select plan(24);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select is((select count(*)::int from public.profiles), 3, 'profiles are created once');
select is((select count(*)::int from public.families), 3, 'one personal family per new user');
select is((select count(*)::int from public.family_memberships where role = 'owner'), 3, 'one owner membership per new user');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select lives_ok(
  $$select * from public.create_pet_with_weight('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Сеня', 'cat', null, 'male', null, false, 4.8)$$,
  'owner can create pet'
);
select lives_ok(
  $$select * from public.create_pet_with_weight('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Сеня', 'cat', null, 'male', null, false, 4.8)$$,
  'retry with same request id is safe'
);
select is((select count(*)::int from public.pets), 1, 'idempotent retry creates one pet');
select is((select count(*)::int from public.weight_records), 1, 'idempotent retry creates one weight');

select lives_ok(
  $$select public.update_pet_with_weight((select id from public.pets limit 1), 'Сеня', 'cat', 'Сибирская', 'male', null, false, 4.8)$$,
  'owner can update own pet'
);
select is((select breed from public.pets limit 1), 'Сибирская', 'allowed pet field is updated');
select lives_ok(
  $$select public.update_pet_with_weight((select id from public.pets limit 1), 'Сеня', 'cat', 'Сибирская', 'male', null, false, 4.8)$$,
  'repeating the same weight is safe'
);
select is((select count(*)::int from public.weight_records), 1, 'unchanged weight creates no row');
select lives_ok(
  $$select public.update_pet_with_weight((select id from public.pets limit 1), 'Сеня', 'cat', 'Сибирская', 'male', null, false, 5.1)$$,
  'changed weight updates atomically'
);
select is((select count(*)::int from public.weight_records), 2, 'changed weight creates a separate row');
select throws_ok(
  $$update public.pets set family_id = '00000000-0000-4000-8000-000000000000' where true$$,
  '42501', 'permission denied for table pets', 'service fields cannot be updated directly'
);
select is((select count(*)::int from public.profiles), 1, 'user reads only own profile');
select lives_ok(
  $$insert into storage.objects (bucket_id, name) select 'pet-photos', family_id::text || '/' || id::text || '/photo.jpg' from public.pets limit 1$$,
  'editor can create an object in own pet path'
);
select is((select count(*)::int from storage.objects where bucket_id = 'pet-photos'), 1, 'allowed user can read own photo object');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.pets), 0, 'second user cannot read first family pet');
select is((select count(*)::int from public.weight_records), 0, 'second user cannot read first family weight');
select is((select count(*)::int from public.profiles where id = '11111111-1111-4111-8111-111111111111'), 0, 'second user cannot read another profile');
select throws_ok(
  $$select public.update_pet_with_weight('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Взлом', 'dog', null, null, null, false, null)$$,
  '42501', 'Pet is not editable', 'second user cannot update another pet'
);
select is((select count(*)::int from storage.objects where bucket_id = 'pet-photos'), 0, 'storage hides another family path');

reset role;
insert into public.family_memberships (family_id, user_id, role)
select family_id, '33333333-3333-4333-8333-333333333333', 'viewer'
from public.family_memberships where user_id = '11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select is((select count(*)::int from public.pets), 1, 'viewer can read family pet');
select throws_ok(
  $$select public.update_pet_with_weight((select id from public.pets limit 1), 'Взлом', 'dog', null, null, null, false, null)$$,
  '42501', 'Pet is not editable', 'viewer cannot update family pet'
);

select * from finish();
rollback;
