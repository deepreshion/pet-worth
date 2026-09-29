<template>
  <ion-page>
    <ion-header :translucent="true"><ion-toolbar><ion-title>Питомцы</ion-title><ion-buttons slot="end"><ion-button router-link="/pets/new" aria-label="Добавить питомца"><ion-icon slot="icon-only" :icon="addOutline" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content :fullscreen="true" class="page-content">
      <div v-if="isPending" class="pet-list" aria-busy="true" aria-label="Загрузка питомцев"><div v-for="item in 3" :key="item" class="pet-list-card skeleton-card"><ion-skeleton-text :animated="true" /></div></div>
      <section v-else-if="isError" class="state-card"><h2>Не удалось загрузить питомцев</h2><p>Проверьте соединение и повторите попытку.</p><ion-button @click="refetch()">Повторить</ion-button></section>
      <section v-else-if="!pets?.length" class="state-card"><img src="/assets/senya-peek.png" alt="Кот Сеня выглядывает" /><h2>Питомцев пока нет</h2><p>Создайте первый профиль. Для начала достаточно имени и вида.</p><ion-button router-link="/pets/new">Добавить первого питомца</ion-button></section>
      <div v-else class="pet-list" role="list">
        <router-link v-for="pet in pets" :key="pet.id" :to="`/pets/${pet.id}`" class="pet-list-card" role="listitem">
          <pet-avatar :src="pet.photoUrl" :name="pet.name" :species="pet.species" />
          <div><h2>{{ pet.name }}</h2><p>{{ pet.species === 'cat' ? 'Кошка' : 'Собака' }}<template v-if="pet.breed">, {{ pet.breed }}</template></p><p>{{ formatPetAge(pet.birthDate, pet.birthDateApproximate) || 'Возраст не указан' }}<template v-if="pet.latestWeightKg">, {{ pet.latestWeightKg.toLocaleString('ru-RU') }} кг</template></p></div>
          <ion-icon :icon="chevronForwardOutline" aria-hidden="true" />
        </router-link>
      </div>
      <div v-if="pets?.length" class="ion-padding"><ion-button expand="block" router-link="/pets/new"><ion-icon slot="start" :icon="addOutline" />Добавить питомца</ion-button></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonSkeletonText, IonTitle, IonToolbar } from '@ionic/vue'
import { addOutline, chevronForwardOutline } from 'ionicons/icons'
import PetAvatar from '@/components/PetAvatar.vue'
import { usePetsQuery } from '@/composables/usePets'
import { formatPetAge } from '@/utils/pet'
const { data: pets, isPending, isError, refetch } = usePetsQuery()
</script>
