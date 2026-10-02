<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><ion-back-button :default-href="`/medical-events/${id}`" text="" /></ion-buttons><ion-title>Редактировать событие</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content"><div v-if="isPending" class="form-skeleton"><ion-skeleton-text :animated="true" /></div><section v-else-if="!event || !event.canEdit" class="state-card"><h1>Редактирование недоступно</h1><p>У вас есть доступ только к просмотру этого события.</p></section><medical-event-form v-else-if="profile" :pet-id="event.petId" :initial-type="event.type" :profile-timezone="profile.timezone" :event="event" /></ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonSkeletonText, IonTitle, IonToolbar } from '@ionic/vue'
import MedicalEventForm from '@/components/MedicalEventForm.vue'
import { useMedicalEventQuery } from '@/composables/useMedicalEvents'
import { useProfileQuery } from '@/composables/useProfile'
const route = useRoute(); const id = String(route.params.id); const { data: event, isPending } = useMedicalEventQuery(id); const { data: profile } = useProfileQuery()
</script>
