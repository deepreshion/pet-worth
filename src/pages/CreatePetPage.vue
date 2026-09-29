<template>
  <ion-page>
    <ion-header :translucent="true"><ion-toolbar><ion-buttons slot="start"><ion-back-button default-href="/home" text="" /></ion-buttons><ion-title>Добавить питомца</ion-title></ion-toolbar></ion-header>
    <ion-content :fullscreen="true"><pet-form :submitting="isPending" :error="submitError" @save="save" /></ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, toastController } from '@ionic/vue'
import PetForm from '@/components/PetForm.vue'
import { useCreatePetMutation } from '@/composables/usePets'
import type { PetFormSubmission } from '@/types/domain'
import { captureTechnicalError, trackProductEvent } from '@/lib/monitoring'

const router = useRouter()
const { mutateAsync, isPending } = useCreatePetMutation()
const submitError = ref('')
const requestId = crypto.randomUUID()

async function save(values: PetFormSubmission) {
  submitError.value = ''
  try {
    const result = await mutateAsync({ ...values, requestId })
    trackProductEvent('pet_created')
    if (result.photoUploadFailed) {
      const toast = await toastController.create({ message: 'Профиль сохранён без фото. Его можно добавить позже.', duration: 4500, color: 'warning' })
      await toast.present()
    }
    await router.replace(`/pets/${result.petId}`)
  } catch (error) {
    captureTechnicalError(error, 'create_pet')
    submitError.value = 'Не удалось сохранить профиль. Проверьте соединение и попробуйте снова.'
  }
}
</script>
