begin;
select plan(9);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select is((select count(*)::int from public.profiles), 2, 'profiles are created once');
select is((select count(*)::int from public.families), 2, 'one personal family per new user');
select is((select count(*)::int from public.family_memberships where role = 'owner'), 2, 'one owner membership per new user');

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

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.pets), 0, 'second user cannot read first family pet');
select is((select count(*)::int from public.weight_records), 0, 'second user cannot read first family weight');

select * from finish();
rollback;
