import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type PendingLocalNotificationSchema } from '@capacitor/local-notifications'
import type { Router } from 'vue-router'
import { supabase } from '@/lib/supabase'

const registryKey = 'pet-worth-medical-notification-ids'

function readRegistry() {
  try { return JSON.parse(window.localStorage.getItem(registryKey) ?? '[]') as number[] } catch { return [] }
}
function writeRegistry(ids: number[]) { window.localStorage.setItem(registryKey, JSON.stringify(ids)) }

export async function initializeNotificationNavigation(router: Router) {
  if (!Capacitor.isNativePlatform()) return
  await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
    const eventId = notification.extra?.eventId
    if (notification.extra?.source === 'pet-worth-medical' && typeof eventId === 'string') void router.push(`/medical-events/${eventId}`)
  })
}

export async function scheduleEventNotification(input: { id: number; eventId: string; petName: string; title: string; at: Date }) {
  if (!Capacitor.isNativePlatform()) return { scheduled: false, denied: true }
  let permission = await LocalNotifications.checkPermissions()
  if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') permission = await LocalNotifications.requestPermissions()
  if (permission.display !== 'granted') return { scheduled: false, denied: true }
  await LocalNotifications.cancel({ notifications: [{ id: input.id }] })
  await LocalNotifications.schedule({ notifications: [{ id: input.id, title: `Завтра: ${input.title}`, body: input.petName,
    schedule: { at: input.at, allowWhileIdle: true }, extra: { source: 'pet-worth-medical', eventId: input.eventId } }] })
  writeRegistry([...new Set([...readRegistry(), input.id])])
  return { scheduled: true, denied: false }
}

export async function cancelEventNotification(id: number) {
  if (!Capacitor.isNativePlatform()) return
  await LocalNotifications.cancel({ notifications: [{ id }] })
  writeRegistry(readRegistry().filter((item) => item !== id))
}

interface ReminderSyncRow {
  scheduled_at: string
  notification_id: number
  medical_events: { id: string; title: string; pets: { name: string } | null } | null
}

export async function syncMedicalNotifications() {
  if (!Capacitor.isNativePlatform()) return
  const permission = await LocalNotifications.checkPermissions()
  const { data: sessionData } = await supabase.auth.getSession()
  let desired: ReminderSyncRow[] = []
  if (sessionData.session) {
    const { data, error } = await supabase.from('reminders').select('scheduled_at, notification_id, medical_events(id, title, pets(name))').gt('scheduled_at', new Date().toISOString())
    if (error) throw error
    desired = (data ?? []) as unknown as ReminderSyncRow[]
  }
  const desiredIds = new Set(desired.map((item) => item.notification_id))
  const pending = await LocalNotifications.getPending()
  const appOwnedPending = pending.notifications.filter((item) => item.extra?.source === 'pet-worth-medical').map((item) => item.id)
  const staleIds = [...new Set([...readRegistry(), ...appOwnedPending])].filter((id) => !desiredIds.has(id))
  if (staleIds.length) await LocalNotifications.cancel({ notifications: staleIds.map((id) => ({ id })) })
  if (permission.display !== 'granted') { writeRegistry([]); return }
  const toReplace = pending.notifications.filter((item) => desiredIds.has(item.id)).map((item) => item.id)
  if (toReplace.length) await LocalNotifications.cancel({ notifications: toReplace.map((id) => ({ id })) })
  const notifications: PendingLocalNotificationSchema[] = desired.map((item) => ({
    id: item.notification_id,
    title: `Завтра: ${item.medical_events?.title ?? 'Событие'}`,
    body: item.medical_events?.pets?.name ?? 'Питомец',
    schedule: { at: new Date(item.scheduled_at), allowWhileIdle: true },
    extra: { source: 'pet-worth-medical', eventId: item.medical_events?.id },
  }))
  if (notifications.length) await LocalNotifications.schedule({ notifications })
  writeRegistry([...desiredIds])
}
