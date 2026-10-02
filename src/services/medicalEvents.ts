import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { supabase } from '@/lib/supabase'
import { isDemoMode, listDemoMedicalEvents, listDemoPets, saveDemoMedicalEvents } from '@/lib/demo'
import { deleteDemoAttachment, getDemoAttachment, putDemoAttachment } from '@/lib/demoAttachments'
import { getCurrentProfile } from '@/services/profile'
import type { Json } from '@/types/database'
import type { MedicalAttachment, MedicalEvent, SaveMedicalEventInput, SaveMedicalEventResult } from '@/types/domain'
import { cancelEventNotification, scheduleEventNotification } from '@/services/notifications'
import { deterministicAttachmentId, isReminderEligible, reminderScheduledAt, stableNotificationId } from '@/utils/medicalEvents'
import { reconcileStorageCleanup } from '@/services/storageCleanup'

interface EventRow {
  id: string; pet_id: string; created_by: string; type: MedicalEvent['type']; title: string; notes: string | null
  event_date: string; event_time: string | null; event_timezone: string; created_at: string; updated_at: string
  pets: { family_id: string; name: string; photo_path: string | null } | null
  medical_attachments: Array<{ id: string; event_id: string; storage_path: string; file_name: string; media_type: string; size_bytes: number }>
  reminders: Array<{ id: string; event_id: string; scheduled_at: string; notification_id: number }>
}

const eventSelect = `id, pet_id, created_by, type, title, notes, event_date, event_time, event_timezone, created_at, updated_at,
  pets(family_id, name, photo_path), medical_attachments(id, event_id, storage_path, file_name, media_type, size_bytes),
  reminders(id, event_id, scheduled_at, notification_id)`

async function getEditableFamilyIds() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('Требуется вход')
  const { data, error } = await supabase.from('family_memberships').select('family_id').eq('user_id', userData.user.id).in('role', ['owner', 'member'])
  if (error) throw error
  return new Set((data ?? []).map((item) => item.family_id))
}

async function petPhotoUrl(path: string | null) {
  if (!path) return null
  const { data } = await supabase.storage.from('pet-photos').createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

async function mapEvent(row: EventRow, canEdit: boolean): Promise<MedicalEvent> {
  return {
    id: row.id, petId: row.pet_id, familyId: row.pets?.family_id ?? '', petName: row.pets?.name ?? 'Питомец',
    petPhotoUrl: await petPhotoUrl(row.pets?.photo_path ?? null), createdBy: row.created_by, type: row.type, title: row.title,
    notes: row.notes, eventDate: row.event_date, eventTime: row.event_time?.slice(0, 5) ?? null, eventTimezone: row.event_timezone,
    createdAt: row.created_at, updatedAt: row.updated_at, canEdit,
    attachments: (row.medical_attachments ?? []).map((item) => ({ id: item.id, eventId: item.event_id, storagePath: item.storage_path, fileName: item.file_name, mediaType: item.media_type, sizeBytes: item.size_bytes })),
    reminder: row.reminders?.[0] ? { id: row.reminders[0].id, eventId: row.reminders[0].event_id, scheduledAt: row.reminders[0].scheduled_at, notificationId: row.reminders[0].notification_id } : null,
  }
}

export async function listMedicalEvents(petId?: string): Promise<MedicalEvent[]> {
  if (isDemoMode()) return listDemoMedicalEvents().filter((event) => !petId || event.petId === petId).sort((a, b) => b.eventDate.localeCompare(a.eventDate) || b.createdAt.localeCompare(a.createdAt))
  let query = supabase.from('medical_events').select(eventSelect).order('event_date', { ascending: false }).order('created_at', { ascending: false })
  if (petId) query = query.eq('pet_id', petId)
  const [{ data, error }, editableFamilies] = await Promise.all([query, getEditableFamilyIds()])
  if (error) throw error
  return Promise.all(((data ?? []) as unknown as EventRow[]).map((row) => mapEvent(row, editableFamilies.has(row.pets?.family_id ?? ''))))
}

export async function getMedicalEvent(id: string): Promise<MedicalEvent> {
  if (isDemoMode()) {
    const event = listDemoMedicalEvents().find((item) => item.id === id)
    if (!event) throw new Error('Событие не найдено')
    return event
  }
  const [{ data, error }, editableFamilies] = await Promise.all([
    supabase.from('medical_events').select(eventSelect).eq('id', id).single(), getEditableFamilyIds(),
  ])
  if (error) throw error
  const row = data as unknown as EventRow
  return mapEvent(row, editableFamilies.has(row.pets?.family_id ?? ''))
}

function safeFileName(name: string) {
  return name.replaceAll('/', '_').replaceAll('\\', '_').replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 180) || 'attachment'
}

