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

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  timezone: string
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

export interface UpdatePetInput {
  id: string
  name: string
  species: PetSpecies
  breed?: string
  sex?: PetSex
  birthDate?: string
  birthDateApproximate: boolean
  weightKg?: number
  photo?: File
}

export interface UpdateProfileInput {
  displayName: string
}

export interface PetFormSubmission {
  name: string
  species: PetSpecies
  breed?: string
  sex?: PetSex
  birthDate?: string
  birthDateApproximate: boolean
  weightKg?: number
  photo?: File
}
