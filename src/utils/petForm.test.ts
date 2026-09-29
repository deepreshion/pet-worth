import { describe, expect, it } from 'vitest'
import { createPetFormSchema } from './petForm'

const schema = createPetFormSchema('2026-09-29')
const valid = { name: 'Сеня', species: 'cat', birthMode: 'unknown', ageYears: 0, ageMonths: 0 }

describe('pet form validation', () => {
  it('requires name and species for create and edit', () => {
    expect(schema.safeParse({ ...valid, name: '' }).success).toBe(false)
    expect(schema.safeParse({ ...valid, species: undefined }).success).toBe(false)
  })

  it('accepts optional breed, sex and weight', () => {
    expect(schema.safeParse({ ...valid, breed: 'Сибирская', sex: 'male', weightKg: 4.8 }).success).toBe(true)
  })

  it('rejects a future exact birth date and empty approximate age', () => {
    expect(schema.safeParse({ ...valid, birthMode: 'exact', birthDate: '2026-10-01' }).success).toBe(false)
    expect(schema.safeParse({ ...valid, birthMode: 'approximate' }).success).toBe(false)
  })
})
