<template>
  <ion-avatar>
    <img v-if="src" :src="src" :alt="`Фото питомца ${name}`" />
    <ion-icon v-else :icon="pawOutline" :aria-label="species === 'cat' ? 'Кошка' : 'Собака'" />
  </ion-avatar>
</template>

<script setup lang="ts">
import { IonAvatar, IonIcon } from '@ionic/vue'
import { pawOutline } from 'ionicons/icons'
import type { PetSpecies } from '@/types/domain'

defineProps<{ src: string | null; name: string; species: PetSpecies; large?: boolean }>()
</script>
