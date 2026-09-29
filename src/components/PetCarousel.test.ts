import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PetCarousel from './PetCarousel.vue'
import type { PetSummary } from '@/types/domain'

const pet = (id: string, name: string): PetSummary => ({ id, name, familyId: 'family', species: 'cat', breed: 'Сибирская', sex: 'male', birthDate: '2023-05-23', birthDateApproximate: true, photoPath: null, photoUrl: null, latestWeightKg: 4.8 })

describe('PetCarousel', () => {
  it('does not show a position indicator for one pet', () => {
    const wrapper = mount(PetCarousel, { props: { pets: [pet('1', 'Сеня')] }, global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(wrapper.findAll('.pet-slide')).toHaveLength(1)
    expect(wrapper.find('.carousel-dots').exists()).toBe(false)
    expect(wrapper.find('.pet-carousel--single').exists()).toBe(true)
  })

  it('renders every pet and a position indicator for several pets', () => {
    const wrapper = mount(PetCarousel, { props: { pets: [pet('1', 'Сеня'), pet('2', 'Луна')] }, global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(wrapper.findAll('.pet-slide')).toHaveLength(2)
    expect(wrapper.findAll('.carousel-dots span')).toHaveLength(2)
    expect(wrapper.text()).toContain('Сибирская')
    expect(wrapper.text()).toContain('≈ 3 года')
  })
})
