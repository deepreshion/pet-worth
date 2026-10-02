begin;
select plan(53);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select is((select count(*)::int from public.profiles), 3, 'profiles are created once');
select is((select count(*)::int from public.families), 3, 'one personal family per new user');
select is((select count(*)::int from public.family_memberships where role = 'owner'), 3, 'one owner membership per new user');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select lives_ok($$select * from public.create_pet_with_weight('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Сеня', 'cat', null, 'male', null, false, 4.8)$$, 'owner can create pet');
select lives_ok($$select * from public.create_pet_with_weight('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Сеня', 'cat', null, 'male', null, false, 4.8)$$, 'pet retry is safe');
select is((select count(*)::int from public.pets), 1, 'pet request is idempotent');
select is((select count(*)::int from public.weight_records), 1, 'weight request is idempotent');
select lives_ok($$select public.update_pet_with_weight((select id from public.pets limit 1), 'Сеня', 'cat', 'Сибирская', 'male', null, false, 5.1)$$, 'owner updates pet');
select is((select breed from public.pets limit 1), 'Сибирская', 'pet field updated');
select is((select count(*)::int from public.weight_records), 2, 'changed weight creates history');
select throws_ok($$update public.pets set family_id = '00000000-0000-4000-8000-000000000000' where true$$, '42501', 'permission denied for table pets', 'service pet fields are protected');
select lives_ok($$insert into storage.objects (bucket_id, name) select 'pet-photos', family_id::text || '/' || id::text || '/photo.jpg' from public.pets limit 1$$, 'editor uploads pet photo');
select is((select count(*)::int from storage.objects where bucket_id = 'pet-photos'), 1, 'editor reads pet photo');

select lives_ok(
  $$insert into storage.objects (bucket_id, name) select 'medical-attachments', family_id::text || '/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/dddddddd-dddd-4ddd-8ddd-dddddddddddd/document.pdf' from public.pets limit 1$$,
  'editor uploads staged canonical attachment'
);
select lives_ok(
  $$select public.save_medical_event(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'vaccination', 'Ежегодная вакцинация', null,
    current_date + 3, '10:00', 'UTC', true, 123456,
    jsonb_build_array(jsonb_build_object('id','dddddddd-dddd-4ddd-8ddd-dddddddddddd','storage_path',family_id::text || '/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/dddddddd-dddd-4ddd-8ddd-dddddddddddd/document.pdf','file_name','document.pdf','media_type','application/pdf','size_bytes',42)),
    '{}'::uuid[]
  ) from public.pets limit 1$$,
  'editor atomically saves event metadata, attachment and reminder'
);
select lives_ok(
  $$select public.save_medical_event(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'vaccination', 'Ежегодная вакцинация', null,
    current_date + 3, '10:00', 'UTC', true, 123456, '[]'::jsonb,
    array['dddddddd-dddd-4ddd-8ddd-dddddddddddd']::uuid[]
  ) from public.pets limit 1$$,
  'event retry is idempotent'
);
select is((select count(*)::int from public.medical_events), 1, 'retry creates one event');
select is((select count(*)::int from public.medical_attachments), 1, 'retry keeps one attachment');
select is((select count(*)::int from public.reminders), 1, 'retry keeps one reminder');
select is(
  (select scheduled_at from public.reminders limit 1),
  (((current_date + 3 + time '10:00') at time zone 'UTC') - interval '24 hours'),
  'reminder is exactly 24 hours before event in explicit timezone'
);
select is((select count(*)::int from public.activity_logs), 2, 'idempotent retry creates no extra audit rows');
select throws_ok(
  $$select public.save_medical_event(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'vaccination', 'Missing object', null,
    current_date + 3, '10:00', 'UTC', true, 123456,
    ('[{"id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","storage_path":"' || family_id::text || '/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/cccccccc-cccc-4ccc-8ccc-cccccccccccc/missing.pdf","file_name":"missing.pdf","media_type":"application/pdf","size_bytes":42}]')::jsonb,
    array['dddddddd-dddd-4ddd-8ddd-dddddddddddd']::uuid[]
  ) from public.pets limit 1$$,
  '22023', 'Attachment object is missing', 'RPC requires a staged storage object'
);
select throws_ok(
  $$select public.save_medical_event(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'analysis', 'Bad path', null,
    current_date + 3, null, 'UTC', false, null,
    '[{"id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","storage_path":"00000000-0000-4000-8000-000000000000/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/cccccccc-cccc-4ccc-8ccc-cccccccccccc/x.pdf","file_name":"x.pdf","media_type":"application/pdf","size_bytes":42}]'::jsonb,
    array['dddddddd-dddd-4ddd-8ddd-dddddddddddd']::uuid[]
  ) from public.pets limit 1$$,
  '22023', 'Invalid canonical attachment path', 'RPC rejects cross-family attachment path'
);
select throws_ok(
  $$select public.save_medical_event(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'vaccination', 'Bad reminder', null,
    current_date + 3, '10:00', 'Not/AZone', true, 123456, '[]'::jsonb, array['dddddddd-dddd-4ddd-8ddd-dddddddddddd']::uuid[]
  ) from public.pets limit 1$$,
  '22023', 'Invalid event timezone', 'RPC rejects invalid timezone'
);
select throws_ok($$insert into public.medical_events (pet_id, created_by, creation_request_id, type, title, event_date, event_timezone) select id, auth.uid(), gen_random_uuid(), 'analysis', 'Direct', current_date, 'UTC' from public.pets limit 1$$,
  '42501', 'permission denied for table medical_events', 'direct event writes are revoked');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.pets), 0, 'other family cannot read pet');
