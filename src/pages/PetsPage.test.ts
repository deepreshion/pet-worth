import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const queryState = vi.hoisted(() => ({ data: [] as unknown[], isPending: false, isError: false, refetch: vi.fn() }))
vi.mock('@/composables/usePets', () => ({ usePetsQuery: () => queryState }))
import PetsPage from './PetsPage.vue'

describe('PetsPage', () => {
  beforeEach(() => { queryState.data = []; queryState.isPending = false; queryState.isError = false })
  it('shows an actionable empty state', () => {
    const wrapper = mount(PetsPage, { global: { stubs: { BottomNav: true } } })
    expect(wrapper.text()).toContain('Питомцев пока нет')
    expect(wrapper.text()).toContain('Добавить первого питомца')
  })
})
