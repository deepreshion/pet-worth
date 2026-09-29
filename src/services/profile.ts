import { supabase } from '@/lib/supabase'
import { isDemoMode } from '@/lib/demo'
import type { UpdateProfileInput, UserProfile } from '@/types/domain'

const demoProfileKey = 'pet-worth-demo-profile'

function demoProfile(): UserProfile {
  const saved = window.localStorage.getItem(demoProfileKey)
  if (saved) return JSON.parse(saved) as UserProfile
  return { id: 'demo-user', email: 'demo@petworth.local', displayName: 'Владелец Сени', timezone: 'UTC' }
}

export async function getCurrentProfile(): Promise<UserProfile> {
  if (isDemoMode()) return demoProfile()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('Пользователь не найден')
  const { data, error } = await supabase.from('profiles').select('id, display_name, timezone').eq('id', userData.user.id).single()
  if (error) throw error
  return {
    id: data.id,
    email: userData.user.email ?? '',
    displayName: data.display_name,
    timezone: data.timezone,
  }
}

export async function updateCurrentProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  if (isDemoMode()) {
    const updated = { ...demoProfile(), displayName: input.displayName.trim(), timezone: deviceTimezone }
    window.localStorage.setItem(demoProfileKey, JSON.stringify(updated))
    return updated
  }
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('Пользователь не найден')
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: input.displayName.trim(), timezone: deviceTimezone })
    .eq('id', userData.user.id)
    .select('id, display_name, timezone')
    .single()
  if (error) throw error
  return { id: data.id, email: userData.user.email ?? '', displayName: data.display_name, timezone: data.timezone }
}
