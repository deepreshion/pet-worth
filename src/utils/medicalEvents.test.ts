import { describe, expect, it } from 'vitest'
import type { MedicalEvent } from '@/types/domain'
import { calendarDots, deterministicAttachmentId, isReminderEligible, reminderScheduledAt, stableNotificationId, zonedEventDateTime } from './medicalEvents'

describe('medical event helpers', () => {
  it('only allows reminders at least 24 hours before the event', () => {
    const now = new Date('2026-10-02T10:00:00Z')
    expect(isReminderEligible('2026-10-03', '10:00', now, 'UTC')).toBe(true)
    expect(isReminderEligible('2026-10-03', '09:59', now, 'UTC')).toBe(false)
    expect(reminderScheduledAt('2026-10-04', '12:30', 'UTC').toISOString()).toBe('2026-10-03T12:30:00.000Z')
  })

  it('converts the event wall time using the explicit profile timezone', () => {
    expect(zonedEventDateTime('2026-10-04', '10:00', 'Asia/Tbilisi').toISOString()).toBe('2026-10-04T06:00:00.000Z')
    expect(reminderScheduledAt('2026-10-04', '10:00', 'Asia/Tbilisi').toISOString()).toBe('2026-10-03T06:00:00.000Z')
  })

  it('keeps one event timezone across travel and a DST boundary', () => {
    expect(zonedEventDateTime('2026-03-08', '10:00', 'America/New_York').toISOString()).toBe('2026-03-08T14:00:00.000Z')
    expect(reminderScheduledAt('2026-03-08', '10:00', 'America/New_York').toISOString()).toBe('2026-03-07T14:00:00.000Z')
    expect(reminderScheduledAt('2026-03-08', '10:00', 'Asia/Tbilisi').toISOString()).not.toBe('2026-03-07T14:00:00.000Z')
  })

  it('derives a stable positive 32-bit notification id', () => {
    const id = stableNotificationId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
    expect(id).toBe(stableNotificationId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'))
    expect(id).toBeGreaterThan(0)
    expect(id).toBeLessThanOrEqual(2_147_483_647)
  })

  it('derives stable UUIDs for attachment retries', () => {
    const id = deterministicAttachmentId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0)
    expect(id).toBe(deterministicAttachmentId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0))
    expect(id).not.toBe(deterministicAttachmentId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1))
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('deduplicates calendar dots by type and day', () => {
    const base = { attachments: [], reminder: null, familyId: 'f', petId: 'p', petName: 'Сеня', petPhotoUrl: null, createdBy: 'u', title: 'x', notes: null, eventTime: null, eventTimezone: 'UTC', canEdit: true, createdAt: '', updatedAt: '' }
    const events = [
      { ...base, id: '1', type: 'vaccination', eventDate: '2026-10-02' },
      { ...base, id: '2', type: 'vaccination', eventDate: '2026-10-02' },
      { ...base, id: '3', type: 'analysis', eventDate: '2026-10-02' },
    ] as MedicalEvent[]
    expect(calendarDots(events).get('2026-10-02')).toEqual(['vaccination', 'analysis'])
  })
})