async function removeObjectsBestEffort(paths: string[], warnings: string[]) {
  if (!paths.length) return
  const { error } = await supabase.storage.from('medical-attachments').remove(paths)
  if (error) warnings.push('Не удалось очистить некоторые файлы из хранилища.')
}

export async function saveMedicalEvent(input: SaveMedicalEventInput): Promise<SaveMedicalEventResult> {
  if (isDemoMode()) return saveDemoMedicalEvent(input)
  const profile = await getCurrentProfile()
  const timezone = input.eventTimezone ?? profile.timezone
  if (input.reminderEnabled && !isReminderEligible(input.eventDate, input.eventTime || '10:00', new Date(), timezone)) {
    throw new Error('Напоминание можно включить только минимум за 24 часа до события.')
  }
  const { data: pet, error: petError } = await supabase.from('pets').select('family_id, name').eq('id', input.petId).single()
  if (petError) throw petError
  const eventId = input.id ?? input.requestId
  const notificationId = stableNotificationId(eventId)
  const uploadedThisAttempt: string[] = []
  const newAttachments: Array<Record<string, Json>> = []
  let rpcResult: { event_id: string; reminder_notification_id: number | null; reminder_scheduled_at: string | null }
  let rpcStarted = false

  try {
    for (const [index, file] of input.files.entries()) {
      const attachmentId = deterministicAttachmentId(input.requestId, index)
      const fileName = safeFileName(file.name)
      const path = `${pet.family_id}/${eventId}/${attachmentId}/${fileName}`
      const { data: existingMetadata, error: metadataError } = await supabase.from('medical_attachments').select('id').eq('storage_path', path).maybeSingle()
      if (metadataError) throw metadataError
      if (!existingMetadata) {
        const upload = await supabase.storage.from('medical-attachments').upload(path, file, { contentType: file.type, upsert: false })
        if (upload.error && !upload.error.message.toLowerCase().includes('exist')) throw upload.error
        if (!upload.error) uploadedThisAttempt.push(path)
      }
      newAttachments.push({ id: attachmentId, storage_path: path, file_name: fileName, media_type: file.type, size_bytes: file.size })
    }

    rpcStarted = true
    const rpcArgs = {
      p_event_id: eventId, p_pet_id: input.petId, p_request_id: input.requestId, p_type: input.type,
      p_title: input.title.trim(), p_notes: input.notes?.trim() || '', p_event_date: input.eventDate,
      p_event_time: input.reminderEnabled ? input.eventTime || '10:00' : null, p_event_timezone: timezone,
      p_reminder_enabled: input.reminderEnabled, p_notification_id: input.reminderEnabled ? notificationId : null,
      p_new_attachments: newAttachments as Json, p_retained_attachment_ids: input.retainedAttachmentIds ?? [],
    }
    const firstAttempt = await supabase.rpc('save_medical_event', rpcArgs).single()
    if (!firstAttempt.error && firstAttempt.data?.event_id) rpcResult = firstAttempt.data
    else {
      // A Postgres error proves the transaction rolled back; a transport error does
      // not. Only the latter is retried with the exact same, server-idempotent payload.
      if (firstAttempt.error && 'code' in firstAttempt.error && firstAttempt.error.code) {
        await removeObjectsBestEffort(uploadedThisAttempt, [])
        throw firstAttempt.error
      }
      const retry = await supabase.rpc('save_medical_event', rpcArgs).single()
      if (retry.error || !retry.data?.event_id) throw firstAttempt.error ?? retry.error ?? new Error('Сохранение события не подтверждено')
      rpcResult = retry.data
    }

    const cleanupWarnings = await reconcileStorageCleanup()
    let reminderWarning = false
    try {
      if (rpcResult.reminder_notification_id && rpcResult.reminder_scheduled_at) {
        const notification = await scheduleEventNotification({ id: rpcResult.reminder_notification_id, eventId: rpcResult.event_id, petName: pet.name, title: input.title.trim(), at: new Date(rpcResult.reminder_scheduled_at) })
        reminderWarning = notification.denied
      } else await cancelEventNotification(notificationId)
    } catch {
      reminderWarning = Boolean(rpcResult.reminder_notification_id)
      cleanupWarnings.push(rpcResult.reminder_notification_id ? 'Событие сохранено, но локальное уведомление не удалось запланировать.' : 'Событие сохранено, но старое локальное уведомление не удалось отменить.')
    }
    return { eventId: rpcResult.event_id, reminderWarning, attachmentWarnings: [], cleanupWarnings }
  } catch (error) {
    if (!rpcStarted) await removeObjectsBestEffort(uploadedThisAttempt, [])
    // After an ambiguous transport failure uploads stay intact: a later retry with
    // the same request and deterministic ids can safely complete the transaction.
    throw error
  }
}

