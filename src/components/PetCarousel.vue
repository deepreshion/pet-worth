<template>
  <section aria-labelledby="pet-carousel-title">
    <div class="section-heading">
      <h2 id="pet-carousel-title">Ваши питомцы</h2>
      <router-link to="/pets" class="text-link">Все питомцы</router-link>
    </div>
    <div ref="track" class="pet-carousel" :class="{ 'pet-carousel--single': pets.length === 1 }" role="list" aria-label="Питомцы" @scroll.passive="updateActive">
      <router-link v-for="(pet, index) in pets" :key="pet.id" :to="`/pets/${pet.id}`" class="pet-slide" :class="{ 'pet-slide--active': index === activeIndex }" role="listitem" :aria-label="`Открыть профиль питомца ${pet.name}`">
        <pet-avatar :src="pet.photoUrl" :name="pet.name" :species="pet.species" />
        <div class="pet-slide__body">
          <strong>{{ pet.name }}</strong>
          <span>{{ speciesLabel(pet.species) }}<template v-if="pet.breed">, {{ pet.breed }}</template></span>
          <span>{{ formatPetAge(pet.birthDate, pet.birthDateApproximate) || 'Возраст не указан' }}<template v-if="pet.latestWeightKg">, {{ pet.latestWeightKg.toLocaleString('ru-RU') }} кг</template></span>
        </div>
      </router-link>
    </div>
    <div v-if="pets.length > 1" class="carousel-dots" :aria-label="`Карточка ${activeIndex + 1} из ${pets.length}`">
      <span v-for="(_, index) in pets" :key="index" :class="{ active: index === activeIndex }" aria-hidden="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PetAvatar from '@/components/PetAvatar.vue'
import type { PetSummary, PetSpecies } from '@/types/domain'
import { formatPetAge } from '@/utils/pet'

defineProps<{ pets: PetSummary[] }>()
const track = ref()
const activeIndex = ref(0)
function speciesLabel(species: PetSpecies) { return species === 'cat' ? 'Кошка' : 'Собака' }
function updateActive() {
  if (!track.value) return
  const slides = Array.from(track.value.children) as Array<{ offsetLeft: number; offsetWidth: number }>
  const center = track.value.scrollLeft + track.value.clientWidth / 2
  activeIndex.value = slides.reduce((best, slide, index) => Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center) < Math.abs(slides[best].offsetLeft + slides[best].offsetWidth / 2 - center) ? index : best, 0)
}
</script>
