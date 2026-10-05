<template>
  <ion-avatar>
    <img v-if="src" :src="src" :alt="t('Фото питомца {name}', { name })" />
    <ion-icon v-else :icon="pawOutline" :aria-label="species === 'cat' ? t('Кошка') : t('Собака')" />
  </ion-avatar>
</template>

<script setup lang="ts">
import { t } from '@/i18n'
import { IonAvatar, IonIcon } from '@ionic/vue'
import { pawOutline } from 'ionicons/icons'
import type { PetSpecies } from '@/types/domain'

defineProps<{ src: string | null; name: string; species: PetSpecies; large?: boolean }>()
</script>
