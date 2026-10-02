import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  checkPermissions: vi.fn(), getPending: vi.fn(), cancel: vi.fn(), schedule: vi.fn(), addListener: vi.fn(),
  getSession: vi.fn(), gt: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }))
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: {
  checkPermissions: mocks.checkPermissions, getPending: mocks.getPending, cancel: mocks.cancel, schedule: mocks.schedule,
  addListener: mocks.addListener, requestPermissions: vi.fn(),
} }))
vi.mock('@/lib/supabase', () => ({ supabase: {
  auth: { getSession: mocks.getSession },
  from: () => ({ select: () => ({ gt: mocks.gt }) }),
} }))

import { syncMedicalNotifications } from './notifications'

describe('notification reconciliation', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.checkPermissions.mockReset().mockResolvedValue({ display: 'granted' })
    mocks.getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: 'user' } } } })
    mocks.getPending.mockReset().mockResolvedValue({ notifications: [
      { id: 11, extra: { source: 'pet-worth-medical', eventId: 'old' } },
      { id: 22, extra: { source: 'pet-worth-medical', eventId: 'event' } },
      { id: 99, extra: { source: 'another-app' } },
    ] })
    mocks.gt.mockReset().mockResolvedValue({ data: [{ scheduled_at: '2099-01-01T09:00:00Z', notification_id: 22, medical_events: { id: 'event', title: 'Врач', pets: { name: 'Сеня' } } }], error: null })
    mocks.cancel.mockReset().mockResolvedValue(undefined)
    mocks.schedule.mockReset().mockResolvedValue(undefined)
  })

  it('cancels stale app-owned ids and replaces current schedules from database', async () => {
    localStorage.setItem('pet-worth-medical-notification-ids', JSON.stringify([11, 22]))
    await syncMedicalNotifications()
    expect(mocks.cancel).toHaveBeenNthCalledWith(1, { notifications: [{ id: 11 }] })
    expect(mocks.cancel).toHaveBeenNthCalledWith(2, { notifications: [{ id: 22 }] })
    expect(mocks.schedule).toHaveBeenCalledWith({ notifications: [expect.objectContaining({ id: 22, extra: { source: 'pet-worth-medical', eventId: 'event' } })] })
    expect(localStorage.getItem('pet-worth-medical-notification-ids')).toBe('[22]')
  })
})