select is((select count(*)::int from public.medical_events), 0, 'other family cannot read events');
select is((select count(*)::int from public.medical_attachments), 0, 'other family cannot read attachments');
select is((select count(*)::int from public.reminders), 0, 'other family cannot read reminders');
select is((select count(*)::int from public.activity_logs), 0, 'other family cannot read audit');
select is((select count(*)::int from public.storage_cleanup_outbox), 0, 'other family cannot read cleanup outbox');
select is((select count(*)::int from storage.objects where bucket_id = 'medical-attachments'), 0, 'other family cannot read objects');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('medical-attachments', '00000000-0000-4000-8000-000000000000/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/cccccccc-cccc-4ccc-8ccc-cccccccccccc/x.pdf')$$,
  '42501', 'new row violates row-level security policy for table "objects"', 'other family cannot stage object'
);

reset role;
insert into public.family_memberships (family_id, user_id, role)
select family_id, '33333333-3333-4333-8333-333333333333', 'viewer' from public.family_memberships where user_id = '11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select is((select count(*)::int from public.pets), 1, 'viewer reads pet');
select is((select count(*)::int from public.medical_events), 1, 'viewer reads events');
select is((select count(*)::int from public.medical_attachments), 1, 'viewer reads attachments');
select is((select count(*)::int from public.reminders), 1, 'viewer reads reminders');
select is((select count(*)::int from public.activity_logs), 2, 'viewer reads exact audit history');
select is((select count(*)::int from public.storage_cleanup_outbox), 0, 'viewer has no pending cleanup before delete');
select throws_ok(
  $$select public.save_medical_event('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', (select id from public.pets limit 1), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'analysis', 'Нельзя', null, current_date, null, 'UTC', false, null, '[]'::jsonb, '{}'::uuid[])$$,
  '42501', 'Medical event is not editable', 'viewer RPC update fails loudly'
);
select throws_ok($$select * from public.delete_medical_event('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')$$,
  '42501', 'Medical event is not editable', 'viewer RPC delete fails loudly');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) select 'medical-attachments', family_id::text || '/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/cccccccc-cccc-4ccc-8ccc-cccccccccccc/viewer.pdf' from public.pets limit 1$$,
  '42501', 'new row violates row-level security policy for table "objects"', 'viewer cannot upload object'
);

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select lives_ok($$select * from public.delete_medical_event('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')$$, 'authorized delete RPC commits');
select is((select count(*)::int from public.medical_events), 0, 'event is deleted atomically');
select is((select count(*)::int from public.medical_attachments), 0, 'attachment metadata cascades');
select is((select count(*)::int from public.reminders), 0, 'reminder cascades');
select is((select count(*)::int from storage.objects where bucket_id = 'medical-attachments'), 1, 'physical object remains until post-commit cleanup');
select is((select count(*)::int from public.storage_cleanup_outbox), 1, 'delete atomically records durable physical cleanup');
select lives_ok($$delete from storage.objects where bucket_id = 'medical-attachments'$$, 'authorized client cleanup succeeds after DB commit');
select lives_ok($$select public.ack_storage_cleanup((select id from public.storage_cleanup_outbox limit 1))$$, 'authorized client acknowledges completed cleanup');
select is((select count(*)::int from public.storage_cleanup_outbox), 0, 'ack removes durable cleanup item');
select is((select count(*)::int from storage.objects where bucket_id = 'medical-attachments'), 0, 'physical object cleanup leaves no leak');
select is((select count(*)::int from public.activity_logs where action = 'medical_event_deleted'), 1, 'delete is audited');

select * from finish();
rollback;
