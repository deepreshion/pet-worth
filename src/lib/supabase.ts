import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'
import { createClient, type SupportedStorage } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey || anonKey.startsWith('replace-')) {
  console.warn('Supabase is not configured. Copy .env.example to .env and add project credentials.')
}

const nativeStorage: SupportedStorage = {
  async getItem(key) {
    return (await Preferences.get({ key })).value
  },
  async setItem(key, value) {
    await Preferences.set({ key, value })
  },
  async removeItem(key) {
    await Preferences.remove({ key })
  },
}

export const supabase = createClient<Database>(
  url || 'http://127.0.0.1:54321',
  anonKey || 'missing-local-anon-key',
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      storage: Capacitor.isNativePlatform() ? nativeStorage : window.localStorage,
    },
  },
)
