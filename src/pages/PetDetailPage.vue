<template>
  <ion-page>
    <ion-header :translucent="true"><ion-toolbar><ion-buttons slot="start"><ion-back-button default-href="/pets" text="" /></ion-buttons><ion-title>{{ pet?.name || t('Питомец') }}</ion-title><ion-buttons slot="end"><ion-button v-if="pet?.canEdit" :router-link="`/pets/${id}/edit`" :aria-label="t('Редактировать профиль')"><ion-icon slot="icon-only" :icon="createOutline" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content :fullscreen="true" class="page-content">
      <div v-if="isPending" class="detail-skeleton" aria-busy="true"><ion-skeleton-text :animated="true" /><ion-skeleton-text :animated="true" /></div>
      <section v-else-if="isError || !pet" class="state-card"><h2> {{ t('Питомец не найден') }} </h2><p> {{ t('Возможно, профиль недоступен или был удалён.') }} </p><ion-button router-link="/pets"> {{ t('К списку питомцев') }} </ion-button></section>
      <template v-else>
        <article class="pet-hero"><img v-if="pet.photoUrl" :src="pet.photoUrl" :alt="t('Фото питомца {name}', { name: pet.name })" /><div v-else class="pet-hero__fallback"><ion-icon :icon="pawOutline" aria-hidden="true" /><span> {{ t('Фото пока нет') }} </span></div><div class="pet-hero__content"><h1>{{ pet.name }}</h1></div></article>
        <section class="facts-section" aria-labelledby="facts-title"><h2 id="facts-title"> {{ t('О питомце') }} </h2><dl class="facts-grid"><div><dt> {{ t('Вид') }} </dt><dd>{{ speciesLabel }}</dd></div><div><dt> {{ t('Порода') }} </dt><dd>{{ pet.breed || t('Не указана') }}</dd></div><div><dt> {{ t('Пол') }} </dt><dd>{{ sexLabel }}</dd></div><div><dt> {{ t('Возраст') }} </dt><dd>{{ birthLabel }}</dd></div><div><dt> {{ t('Последний вес') }} </dt><dd>{{ pet.latestWeightKg ? `${pet.latestWeightKg.toLocaleString(intlLocale)} ${t('кг')}` : t('Не указан') }}</dd></div></dl></section>
        <section class="medical-history" aria-labelledby="history-title">
          <div class="section-heading"><h2 id="history-title"> {{ t('Медицинская история') }} </h2><ion-button v-if="pet.canEdit" size="small" :router-link="`/pets/${id}/medical-events/new`"><ion-icon slot="start" :icon="addOutline" /> {{ t('Добавить') }} </ion-button></div>
          <p v-if="eventsPending" class="ion-padding"> {{ t('Загружаем историю…') }} </p><p v-else-if="eventsError" class="form-error ion-padding"> {{ t('Не удалось загрузить историю.') }} </p>
          <div v-else-if="!events?.length" class="history-empty"><p> {{ t('Событий пока нет.') }} </p><ion-button v-if="pet.canEdit" fill="outline" :router-link="`/pets/${id}/medical-events/new`"> {{ t('Добавить первое событие') }} </ion-button></div>
          <div v-else class="event-list"><router-link v-for="item in events" :key="item.id" :to="`/medical-events/${item.id}`" class="event-card"><span class="event-dot" :style="{ background: medicalEventMeta[item.type].color }" /><div><small>{{ medicalEventMeta[item.type].label }} · {{ formatEventDate(item.eventDate) }}</small><h3>{{ item.title }}</h3><p v-if="item.notes">{{ item.notes }}</p><span class="event-indicators"><span v-if="item.attachments.length"><ion-icon :icon="attachOutline" />{{ item.attachments.length }}</span><span v-if="item.reminder"><ion-icon :icon="notificationsOutline" /> {{ t('За 24 часа') }} </span></span></div><ion-icon :icon="chevronForwardOutline" /></router-link></div>
        </section>
        <nav class="back-links" :aria-label="t('Переходы')"><router-link to="/pets"> {{ t('Все питомцы') }} </router-link><router-link to="/home"> {{ t('На главную') }} </router-link></nav>
      </template>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { t, intlLocale } from '@/i18n'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonSkeletonText, IonTitle, IonToolbar } from '@ionic/vue'
import { addOutline, attachOutline, chevronForwardOutline, createOutline, notificationsOutline, pawOutline } from 'ionicons/icons'
import { usePetQuery } from '@/composables/usePets'
import { useMedicalEventsQuery } from '@/composables/useMedicalEvents'
import { formatPetAge } from '@/utils/pet'
import { formatEventDate, medicalEventMeta } from '@/utils/medicalEvents'
const route = useRoute(); const id = String(route.params.id); const { data: pet, isPending, isError } = usePetQuery(id)
const { data: events, isPending: eventsPending, isError: eventsError } = useMedicalEventsQuery(id)
const speciesLabel = computed(() => pet.value?.species === 'cat' ? t('Кошка') : t('Собака'))
const sexLabel = computed(() => pet.value?.sex === 'female' ? t('Самка') : pet.value?.sex === 'male' ? t('Самец') : t('Не указан'))
const birthLabel = computed(() => { if (!pet.value?.birthDate) return t('Не указан'); if (pet.value.birthDateApproximate) return formatPetAge(pet.value.birthDate, true) || t('Не указан'); const date = new Date(`${pet.value.birthDate}T00:00:00Z`).toLocaleDateString(intlLocale.value, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); return `${date} (${formatPetAge(pet.value.birthDate, false)})` })
</script>
