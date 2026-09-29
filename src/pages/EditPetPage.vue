<template>
  <ion-page>
    <ion-header :translucent="true"><ion-toolbar><ion-buttons slot="start"><ion-back-button :default-href="`/pets/${id}`" text="" /></ion-buttons><ion-title>Редактировать питомца</ion-title></ion-toolbar></ion-header>
    <ion-content :fullscreen="true">
      <div v-if="isPending" class="form-skeleton" aria-busy="true"><ion-skeleton-text v-for="item in 5" :key="item" :animated="true" /></div>
      <section v-else-if="isError || !pet" class="state-card"><h2>Профиль недоступен</h2><p>Не удалось открыть данные питомца.</p><ion-button @click="refetch()">Повторить</ion-button></section>
      <pet-form v-else :pet="pet" :submitting="updatePending" :error="submitError" submit-label="Сохранить изменения" @save="save" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonPage, IonSkeletonText, IonTitle, IonToolbar, toastController } from '@ionic/vue'
import PetForm from '@/components/PetForm.vue'
import { usePetQuery, useUpdatePetMutation } from '@/composables/usePets'
import type { PetFormSubmission } from '@/types/domain'
import { captureTechnicalError } from '@/lib/monitoring'
const route = useRoute(); const router = useRouter(); const id = String(route.params.id)
const { data: pet, isPending, isError, refetch } = usePetQuery(id)
const { mutateAsync, isPending: updatePending } = useUpdatePetMutation(); const submitError = ref('')
async function save(values: PetFormSubmission) {
  submitError.value = ''
  try {
    const result = await mutateAsync({ ...values, id })
    if (result.photoUploadFailed) { const toast = await toastController.create({ message: 'Данные сохранены, но фото загрузить не удалось.', duration: 4500, color: 'warning' }); await toast.present() }
    await router.replace(`/pets/${id}`)
  } catch (error) { captureTechnicalError(error, 'update_pet'); submitError.value = 'Не удалось сохранить изменения. Попробуйте ещё раз.' }
}
</script>
