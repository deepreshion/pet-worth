<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><ion-back-button :default-href="`/pets/${petId}`" text="" /></ion-buttons><ion-title>Новое событие</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <section v-if="pet && !pet.canEdit" class="state-card"><h1>Добавление недоступно</h1><p>У вас есть доступ только к просмотру истории этого питомца.</p></section>
      <section v-else-if="!selectedType" class="type-picker">
        <h1>Что произошло?</h1><p>Выберите тип медицинского события.</p>
        <button v-for="(meta, type) in medicalEventMeta" :key="type" type="button" @click="selectedType = type"><span class="event-dot" :style="{ background: meta.color }" />{{ meta.label }}<ion-icon :icon="chevronForwardOutline" /></button>
      </section>
      <medical-event-form v-else-if="profile" :pet-id="petId" :initial-type="selectedType" :profile-timezone="profile.timezone" />
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { chevronForwardOutline } from 'ionicons/icons'
import MedicalEventForm from '@/components/MedicalEventForm.vue'
import type { MedicalEventType } from '@/types/domain'
import { medicalEventMeta } from '@/utils/medicalEvents'
import { usePetQuery } from '@/composables/usePets'
import { useProfileQuery } from '@/composables/useProfile'
const route = useRoute(); const petId = String(route.params.petId); const selectedType = ref<MedicalEventType | null>(null); const { data: pet } = usePetQuery(petId); const { data: profile } = useProfileQuery()
</script>
