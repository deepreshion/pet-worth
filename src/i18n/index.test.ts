import { computed } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Preferences } from '@capacitor/preferences'
import { initializeLocale, intlLocale, locale, resolveLocale, setLocale, t } from './index'
import { formatPetAge, validatePhoto } from '@/utils/pet'
import { formatEventDate, medicalEventMeta, validateMedicalFiles } from '@/utils/medicalEvents'
import { createPetFormSchema } from '@/utils/petForm'

vi.mock('@capacitor/preferences', () => ({ Preferences: { get: vi.fn(), set: vi.fn() } }))

beforeEach(async () => {
  vi.mocked(Preferences.set).mockReset().mockResolvedValue()
  vi.mocked(Preferences.get).mockReset().mockResolvedValue({ value: 'ru' })
  await setLocale('ru')
})

describe('language preference', () => {
  it('uses saved preference, then the first supported device language, then English', () => {
    expect(resolveLocale('ru', ['en-US'])).toBe('ru')
    expect(resolveLocale('en', ['ru-RU'])).toBe('en')
    expect(resolveLocale('invalid', ['de-DE', 'ru-RU', 'en'])).toBe('ru')
    expect(resolveLocale(null, ['EN-gb', 'ru'])).toBe('en')
    expect(resolveLocale(null, ['de-DE'])).toBe('en')
  })
  it('restores the persisted language and updates document accessibility language', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: 'en' })
    await initializeLocale()
    expect(locale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(intlLocale.value).toBe('en-US')
  })
  it('uses device language when preference storage cannot be read', async () => {
    vi.mocked(Preferences.get).mockRejectedValue(new Error('unavailable'))
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ru-RU'])
    await initializeLocale()
    expect(locale.value).toBe('ru')
    vi.restoreAllMocks()
  })
  it('persists language and leaves the active language intact on write failure', async () => {
    await setLocale('en')
    expect(Preferences.set).toHaveBeenLastCalledWith({ key: 'app-language', value: 'en' })
    vi.mocked(Preferences.set).mockRejectedValue(new Error('full'))
    await expect(setLocale('ru')).rejects.toThrow('full')
    expect(locale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })
})

describe('localized content', () => {
  it('updates labels and event types reactively without translating user data', async () => {
    const label = computed(() => `${t('Главная')} · ${medicalEventMeta.vet_visit.label}`)
    expect(label.value).toBe('Главная · Приём врача')
    await setLocale('en')
    expect(label.value).toBe('Home · Vet visit')
    expect(t('Фото питомца {name}', { name: '<Сеня>' })).toBe('Photo of <Сеня>')
  })
  it('formats dates, weight decimals and ages for both languages', async () => {
    const today = new Date('2026-10-05T00:00:00Z')
    expect(formatPetAge('2025-10-05', false, today)).toBe('1 год')
    expect(formatPetAge('2024-10-05', false, today)).toBe('2 года')
    expect(formatPetAge('2021-10-05', false, today)).toBe('5 лет')
    expect(formatEventDate('2026-10-05')).toContain('октября')
    expect((4.8).toLocaleString(intlLocale.value)).toBe('4,8')
    await setLocale('en')
    expect(formatPetAge('2025-10-05', false, today)).toBe('1 year')
    expect(formatPetAge('2024-08-05', true, today)).toBe('≈ 2 years 2 mo.')
    expect(formatPetAge('2026-10-01', false, today)).toBe('less than a month')
    expect(formatEventDate('2026-10-05')).toBe('October 5, 2026')
    expect((4.8).toLocaleString(intlLocale.value)).toBe('4.8')
  })
  it('localizes form validation and upload errors', async () => {
    await setLocale('en')
    expect(validatePhoto(new File(['x'], 'x.gif', { type: 'image/gif' }))).toBe('JPEG, PNG, WebP and HEIC are supported.')
    expect(validateMedicalFiles([new File(['x'], 'x.txt', { type: 'text/plain' })])).toContain('Attach JPG')
    const result = createPetFormSchema().safeParse({ name: '', species: 'cat', birthMode: 'unknown' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe('Enter a name')
  })
})
