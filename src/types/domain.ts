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
  canEdit: boolean
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

export type MedicalEventType = 'vaccination' | 'vet_visit' | 'analysis' | 'procedure'

export interface MedicalAttachment {
  id: string
  eventId: string
  storagePath: string
  fileName: string
  mediaType: string
  sizeBytes: number
}

export interface MedicalReminder {
  id: string
  eventId: string
  scheduledAt: string
  notificationId: number
}

export interface MedicalEvent {
  id: string
  petId: string
  familyId: string
  petName: string
  petPhotoUrl: string | null
  createdBy: string
  type: MedicalEventType
  title: string
  notes: string | null
  eventDate: string
  eventTime: string | null
  createdAt: string
  updatedAt: string
  eventTimezone: string
  canEdit: boolean
  attachments: MedicalAttachment[]
  reminder: MedicalReminder | null
}

export interface SaveMedicalEventInput {
  id?: string
  petId: string
  requestId: string
  type: MedicalEventType
  title: string
  notes?: string
  eventDate: string
  eventTime?: string
  eventTimezone?: string
  reminderEnabled: boolean
  files: File[]
  retainedAttachmentIds?: string[]
}

export interface SaveMedicalEventResult {
  eventId: string
  reminderWarning: boolean
  attachmentWarnings: string[]
  cleanupWarnings: string[]
}
