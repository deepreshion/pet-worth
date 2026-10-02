<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><ion-back-button :default-href="event ? `/pets/${event.petId}` : '/home'" text="" /></ion-buttons><ion-title>Медицинское событие</ion-title><ion-buttons slot="end"><ion-button v-if="event?.canEdit" :router-link="`/medical-events/${id}/edit`" aria-label="Редактировать"><ion-icon slot="icon-only" :icon="createOutline" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <div v-if="isPending" class="detail-skeleton"><ion-skeleton-text :animated="true" /></div>
      <section v-else-if="!event" class="state-card"><h1>Событие не найдено</h1><ion-button router-link="/home">На главную</ion-button></section>
      <article v-else class="event-detail">
        <div class="event-detail__type"><span class="event-dot" :style="{ background: meta.color }" />{{ meta.label }}</div>
        <h1>{{ event.title }}</h1><p class="event-detail__date">{{ formatEventDate(event.eventDate) }}<template v-if="event.eventTime">, {{ event.eventTime }}</template></p>
        <p v-if="event.notes" class="event-notes">{{ event.notes }}</p>
        <p v-if="event.reminder" class="reminder-badge"><ion-icon :icon="notificationsOutline" />Напоминание за 24 часа</p>
        <section v-if="event.attachments.length" class="detail-attachments">
          <h2>Вложения</h2>
          <article v-for="attachment in event.attachments" :key="attachment.id"><div><strong>{{ attachment.fileName }}</strong><small>{{ Math.ceil(attachment.sizeBytes / 1024) }} КБ</small></div><div class="attachment-actions"><ion-button size="small" fill="clear" @click="act(() => openAttachment(attachment))">Открыть</ion-button><ion-button size="small" fill="clear" @click="act(() => downloadAttachment(attachment))">Скачать</ion-button><ion-button size="small" fill="clear" @click="act(() => shareAttachment(attachment))">Отправить</ion-button></div></article>
        </section>
        <ion-text v-if="actionError" color="danger" role="alert"><p>{{ actionError }}</p></ion-text>
        <ion-button v-if="event.canEdit" expand="block" fill="outline" color="danger" :disabled="deletePending" @click="remove">Удалить событие</ion-button>
      </article>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonSkeletonText, IonText, IonTitle, IonToolbar } from '@ionic/vue'
import { createOutline, notificationsOutline } from 'ionicons/icons'
import { useDeleteMedicalEventMutation, useMedicalEventQuery } from '@/composables/useMedicalEvents'
import { downloadAttachment, openAttachment, shareAttachment } from '@/services/medicalEvents'
import { formatEventDate, medicalEventMeta } from '@/utils/medicalEvents'
import { captureTechnicalError } from '@/lib/monitoring'
const route = useRoute(); const router = useRouter(); const id = String(route.params.id); const { data: event, isPending } = useMedicalEventQuery(id)
const { mutateAsync: deleteEvent, isPending: deletePending } = useDeleteMedicalEventMutation(); const actionError = ref('')
const meta = computed(() => event.value ? medicalEventMeta[event.value.type] : medicalEventMeta.vaccination)
async function act(action: () => Promise<void>) { actionError.value = ''; try { await action() } catch (error) { captureTechnicalError(error, 'medical_attachment_action'); actionError.value = 'Не удалось выполнить действие с вложением.' } }
async function remove() { if (!event.value?.canEdit || !window.confirm('Удалить событие, вложения и напоминание? Это действие нельзя отменить.')) return; try { const petId = event.value.petId; const result = await deleteEvent(event.value.id); if (result.cleanupWarnings.length) window.alert(`Событие удалено. ${result.cleanupWarnings.join(' ')}`); await router.replace(`/pets/${petId}`) } catch (error) { captureTechnicalError(error, 'delete_medical_event'); actionError.value = 'Не удалось удалить событие. Попробуйте ещё раз.' } }
</script>
