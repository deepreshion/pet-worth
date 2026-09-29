<template>
  <ion-page>
    <ion-header :translucent="true"><ion-toolbar><ion-title>Pet Worth</ion-title><ion-buttons slot="end"><ion-button router-link="/profile" aria-label="Открыть профиль"><ion-icon slot="icon-only" :icon="personCircleOutline" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content :fullscreen="true" class="page-content">
      <div v-if="isPending" class="carousel-skeleton" aria-label="Загрузка питомцев" aria-busy="true"><ion-skeleton-text :animated="true" /></div>
      <section v-else-if="isError" class="state-card"><h2>Не получилось открыть данные</h2><p>Проверьте соединение и попробуйте ещё раз.</p><ion-button @click="refetch()">Повторить</ion-button></section>
      <section v-else-if="!pets?.length" class="state-card home-empty"><img src="/assets/senya-peek.png" alt="Кот Сеня выглядывает" /><h1>Добавьте первого питомца</h1><p>Достаточно имени и вида. Остальное можно заполнить позже.</p><ion-button router-link="/pets/new"><ion-icon slot="start" :icon="addOutline" />Добавить первого питомца</ion-button></section>
      <template v-else>
        <pet-carousel :pets="pets" />
        <section class="next-stage-card"><ion-icon :icon="medicalOutline" aria-hidden="true" /><div><h2>Медицинская история</h2><p>Записи о здоровье и документы будут добавлены на следующем этапе.</p></div></section>
        <div class="ion-padding"><ion-button expand="block" router-link="/pets/new"><ion-icon slot="start" :icon="addOutline" />Добавить питомца</ion-button></div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonSkeletonText, IonTitle, IonToolbar } from '@ionic/vue'
import { addOutline, medicalOutline, personCircleOutline } from 'ionicons/icons'
import PetCarousel from '@/components/PetCarousel.vue'
import { usePetsQuery } from '@/composables/usePets'
const { data: pets, isPending, isError, refetch } = usePetsQuery()
</script>
