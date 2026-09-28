import type { PetSummary } from '@/types/domain'

const demoFlagKey = 'pet-worth-demo-mode'
const demoPetsKey = 'pet-worth-demo-pets'

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
}

export function listDemoPets(): PetSummary[] {
  const saved = window.localStorage.getItem(demoPetsKey)
  if (!saved) return structuredClone(seedPets)
  try {
    return JSON.parse(saved) as PetSummary[]
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