async function saveDemoMedicalEvent(input: SaveMedicalEventInput): Promise<SaveMedicalEventResult> {
  const events = listDemoMedicalEvents(); const pet = listDemoPets().find((item) => item.id === input.petId)
  if (!pet || !pet.canEdit) throw new Error('Событие недоступно для редактирования')
  const profile = await getCurrentProfile(); const timezone = input.eventTimezone ?? profile.timezone
  if (input.reminderEnabled && !isReminderEligible(input.eventDate, input.eventTime || '10:00', new Date(), timezone)) throw new Error('Напоминание можно включить только минимум за 24 часа до события.')
  const id = input.id ?? input.requestId; const existingIndex = events.findIndex((item) => item.id === id); const existing = existingIndex >= 0 ? events[existingIndex] : null
  const retained = new Set(input.retainedAttachmentIds ?? existing?.attachments.map((item) => item.id) ?? [])
  const retainedAttachments = existing?.attachments.filter((item) => retained.has(item.id)) ?? []
  const newAttachments = await Promise.all(input.files.map(async (file, index): Promise<MedicalAttachment> => {
    const attachmentId = deterministicAttachmentId(input.requestId, index); await putDemoAttachment(attachmentId, file)
    return { id: attachmentId, eventId: id, storagePath: `demo-attachment:${attachmentId}`, fileName: safeFileName(file.name), mediaType: file.type, sizeBytes: file.size }
  }))
  for (const attachment of existing?.attachments ?? []) if (!retained.has(attachment.id)) await deleteDemoAttachment(attachment.id)
  const now = new Date().toISOString(); const notificationId = stableNotificationId(id)
  const event: MedicalEvent = { id, petId: pet.id, familyId: pet.familyId, petName: pet.name, petPhotoUrl: pet.photoUrl, createdBy: 'demo-user', type: input.type,
    title: input.title.trim(), notes: input.notes?.trim() || null, eventDate: input.eventDate, eventTime: input.reminderEnabled ? input.eventTime || '10:00' : null,
    eventTimezone: existing && existing.eventDate === input.eventDate && existing.eventTime === (input.reminderEnabled ? input.eventTime || '10:00' : null) ? existing.eventTimezone : timezone, canEdit: true, createdAt: existing?.createdAt ?? now, updatedAt: now,
    attachments: [...retainedAttachments, ...newAttachments.filter((item) => !retainedAttachments.some((old) => old.id === item.id))],
    reminder: input.reminderEnabled ? { id: `demo-reminder-${id}`, eventId: id, scheduledAt: reminderScheduledAt(input.eventDate, input.eventTime || '10:00', existing && existing.eventDate === input.eventDate && existing.eventTime === (input.eventTime || '10:00') ? existing.eventTimezone : timezone).toISOString(), notificationId } : null }
  if (existingIndex >= 0) events.splice(existingIndex, 1, event); else events.push(event)
  saveDemoMedicalEvents(events)
  return { eventId: id, reminderWarning: input.reminderEnabled, attachmentWarnings: [], cleanupWarnings: [] }
}

