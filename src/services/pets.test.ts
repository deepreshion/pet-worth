import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ upload: vi.fn(), remove: vi.fn(), rpc: vi.fn() }))
vi.mock('@/lib/demo', () => ({ isDemoMode: () => false, listDemoPets: vi.fn(), saveDemoPets: vi.fn(), fileToDataUrl: vi.fn() }))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
    rpc: mocks.rpc,
  },
}))
import { uploadPetPhoto } from './pets'

describe('photo replacement', () => {
  beforeEach(() => { mocks.upload.mockReset().mockResolvedValue({ error: null }); mocks.remove.mockReset().mockResolvedValue({ error: null }); mocks.rpc.mockReset() })

  it('removes the new object when database update fails', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('db failed') })
    await expect(uploadPetPhoto('pet-id', 'family-id', new File(['x'], 'pet.jpg', { type: 'image/jpeg' }))).rejects.toThrow('db failed')
    expect(mocks.remove).toHaveBeenCalledTimes(1)
    expect(mocks.remove.mock.calls[0][0][0]).toMatch(/^family-id\/pet-id\//)
  })

  it('deletes the old object only after the new path is stored', async () => {
    mocks.rpc.mockResolvedValue({ data: 'family-id/pet-id/old.jpg', error: null })
    await uploadPetPhoto('pet-id', 'family-id', new File(['x'], 'pet.jpg', { type: 'image/jpeg' }))
    expect(mocks.rpc).toHaveBeenCalledOnce()
    expect(mocks.remove).toHaveBeenLastCalledWith(['family-id/pet-id/old.jpg'])
  })
})
