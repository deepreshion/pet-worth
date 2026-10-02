import { supabase } from '@/lib/supabase'
import type { CreatePetInput, PetSummary, UpdatePetInput } from '@/types/domain'
import { fileToDataUrl, isDemoMode, listDemoPets, saveDemoPets } from '@/lib/demo'

interface PetRow {
  id: string
  family_id: string
  name: string
  species: 'cat' | 'dog'
  breed: string | null
  sex: 'female' | 'male' | 'unknown' | null
  birth_date: string | null
  birth_date_approximate: boolean
  photo_path: string | null
  weight_records: { value_kg: number; measured_at: string }[] | null
}

const petSelect = `
  id, family_id, name, species, breed, sex, birth_date, birth_date_approximate, photo_path,
  weight_records(value_kg, measured_at)
`

export async function listPets(): Promise<PetSummary[]> {
  if (isDemoMode()) return listDemoPets()
  const { data, error } = await supabase
    .from('pets')
    .select(petSelect)
    .order('created_at', { ascending: true })
    .order('measured_at', { referencedTable: 'weight_records', ascending: false })
    .limit(1, { referencedTable: 'weight_records' })
  if (error) throw error
  const editableFamilies = await getEditableFamilyIds()
  return Promise.all(((data ?? []) as unknown as PetRow[]).map((row) => mapPet(row, editableFamilies.has(row.family_id))))
}

export async function getPet(id: string): Promise<PetSummary> {
  if (isDemoMode()) {
    const pet = listDemoPets().find((item) => item.id === id)
    if (!pet) throw new Error('Питомец не найден')
    return pet
  }
  const { data, error } = await supabase
    .from('pets')
    .select(petSelect)
    .eq('id', id)
    .order('measured_at', { referencedTable: 'weight_records', ascending: false })
    .limit(1, { referencedTable: 'weight_records' })
    .single()
  if (error) throw error
  const editableFamilies = await getEditableFamilyIds()
  const row = data as unknown as PetRow
  return mapPet(row, editableFamilies.has(row.family_id))
}

export async function createPet(input: CreatePetInput): Promise<{ petId: string; photoUploadFailed: boolean }> {
  if (isDemoMode()) {
    const petId = `demo-${input.requestId}`
    const photoUrl = input.photo ? await fileToDataUrl(input.photo) : null
    const pets = listDemoPets()
    if (!pets.some((pet) => pet.id === petId)) {
      pets.push({
        id: petId,
        familyId: 'demo-family',
        name: input.name.trim(),
        species: input.species,
        breed: input.breed?.trim() || null,
        sex: input.sex || null,
        birthDate: input.birthDate || null,
        birthDateApproximate: input.birthDateApproximate,
        photoPath: photoUrl ? `demo/${petId}` : null,
        photoUrl,
        latestWeightKg: input.weightKg ?? null,
        canEdit: true,
      })
      saveDemoPets(pets)
    }
    return { petId, photoUploadFailed: false }
  }
  const { data, error } = await supabase.rpc('create_pet_with_weight', {
    p_request_id: input.requestId,
    p_name: input.name.trim(),
    p_species: input.species,
    p_breed: input.breed?.trim() || null,
    p_sex: input.sex || null,
    p_birth_date: input.birthDate || null,
    p_birth_date_approximate: input.birthDateApproximate,
    p_weight_kg: input.weightKg ?? null,
  })
  if (error) throw error

  const result = data[0]
  if (!result) throw new Error('Питомец не был создан')

  let photoUploadFailed = false
  if (input.photo) {
    try {
      await uploadPetPhoto(result.pet_id, result.family_id, input.photo)
    } catch {
      photoUploadFailed = true
    }
  }
  return { petId: result.pet_id, photoUploadFailed }
}

export async function uploadPetPhoto(petId: string, familyId: string, photo: File) {
  if (isDemoMode()) {
    const pets = listDemoPets()
    const pet = pets.find((item) => item.id === petId && item.familyId === familyId)
    if (!pet) throw new Error('Питомец не найден')
    pet.photoUrl = await fileToDataUrl(photo)
    pet.photoPath = `demo/${petId}/${crypto.randomUUID()}`
    saveDemoPets(pets)
    return
  }
  const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${familyId}/${petId}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage.from('pet-photos').upload(path, photo, {
    cacheControl: '3600',
    contentType: photo.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: oldPath, error: updateError } = await supabase.rpc('replace_pet_photo_path', {
    p_pet_id: petId,
    p_new_photo_path: path,
  })
  if (updateError) {
    await supabase.storage.from('pet-photos').remove([path])
    throw updateError
  }
  if (oldPath && oldPath !== path) {
    const { error: removeOldError } = await supabase.storage.from('pet-photos').remove([oldPath])
    if (removeOldError) {
      const { error: rollbackError } = await supabase.rpc('replace_pet_photo_path', {
        p_pet_id: petId,
        p_new_photo_path: oldPath,
      })
      if (!rollbackError) await supabase.storage.from('pet-photos').remove([path])
      throw removeOldError
    }
  }
}

export async function updatePet(input: UpdatePetInput): Promise<{ petId: string; photoUploadFailed: boolean }> {
  if (isDemoMode()) {
    const pets = listDemoPets()
    const pet = pets.find((item) => item.id === input.id)
    if (!pet) throw new Error('Питомец не найден')
    Object.assign(pet, {
      name: input.name.trim(),
      species: input.species,
      breed: input.breed?.trim() || null,
      sex: input.sex || null,
      birthDate: input.birthDate || null,
      birthDateApproximate: input.birthDateApproximate,
      latestWeightKg: input.weightKg ?? pet.latestWeightKg,
    })
    saveDemoPets(pets)
    if (input.photo) await uploadPetPhoto(pet.id, pet.familyId, input.photo)
    return { petId: pet.id, photoUploadFailed: false }
  }

  const { data: petId, error } = await supabase.rpc('update_pet_with_weight', {
    p_pet_id: input.id,
    p_name: input.name.trim(),
    p_species: input.species,
    p_breed: input.breed?.trim() || null,
    p_sex: input.sex || null,
    p_birth_date: input.birthDate || null,
    p_birth_date_approximate: input.birthDateApproximate,
    p_weight_kg: input.weightKg ?? null,
  })
  if (error) throw error
  if (!petId) throw new Error('Питомец не был обновлён')

  let photoUploadFailed = false
  if (input.photo) {
    const pet = await getPet(petId)
    try { await uploadPetPhoto(petId, pet.familyId, input.photo) } catch { photoUploadFailed = true }
  }
  return { petId, photoUploadFailed }
}

async function getEditableFamilyIds() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('Требуется вход')
  const { data, error } = await supabase.from('family_memberships').select('family_id').eq('user_id', userData.user.id).in('role', ['owner', 'member'])
  if (error) throw error
  return new Set((data ?? []).map((item) => item.family_id))
}

async function mapPet(row: PetRow, canEdit: boolean): Promise<PetSummary> {
  let photoUrl: string | null = null
  if (row.photo_path) {
    const { data } = await supabase.storage.from('pet-photos').createSignedUrl(row.photo_path, 3600)
    photoUrl = data?.signedUrl ?? null
  }
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    sex: row.sex,
    birthDate: row.birth_date,
    birthDateApproximate: row.birth_date_approximate,
    photoPath: row.photo_path,
    photoUrl,
    latestWeightKg: row.weight_records?.[0]?.value_kg ?? null,
    canEdit,
  }
}