export async function deleteMedicalEvent(id: string): Promise<{ cleanupWarnings: string[] }> {
  if (isDemoMode()) {
    const events = listDemoMedicalEvents(); const event = events.find((item) => item.id === id)
    if (!event?.canEdit) throw new Error('Событие недоступно для удаления')
    if (event.reminder) await cancelEventNotification(event.reminder.notificationId)
    for (const attachment of event.attachments) await deleteDemoAttachment(attachment.id)
    saveDemoMedicalEvents(events.filter((item) => item.id !== id)); return { cleanupWarnings: [] }
  }
  const { data, error } = await supabase.rpc('delete_medical_event', { p_event_id: id }).single()
  if (error || !data) throw error ?? new Error('Удаление события не подтверждено')
  const { data: stillExists, error: verifyError } = await supabase.from('medical_events').select('id').eq('id', id).maybeSingle()
  if (verifyError || stillExists) throw verifyError ?? new Error('Событие не было удалено')
  const cleanupWarnings: string[] = []
  if (data.reminder_notification_id) {
    try { await cancelEventNotification(data.reminder_notification_id) } catch { cleanupWarnings.push('Не удалось отменить локальное уведомление.') }
  }
  cleanupWarnings.push(...await reconcileStorageCleanup())
  return { cleanupWarnings }
}

async function freshAttachmentUrl(attachment: MedicalAttachment) {
  if (attachment.storagePath.startsWith('demo-attachment:')) {
    const blob = await getDemoAttachment(attachment.id)
    if (!blob) throw new Error('Демо-вложение не найдено')
    return URL.createObjectURL(blob)
  }
  if (attachment.storagePath.startsWith('data:')) return attachment.storagePath
  const { data, error } = await supabase.storage.from('medical-attachments').createSignedUrl(attachment.storagePath, 60)
  if (error || !data?.signedUrl) throw error ?? new Error('Не удалось создать ссылку на файл')
  return data.signedUrl
}

async function urlToBase64(url: string) {
  if (url.startsWith('data:')) return url.slice(url.indexOf(',') + 1)
  const response = await fetch(url)
  if (!response.ok) throw new Error('Не удалось скачать файл')
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  return btoa(binary)
}

export async function openAttachment(attachment: MedicalAttachment) {
  const popup = Capacitor.isNativePlatform() ? null : window.open('about:blank', '_blank')
  if (popup) popup.opener = null
  const url = await freshAttachmentUrl(attachment)
  if (popup) popup.location.href = url
  else window.open(url, '_blank', 'noopener,noreferrer')
}

export async function downloadAttachment(attachment: MedicalAttachment) {
  const url = await freshAttachmentUrl(attachment)
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({ path: `Pet Worth/${safeFileName(attachment.fileName)}`, data: await urlToBase64(url), directory: Directory.Documents, recursive: true })
    return
  }
  try {
    const response = await fetch(url); if (!response.ok) throw new Error('download failed')
    const objectUrl = URL.createObjectURL(await response.blob()); const link = document.createElement('a')
    link.href = objectUrl; link.download = attachment.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch {
    const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.click()
  }
}

export async function shareAttachment(attachment: MedicalAttachment) {
  const url = await freshAttachmentUrl(attachment)
  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({ path: `pet-worth-share/${attachment.id}-${safeFileName(attachment.fileName)}`, data: await urlToBase64(url), directory: Directory.Cache, recursive: true })
    await Share.share({ title: attachment.fileName, files: [written.uri], dialogTitle: 'Отправить вложение' })
  } else if (navigator.share) {
    let shareFile: File | null = null
    try {
      const response = await fetch(url); if (!response.ok) throw new Error('download failed')
      shareFile = new File([await response.blob()], attachment.fileName, { type: attachment.mediaType })
    } catch { /* Signed URL fallback below. */ }
    if (shareFile && navigator.canShare?.({ files: [shareFile] })) await navigator.share({ title: attachment.fileName, files: [shareFile] })
    else await navigator.share({ title: attachment.fileName, url })
  } else await navigator.clipboard.writeText(url)
}
