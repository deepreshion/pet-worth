<template>
  <ion-page>
    <ion-header :translucent="true"><ion-toolbar><ion-title>Pet Worth</ion-title><ion-buttons slot="end"><ion-button router-link="/profile" aria-label="Открыть профиль"><ion-icon slot="icon-only" :icon="personCircleOutline" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content :fullscreen="true" class="page-content">
      <div v-if="isPending" class="carousel-skeleton" aria-label="Загрузка питомцев" aria-busy="true"><ion-skeleton-text :animated="true" /></div>
      <section v-else-if="isError" class="state-card"><h2>Не получилось открыть данные</h2><p>Проверьте соединение и попробуйте ещё раз.</p><ion-button @click="refetch()">Повторить</ion-button></section>
      <section v-else-if="!pets?.length" class="state-card home-empty"><img src="/assets/senya-peek.png" alt="Кот Сеня выглядывает" /><h1>Добавьте первого питомца</h1><p>Достаточно имени и вида. Остальное можно заполнить позже.</p><ion-button router-link="/pets/new"><ion-icon slot="start" :icon="addOutline" />Добавить первого питомца</ion-button></section>
      <template v-else>
        <pet-carousel :pets="pets" />
        <section class="calendar-section" aria-labelledby="calendar-title">
          <div class="calendar-header"><ion-button fill="clear" aria-label="Предыдущий месяц" @click="moveMonth(-1)"><ion-icon slot="icon-only" :icon="chevronBackOutline" /></ion-button><h2 id="calendar-title">{{ monthLabel }}</h2><ion-button fill="clear" aria-label="Следующий месяц" @click="moveMonth(1)"><ion-icon slot="icon-only" :icon="chevronForwardOutline" /></ion-button></div>
          <div class="calendar-weekdays" aria-hidden="true"><span v-for="day in weekdays" :key="day">{{ day }}</span></div>
          <div class="calendar-grid" role="grid" :aria-label="monthLabel">
            <span v-for="blank in leadingBlankDays" :key="`blank-${blank}`" />
            <button v-for="day in monthDays" :key="day.date" type="button" role="gridcell" :class="{ selected: selectedDate === day.date, today: today === day.date }" :aria-label="day.ariaLabel" @click="selectedDate = day.date"><b>{{ day.number }}</b><span class="calendar-dots"><i v-for="type in dots.get(day.date)" :key="type" :style="{ background: medicalEventMeta[type].color }" /></span></button>
          </div>
          <div class="calendar-legend"><span v-for="(meta, type) in medicalEventMeta" :key="type"><i :style="{ background: meta.color }" />{{ meta.label }}</span></div>
        </section>
        <section class="day-events" aria-live="polite">
          <h2>{{ selectedDateLabel }}</h2><p v-if="eventsPending">Загружаем события…</p><p v-else-if="!selectedEvents.length" class="form-hint">На этот день событий нет.</p>
          <router-link v-for="item in selectedEvents" :key="item.id" :to="`/medical-events/${item.id}`" class="day-event-card"><ion-avatar><img v-if="item.petPhotoUrl" :src="item.petPhotoUrl" :alt="`Фото ${item.petName}`" /><ion-icon v-else :icon="pawOutline" /></ion-avatar><div><small>{{ item.petName }} · {{ medicalEventMeta[item.type].label }}</small><strong>{{ item.title }}</strong><span v-if="item.attachments.length"><ion-icon :icon="attachOutline" />{{ item.attachments.length }}</span></div><ion-icon :icon="chevronForwardOutline" /></router-link>
        </section>
        <div class="ion-padding"><ion-button expand="block" router-link="/pets/new"><ion-icon slot="start" :icon="addOutline" />Добавить питомца</ion-button></div>
      </template>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonAvatar, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonSkeletonText, IonTitle, IonToolbar } from '@ionic/vue'
import { addOutline, attachOutline, chevronBackOutline, chevronForwardOutline, pawOutline, personCircleOutline } from 'ionicons/icons'
import PetCarousel from '@/components/PetCarousel.vue'
import { usePetsQuery } from '@/composables/usePets'
import { useMedicalEventsQuery } from '@/composables/useMedicalEvents'
import { calendarDots, formatEventDate, localDateString, medicalEventMeta } from '@/utils/medicalEvents'
const { data: pets, isPending, isError, refetch } = usePetsQuery()
const { data: events, isPending: eventsPending } = useMedicalEventsQuery()
const today = localDateString(); const selectedDate = ref(today); const shownMonth = ref(new Date(`${today}T00:00:00`)); const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const monthLabel = computed(() => shownMonth.value.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }))
const leadingBlankDays = computed(() => (new Date(shownMonth.value.getFullYear(), shownMonth.value.getMonth(), 1).getDay() + 6) % 7)
const monthDays = computed(() => { const year = shownMonth.value.getFullYear(); const month = shownMonth.value.getMonth(); const count = new Date(year, month + 1, 0).getDate(); return Array.from({ length: count }, (_, index) => { const date = localDateString(new Date(year, month, index + 1)); return { number: index + 1, date, ariaLabel: formatEventDate(date) } }) })
const dots = computed(() => calendarDots(events.value ?? []))
const selectedEvents = computed(() => (events.value ?? []).filter((event) => event.eventDate === selectedDate.value))
const selectedDateLabel = computed(() => formatEventDate(selectedDate.value))
function moveMonth(delta: number) { shownMonth.value = new Date(shownMonth.value.getFullYear(), shownMonth.value.getMonth() + delta, 1); selectedDate.value = localDateString(shownMonth.value) }
</script>
