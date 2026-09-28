import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PetAvatar from './PetAvatar.vue'

describe('PetAvatar', () => {
  it('uses an accessible image label when a photo exists', () => {
    const wrapper = mount(PetAvatar, { props: { src: 'https://example.test/senya.jpg', name: 'Сеня', species: 'cat' } })
    expect(wrapper.get('img').attributes('alt')).toBe('Фото питомца Сеня')
  })

  it('renders an accessible Ionic fallback without a photo', () => {
    const wrapper = mount(PetAvatar, { props: { src: null, name: 'Рекс', species: 'dog' } })
    expect(wrapper.find('[aria-label="Собака"]').exists()).toBe(true)
  })
})
