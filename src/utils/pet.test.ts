import { describe, expect, it } from 'vitest'
import { approximateAgeParts, approximateBirthDate, formatPetAge, shouldCreateWeightRecord, validatePhoto } from './pet'

describe('pet date helpers', () => {
  it('converts approximate age into a stable birth date', () => {
    expect(approximateBirthDate(3, 4, new Date('2026-09-23T12:00:00Z'))).toBe('2023-05-23')
  })

  it('formats exact and approximate age', () => {
    const today = new Date('2026-09-23T12:00:00Z')
    expect(formatPetAge('2023-05-23', false, today)).toBe('3 года 4 мес.')
    expect(formatPetAge('2023-05-23', true, today)).toBe('≈ 3 года 4 мес.')
  })

  it('derives editable approximate age parts', () => {
    expect(approximateAgeParts('2023-05-23', new Date('2026-09-23T12:00:00Z'))).toEqual({ years: 3, months: 4 })
  })
})

describe('photo validation', () => {
  it('accepts a small jpeg', () => {
    expect(validatePhoto(new File(['photo'], 'pet.jpg', { type: 'image/jpeg' }))).toBeNull()
  })

  it('rejects unsupported files', () => {
    expect(validatePhoto(new File(['text'], 'pet.txt', { type: 'text/plain' }))).toContain('JPEG')
  })

  it('rejects files over 10 MiB', () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'pet.png', { type: 'image/png' })
    expect(validatePhoto(file)).toContain('10 МБ')
  })
})

describe('weight updates', () => {
  it('does not request a new record when weight is unchanged', () => {
    expect(shouldCreateWeightRecord(4.8, 4.8)).toBe(false)
    expect(shouldCreateWeightRecord(4.8, 5.1)).toBe(true)
    expect(shouldCreateWeightRecord(null, undefined)).toBe(false)
  })
})
