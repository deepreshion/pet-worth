import { computed, readonly, ref } from 'vue'
import { Preferences } from '@capacitor/preferences'
import { en } from './en'

export type Locale = 'ru' | 'en'
export type MessageKey = keyof typeof en
const STORAGE_KEY = 'app-language'
const currentLocale = ref<Locale>('ru')
export const locale = readonly(currentLocale)
export const intlLocale = computed(() => currentLocale.value === 'ru' ? 'ru-RU' : 'en-US')

export function resolveLocale(saved: string | null, languages: readonly string[]): Locale {
  if (saved === 'ru' || saved === 'en') return saved
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0]
    if (base === 'ru' || base === 'en') return base
  }
  return 'en'
}

function applyLocale(value: Locale) {
  currentLocale.value = value
  document.documentElement.lang = value
}

export async function initializeLocale() {
  let saved: string | null = null
  try { saved = (await Preferences.get({ key: STORAGE_KEY })).value } catch { /* Use device language when storage is unavailable. */ }
  applyLocale(resolveLocale(saved, navigator.languages?.length ? navigator.languages : [navigator.language]))
}

export async function setLocale(value: Locale) {
  // Persist first so a storage failure does not silently lose the preference.
  await Preferences.set({ key: STORAGE_KEY, value })
  applyLocale(value)
}

/** Russian source messages are stable catalog keys. User-entered data is never translated. */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  const message = currentLocale.value === 'en' ? en[key] : key
  return message.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match))
}
