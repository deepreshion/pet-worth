-- RETURNS TABLE declares event_id as a PL/pgSQL output variable. Qualify the
-- attachment column and use the reminder constraint to avoid ambiguity.
DO $migration$
DECLARE
  function_oid oid;
  function_sql text;
  reminder_constraint text;
BEGIN
  SELECT p.oid INTO STRICT function_oid
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'save_medical_event';

  SELECT c.conname INTO STRICT reminder_constraint
  FROM pg_catalog.pg_constraint c
  WHERE c.conrelid = 'public.reminders'::regclass
    AND c.contype = 'u'
    AND c.conkey = ARRAY[(SELECT a.attnum FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = c.conrelid AND a.attname = 'event_id')]::smallint[];

  function_sql := pg_catalog.pg_get_functiondef(function_oid);
  function_sql := replace(function_sql,
    'on conflict(event_id)',
    format('on conflict on constraint %I', reminder_constraint));
  function_sql := replace(function_sql,
    'on conflict (event_id)',
    format('on conflict on constraint %I', reminder_constraint));
  function_sql := replace(function_sql,
    'from public.medical_attachments where id=attachment_id and event_id=p_event_id and storage_path=attachment_path and file_name=attachment_name and media_type=attachment_type and size_bytes=attachment_size',
    'from public.medical_attachments ma where ma.id=attachment_id and ma.event_id=p_event_id and ma.storage_path=attachment_path and ma.file_name=attachment_name and ma.media_type=attachment_type and ma.size_bytes=attachment_size');
  EXECUTE function_sql;
END;
$migration$;
