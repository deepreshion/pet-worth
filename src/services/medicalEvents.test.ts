import { beforeEach, describe, expect, it } from 'vitest'
import { deleteMedicalEvent, listMedicalEvents, saveMedicalEvent } from './medicalEvents'
import { enableDemoMode } from '@/lib/demo'
import { setDemoAttachmentStoreForTests } from '@/lib/demoAttachments'

const blobs = new Map<string, Blob>()

describe('demo medical events', () => {
  beforeEach(() => {
    localStorage.clear()
    enableDemoMode()
    blobs.clear()
    setDemoAttachmentStoreForTests({
      put: async (id, blob) => { blobs.set(id, blob) }, get: async (id) => blobs.get(id),
      delete: async (id) => { blobs.delete(id) }, clear: async () => { blobs.clear() },
    })
  })

  it('creates once for repeated request id and keeps attachments', async () => {
    const input = {
      petId: 'demo-senya', requestId: 'same-request', type: 'analysis' as const,
      title: 'Общий анализ крови', eventDate: '2026-09-01', reminderEnabled: false,
      files: [new File(['pdf'], 'result.pdf', { type: 'application/pdf' })],
    }
    const first = await saveMedicalEvent(input)
    const retry = await saveMedicalEvent(input)
    const events = await listMedicalEvents('demo-senya')
    expect(retry.eventId).toBe(first.eventId)
    expect(events).toHaveLength(1)
    expect(events[0].attachments).toHaveLength(1)
    expect(events[0].attachments[0].storagePath).toMatch(/^demo-attachment:/)
    expect(localStorage.getItem('pet-worth-demo-medical-events')).not.toContain('data:')
    expect(blobs.size).toBe(1)
  })

  it('supports update and delete', async () => {
    const created = await saveMedicalEvent({ petId: 'demo-senya', requestId: 'create', type: 'vet_visit', title: 'Приём', eventDate: '2026-08-01', reminderEnabled: false, files: [] })
    await saveMedicalEvent({ id: created.eventId, petId: 'demo-senya', requestId: 'edit', type: 'procedure', title: 'Операция', eventDate: '2026-08-02', reminderEnabled: false, files: [] })
    expect((await listMedicalEvents())[0]).toMatchObject({ title: 'Операция', type: 'procedure', eventDate: '2026-08-02' })
    await deleteMedicalEvent(created.eventId)
    expect(await listMedicalEvents()).toEqual([])
  })
})
