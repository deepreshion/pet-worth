import { setLocale } from '@/i18n'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const queryState = vi.hoisted(() => ({ data: [] as unknown[], isPending: false, isError: false, refetch: vi.fn() }))
vi.mock('@/composables/usePets', () => ({ usePetsQuery: () => queryState }))
import PetsPage from './PetsPage.vue'

describe('PetsPage', () => {
  beforeEach(async () => { await setLocale('ru'); queryState.data = []; queryState.isPending = false; queryState.isError = false })
  it('switches a mounted page between languages', async () => {
    const wrapper = mount(PetsPage)
    await setLocale('en')
    expect(wrapper.text()).toContain('No pets yet')
    expect(wrapper.text()).toContain('Add your first pet')
    expect(wrapper.text()).not.toContain('Питомцев пока нет')
    await setLocale('ru')
    expect(wrapper.text()).toContain('Питомцев пока нет')
  })
  it('shows an actionable empty state', () => {
    const wrapper = mount(PetsPage, { global: { stubs: { BottomNav: true } } })
    expect(wrapper.text()).toContain('Питомцев пока нет')
    expect(wrapper.text()).toContain('Добавить первого питомца')
  })
})
