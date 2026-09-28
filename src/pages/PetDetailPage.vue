<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/home" text="" /></ion-buttons>
        <ion-title>{{ pet?.name || 'Питомец' }}</ion-title>
        <ion-buttons slot="end"><ion-button aria-label="Меню" disabled><ion-icon slot="icon-only" :icon="ellipsisHorizontal" /></ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-list v-if="isPending" :inset="true" aria-busy="true" aria-label="Загрузка профиля">
        <ion-item lines="none">
          <ion-avatar slot="start"><ion-skeleton-text :animated="true" /></ion-avatar>
          <ion-label><h1><ion-skeleton-text :animated="true" /></h1><p><ion-skeleton-text :animated="true" /></p></ion-label>
        </ion-item>
      </ion-list>

      <ion-card v-else-if="isError || !pet">
        <ion-card-header><ion-card-title>Питомец не найден</ion-card-title></ion-card-header>
        <ion-card-content>
          <p>Возможно, профиль недоступен или был удалён.</p>
          <ion-button expand="block" router-link="/home">На главную</ion-button>
        </ion-card-content>
      </ion-card>

      <template v-else>
        <ion-card>
          <img :src="pet.photoUrl || demoPhoto" :alt="`Фото питомца ${pet.name}`" />
          <ion-card-header>
            <ion-card-title>{{ pet.name }}</ion-card-title>
            <ion-card-subtitle>{{ pet.species === 'cat' ? 'Кот' : 'Собака' }} · {{ sexLabel }} · {{ petAge }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-button expand="block" router-link="/pets/new"><ion-icon slot="start" :icon="addOutline" />Добавить событие</ion-button>
            <ion-button v-if="!pet.photoUrl" expand="block" fill="outline" :disabled="uploading" @click="photoInput?.click()">
              <ion-spinner v-if="uploading" slot="start" name="crescent" />
              {{ uploading ? 'Загружаем' : 'Загрузить фотографию' }}
            </ion-button>
            <input ref="photoInput" hidden type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" :disabled="uploading" @change="retryPhoto" />
            <ion-text v-if="uploadError" color="danger"><p>{{ uploadError }}</p></ion-text>
          </ion-card-content>
        </ion-card>

        <ion-list :inset="true">
          <ion-list-header><ion-label>О питомце</ion-label></ion-list-header>
          <ion-item>
            <ion-icon slot="start" :icon="scaleOutline" />
            <ion-label>Вес</ion-label>
            <ion-note slot="end">{{ pet.latestWeightKg ? formatWeight(pet.latestWeightKg) : 'Не указан' }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="medicalOutline" />
            <ion-label>Лекарство</ion-label>
            <ion-note slot="end">Ветмедин</ion-note>
          </ion-item>
        </ion-list>

        <ion-list :inset="true">
          <ion-list-header><ion-label>Разделы</ion-label></ion-list-header>
          <ion-item button detail>
            <ion-icon slot="start" :icon="albumsOutline" />
            <ion-label><h2>История</h2><p>12 записей</p></ion-label>
          </ion-item>
          <ion-item button detail>
            <ion-icon slot="start" :icon="documentTextOutline" />
            <ion-label><h2>Документы</h2><p>4 файла</p></ion-label>
          </ion-item>
        </ion-list>

        <ion-list :inset="true">
          <ion-list-header><ion-label>Ближайшее</ion-label></ion-list-header>
          <ion-item button detail>
            <ion-icon slot="start" :icon="medicalOutline" color="primary" />
            <ion-label><h2>Повторная вакцинация</h2><p>24 сентября, 12:00 · ВетЛайф</p></ion-label>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>

    <bottom-nav />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import {
  IonAvatar, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle,
  IonCardTitle, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonPage,
  IonSkeletonText, IonSpinner, IonText, IonTitle, IonToolbar,
} from '@ionic/vue'
import { addOutline, albumsOutline, documentTextOutline, ellipsisHorizontal, medicalOutline, scaleOutline } from 'ionicons/icons'
import BottomNav from '@/components/BottomNav.vue'
import { petKeys, usePetQuery } from '@/composables/usePets'
import { uploadPetPhoto } from '@/services/pets'
import { formatPetAge, validatePhoto } from '@/utils/pet'
import { captureTechnicalError, trackProductEvent } from '@/lib/monitoring'

const demoPhoto = '/assets/senya-hero.png'
const route = useRoute()
const queryClient = useQueryClient()
const id = String(route.params.id)
const { data: pet, isPending, isError } = usePetQuery(id)
const photoInput = ref<HTMLInputElement>()
const uploading = ref(false)
const uploadError = ref('')
const petAge = computed(() => pet.value ? (formatPetAge(pet.value.birthDate, false) || 'Возраст не указан') : '')
const sexLabel = computed(() => pet.value?.sex === 'female' ? 'самка' : pet.value?.sex === 'male' ? 'самец' : 'пол не указан')

onMounted(() => trackProductEvent('pet_profile_opened'))
function formatWeight(value: number) { return `${String(value).replace('.', ',')} кг` }

async function retryPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !pet.value) return
  const validationError = validatePhoto(file)
  if (validationError) { uploadError.value = validationError; return }
  uploading.value = true
  uploadError.value = ''
  try {
    await uploadPetPhoto(pet.value.id, pet.value.familyId, file)
    await queryClient.invalidateQueries({ queryKey: petKeys.detail(id) })
    await queryClient.invalidateQueries({ queryKey: petKeys.all })
  } catch (error) {
    captureTechnicalError(error, 'retry_pet_photo')
    uploadError.value = 'Не удалось загрузить фотографию. Попробуйте ещё раз.'
  } finally {
    uploading.value = false
  }
}
</script>
