import { computed, readonly, ref } from 'vue'
import { Preferences } from '@capacitor/preferences'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'app-theme'
const themePreference = ref<ThemePreference>('system')
const systemPrefersDark = ref(false)
let initialized = false

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function applyTheme(preference: ThemePreference) {
  document.documentElement.dataset.theme = preference
  document.documentElement.style.colorScheme = preference === 'system' ? 'light dark' : preference
}

function handleSystemThemeChange(event: MediaQueryListEvent) {
  systemPrefersDark.value = event.matches
}

export async function initializeTheme() {
  if (initialized) return

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleSystemThemeChange)

  let storedPreference: string | null
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY })
    storedPreference = value
  } catch {
    storedPreference = null
  }

  themePreference.value = isThemePreference(storedPreference) ? storedPreference : 'system'
  applyTheme(themePreference.value)
  initialized = true
}

export function useTheme() {
  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (themePreference.value === 'system') return systemPrefersDark.value ? 'dark' : 'light'
    return themePreference.value
  })

  async function setTheme(preference: ThemePreference) {
    themePreference.value = preference
    applyTheme(preference)
    await Preferences.set({ key: STORAGE_KEY, value: preference })
  }

  return {
    themePreference: readonly(themePreference),
    resolvedTheme,
    setTheme,
  }
}
