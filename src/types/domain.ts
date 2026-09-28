export type MembershipRole = 'owner' | 'member' | 'viewer'
export type PetSpecies = 'cat' | 'dog'
export type PetSex = 'female' | 'male' | 'unknown'

export interface PetSummary {
  id: string
  familyId: string
  name: string
  species: PetSpecies
  breed: string | null
  sex: PetSex | null
  birthDate: string | null
  birthDateApproximate: boolean
  photoPath: string | null
  photoUrl: string | null
  latestWeightKg: number | null
}

export interface CreatePetInput {
  requestId: string
  name: string
  species: PetSpecies
  breed?: string
  sex?: PetSex
  birthDate?: string
  birthDateApproximate: boolean
  weightKg?: number
  photo?: File
}
