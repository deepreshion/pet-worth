import { supabase } from '@/lib/supabase'
import type { CreatePetInput, PetSummary } from '@/types/domain'
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
  return Promise.all(((data ?? []) as unknown as PetRow[]).map(mapPet))
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
  return mapPet(data as unknown as PetRow)
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
    pet.photoPath = `demo/${petId}`
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

  const { error: updateError } = await supabase.from('pets').update({ photo_path: path }).eq('id', petId)
  if (updateError) {
    await supabase.storage.from('pet-photos').remove([path])
    throw updateError
  }
}

async function mapPet(row: PetRow): Promise<PetSummary> {
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
  }
}
