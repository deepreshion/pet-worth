import type { MedicalAttachment, MedicalEvent, PetSummary } from '@/types/domain'
import { clearDemoAttachments } from '@/lib/demoAttachments'

const demoFlagKey = 'pet-worth-demo-mode'
const demoPetsKey = 'pet-worth-demo-pets'
const demoEventsKey = 'pet-worth-demo-medical-events'

const seedPets: PetSummary[] = [
  {
    id: 'demo-senya',
    familyId: 'demo-family',
    name: 'Сеня',
    species: 'cat',
    breed: 'Домашняя короткошёрстная',
    sex: 'male',
    birthDate: '2023-05-23',
    birthDateApproximate: true,
    photoPath: null,
    photoUrl: null,
    latestWeightKg: 4.8,
    canEdit: true,
  },
]

export function isDemoAvailable() {
  return import.meta.env.DEV
}

export function isDemoMode() {
  return isDemoAvailable() && window.localStorage.getItem(demoFlagKey) === 'true'
}

export function enableDemoMode() {
  if (!isDemoAvailable()) return
  window.localStorage.setItem(demoFlagKey, 'true')
}

export function disableDemoMode() {
  window.localStorage.removeItem(demoFlagKey)
  window.localStorage.removeItem(demoPetsKey)
  window.localStorage.removeItem(demoEventsKey)
  void clearDemoAttachments()
}

export function listDemoMedicalEvents(): MedicalEvent[] {
  const saved = window.localStorage.getItem(demoEventsKey)
  if (!saved) return []
  try {
    return (JSON.parse(saved) as MedicalEvent[]).map((event) => ({
      ...event,
      canEdit: true,
      eventTimezone: event.eventTimezone || 'UTC',
      attachments: event.attachments.map((attachment) => {
        const legacyUrl = (attachment as MedicalAttachment & { url?: string }).url
        return { ...attachment, storagePath: legacyUrl?.startsWith('data:') ? legacyUrl : attachment.storagePath }
      }),
    }))
  } catch { return [] }
}

export function saveDemoMedicalEvents(events: MedicalEvent[]) {
  window.localStorage.setItem(demoEventsKey, JSON.stringify(events))
}

export function listDemoPets(): PetSummary[] {
  const saved = window.localStorage.getItem(demoPetsKey)
  if (!saved) return structuredClone(seedPets)
  try {
    return (JSON.parse(saved) as PetSummary[]).map((pet) => ({ ...pet, canEdit: true }))
  } catch {
    return structuredClone(seedPets)
  }
}

export function saveDemoPets(pets: PetSummary[]) {
  window.localStorage.setItem(demoPetsKey, JSON.stringify(pets))
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
