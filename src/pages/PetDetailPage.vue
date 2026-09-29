<template>
  <ion-page>
    <ion-header :translucent="true"><ion-toolbar><ion-buttons slot="start"><ion-back-button default-href="/pets" text="" /></ion-buttons><ion-title>{{ pet?.name || 'Питомец' }}</ion-title><ion-buttons slot="end"><ion-button v-if="pet" :router-link="`/pets/${id}/edit`" aria-label="Редактировать профиль"><ion-icon slot="icon-only" :icon="createOutline" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content :fullscreen="true" class="page-content">
      <div v-if="isPending" class="detail-skeleton" aria-busy="true"><ion-skeleton-text :animated="true" /><ion-skeleton-text :animated="true" /></div>
      <section v-else-if="isError || !pet" class="state-card"><h2>Питомец не найден</h2><p>Возможно, профиль недоступен или был удалён.</p><ion-button router-link="/pets">К списку питомцев</ion-button></section>
      <template v-else>
        <article class="pet-hero">
          <img v-if="pet.photoUrl" :src="pet.photoUrl" :alt="`Фото питомца ${pet.name}`" />
          <div v-else class="pet-hero__fallback"><ion-icon :icon="pawOutline" aria-hidden="true" /><span>Фото пока нет</span></div>
          <div class="pet-hero__content">
              <h1>{{ pet.name }}</h1>
<!--               <p>{{ speciesLabel }}<template v-if="pet.breed">, {{ pet.breed }}</template></p> -->
          </div>
        </article>
<!--         <div class="detail-actions"> -->
<!--           <ion-button expand="block" :router-link="`/pets/${id}/edit`"><ion-icon slot="start" :icon="createOutline" />Редактировать профиль</ion-button> -->
<!--           <ion-button expand="block" fill="outline" :disabled="photoPending" @click="photoInput?.click()"><ion-spinner v-if="photoPending" slot="start" name="crescent" /><ion-icon v-else slot="start" :icon="cameraOutline" />{{ photoPending ? 'Загружаем' : 'Заменить фотографию' }}</ion-button> -->
<!--           <input ref="photoInput" hidden type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" @change="replacePhoto" /> -->
<!--           <ion-text v-if="photoError" color="danger" role="alert"><p>{{ photoError }}</p></ion-text> -->
<!--         </div> -->
        <section class="facts-section" aria-labelledby="facts-title"><h2 id="facts-title">О питомце</h2><dl class="facts-grid"><div><dt>Вид</dt><dd>{{ speciesLabel }}</dd></div><div><dt>Порода</dt><dd>{{ pet.breed || 'Не указана' }}</dd></div><div><dt>Пол</dt><dd>{{ sexLabel }}</dd></div><div><dt>Возраст</dt><dd>{{ birthLabel }}</dd></div><div><dt>Последний вес</dt><dd>{{ pet.latestWeightKg ? `${pet.latestWeightKg.toLocaleString('ru-RU')} кг` : 'Не указан' }}</dd></div></dl></section>
        <section class="next-stage-card"><ion-icon :icon="medicalOutline" aria-hidden="true" /><div><h2>Медицинская история</h2><p>Будет добавлена на следующем этапе.</p></div></section>
        <nav class="back-links" aria-label="Переходы"><router-link to="/pets">Все питомцы</router-link><router-link to="/home">На главную</router-link></nav>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonSkeletonText, IonSpinner, IonText, IonTitle, IonToolbar } from '@ionic/vue'
import { cameraOutline, createOutline, medicalOutline, pawOutline } from 'ionicons/icons'
import { usePetQuery, useReplacePetPhotoMutation } from '@/composables/usePets'
import { formatPetAge, validatePhoto } from '@/utils/pet'
import { captureTechnicalError } from '@/lib/monitoring'
const route = useRoute(); const id = String(route.params.id); const { data: pet, isPending, isError } = usePetQuery(id)
const { mutateAsync: mutatePhoto, isPending: photoPending } = useReplacePetPhotoMutation(); const photoInput = ref<HTMLInputElement>(); const photoError = ref('')
const speciesLabel = computed(() => pet.value?.species === 'cat' ? 'Кошка' : 'Собака')
const sexLabel = computed(() => pet.value?.sex === 'female' ? 'Самка' : pet.value?.sex === 'male' ? 'Самец' : 'Не указан')
const birthLabel = computed(() => { if (!pet.value?.birthDate) return 'Не указан'; if (pet.value.birthDateApproximate) return formatPetAge(pet.value.birthDate, true) || 'Не указан'; const date = new Date(`${pet.value.birthDate}T00:00:00Z`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); return `${date} (${formatPetAge(pet.value.birthDate, false)})` })
async function replacePhoto(event: Event) {
  const photo = (event.target as HTMLInputElement).files?.[0]; if (!photo || !pet.value) return
  const validationError = validatePhoto(photo); if (validationError) { photoError.value = validationError; return }
  photoError.value = ''
  try { await mutatePhoto({ petId: pet.value.id, familyId: pet.value.familyId, photo }) }
  catch (error) { captureTechnicalError(error, 'replace_pet_photo'); photoError.value = 'Не удалось заменить фотографию. Старая фотография сохранена.' }
  finally { if (photoInput.value) photoInput.value.value = '' }
}
</script>
