-- Qualify the Storage path: unqualified name inside the pets subquery resolves
-- to p.name (the pet's display name), rejecting every normal photo upload.
alter policy "pet_photos_insert_editors" on storage.objects
with check (
  bucket_id = 'pet-photos'
  and public.can_edit_family((storage.foldername(storage.objects.name))[1]::uuid)
  and exists (
    select 1 from public.pets p
    where p.id = (storage.foldername(storage.objects.name))[2]::uuid
      and p.family_id = (storage.foldername(storage.objects.name))[1]::uuid
  )
);
