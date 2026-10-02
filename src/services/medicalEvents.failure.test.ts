import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  upload: vi.fn(), remove: vi.fn(), rpc: vi.fn(), rpcSingle: vi.fn(), attachmentMaybeSingle: vi.fn(), eventMaybeSingle: vi.fn(),
  schedule: vi.fn(), cancel: vi.fn(),
}))
vi.mock('@/lib/demo', () => ({ isDemoMode: () => false, listDemoMedicalEvents: vi.fn(), listDemoPets: vi.fn(), saveDemoMedicalEvents: vi.fn(), fileToDataUrl: vi.fn() }))
vi.mock('@/services/profile', () => ({ getCurrentProfile: () => Promise.resolve({ id: 'u', email: 'u@test', displayName: null, timezone: 'UTC' }) }))
vi.mock('@/services/notifications', () => ({ scheduleEventNotification: mocks.schedule, cancelEventNotification: mocks.cancel }))
vi.mock('@/lib/supabase', () => ({ supabase: {
  from: (table: string) => {
    if (table === 'pets') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { family_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', name: 'Сеня' }, error: null }) }) }) }
    if (table === 'medical_attachments') return { select: () => ({ eq: () => ({ maybeSingle: mocks.attachmentMaybeSingle }) }) }
    if (table === 'medical_events') return { select: () => ({ eq: () => ({ maybeSingle: mocks.eventMaybeSingle }) }) }
    if (table === 'storage_cleanup_outbox') return { select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }
    throw new Error(`Unexpected table ${table}`)
  },
  storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
  rpc: mocks.rpc,
} }))

import { deleteMedicalEvent, saveMedicalEvent } from './medicalEvents'

const input = {
  petId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', requestId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  type: 'analysis' as const, title: 'Анализ', eventDate: '2099-01-03', reminderEnabled: false,
  files: [new File(['pdf'], 'result.pdf', { type: 'application/pdf' })], retainedAttachmentIds: [],
}

describe('atomic medical event workflows', () => {
  beforeEach(() => {
    mocks.upload.mockReset().mockResolvedValue({ error: null })
    mocks.remove.mockReset().mockResolvedValue({ error: null })
    mocks.rpcSingle.mockReset()
    mocks.rpc.mockReset().mockImplementation(() => ({ single: mocks.rpcSingle }))
    mocks.attachmentMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
    mocks.eventMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
    mocks.schedule.mockReset().mockResolvedValue({ scheduled: false, denied: false })
    mocks.cancel.mockReset().mockResolvedValue(undefined)
  })

  it('removes uploads after an explicit transactional database rejection', async () => {
    mocks.rpcSingle.mockResolvedValue({ data: null, error: Object.assign(new Error('db failed'), { code: '22023' }) })
    await expect(saveMedicalEvent(input)).rejects.toThrow('db failed')
    expect(mocks.remove).toHaveBeenCalledOnce()
    expect(mocks.remove.mock.calls[0][0]).toHaveLength(1)
  })

  it('does not rely on response paths for physical cleanup', async () => {
    mocks.rpcSingle.mockResolvedValue({ data: { event_id: input.requestId, removed_storage_paths: ['old/path.pdf'], reminder_notification_id: null, reminder_scheduled_at: null }, error: null })
    await expect(saveMedicalEvent(input)).resolves.toMatchObject({ cleanupWarnings: [] })
    expect(mocks.remove).not.toHaveBeenCalled()
  })

  it('never rolls back committed attachment objects when notification scheduling fails', async () => {
    mocks.rpcSingle.mockResolvedValue({ data: { event_id: input.requestId, removed_storage_paths: [], reminder_notification_id: 42, reminder_scheduled_at: '2099-01-02T10:00:00Z' }, error: null })
    mocks.schedule.mockRejectedValue(new Error('native failed'))
    const result = await saveMedicalEvent({ ...input, reminderEnabled: true, eventTime: '10:00' })
    expect(result.cleanupWarnings).toContain('Событие сохранено, но локальное уведомление не удалось запланировать.')
    expect(mocks.remove).not.toHaveBeenCalled()
  })

  it('commits and verifies deletion before best-effort physical cleanup', async () => {
    mocks.rpcSingle.mockResolvedValue({ data: { removed_storage_paths: ['old/path.pdf'], reminder_notification_id: 42 }, error: null })
    await deleteMedicalEvent('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
    expect(mocks.rpcSingle.mock.invocationCallOrder[0]).toBeLessThan(mocks.eventMaybeSingle.mock.invocationCallOrder[0])
    expect(mocks.cancel).toHaveBeenCalledWith(42)
  })

  it('does not touch files when the delete RPC is denied', async () => {
    mocks.rpcSingle.mockResolvedValue({ data: null, error: new Error('denied') })
    await expect(deleteMedicalEvent('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')).rejects.toThrow('denied')
    expect(mocks.remove).not.toHaveBeenCalled()
    expect(mocks.cancel).not.toHaveBeenCalled()
  })

  it('keeps the committed deletion successful when physical cleanup fails', async () => {
    mocks.rpcSingle.mockResolvedValue({ data: { removed_storage_paths: ['old/path.pdf'], reminder_notification_id: null }, error: null })
    mocks.remove.mockResolvedValue({ error: new Error('storage unavailable') })
    await expect(deleteMedicalEvent('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')).resolves.toEqual({ cleanupWarnings: [] })
  })

  it('accepts an idempotent retry after a lost RPC response without deleting accepted uploads', async () => {
    mocks.rpcSingle
      .mockResolvedValueOnce({ data: null, error: new Error('network lost') })
      .mockResolvedValueOnce({ data: { event_id: input.requestId, reminder_notification_id: null, reminder_scheduled_at: null }, error: null })
    await expect(saveMedicalEvent(input)).resolves.toMatchObject({ eventId: input.requestId })
    expect(mocks.remove).not.toHaveBeenCalled()
    expect(mocks.rpcSingle).toHaveBeenCalledTimes(2)
    expect(mocks.rpc).toHaveBeenCalledTimes(2)
    expect(mocks.rpc.mock.calls[1]).toEqual(mocks.rpc.mock.calls[0])
  })

  it('does not falsely accept an unchanged existing event after a lost update response', async () => {
    mocks.rpcSingle.mockResolvedValue({ data: null, error: new Error('network lost') })
    const update = { ...input, id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', requestId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', title: 'Новое название', files: [] }
    await expect(saveMedicalEvent(update)).rejects.toThrow('network lost')
    expect(mocks.rpcSingle).toHaveBeenCalledTimes(2)
    expect(mocks.remove).not.toHaveBeenCalled()
  })
})
