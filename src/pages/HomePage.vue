<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Pet Worth</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Уведомления" disabled>
            <ion-icon slot="icon-only" :icon="notificationsOutline" />
          </ion-button>
          <ion-button aria-label="Выйти" @click="logout">
            <ion-icon slot="icon-only" :icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar><ion-title size="large">Pet Worth</ion-title></ion-toolbar>
      </ion-header>

      <ion-list v-if="isPending" :inset="true" aria-label="Загрузка питомцев" aria-busy="true">
        <ion-item v-for="item in 3" :key="item">
          <ion-avatar slot="start"><ion-skeleton-text :animated="true" /></ion-avatar>
          <ion-label><h2><ion-skeleton-text :animated="true" /></h2><p><ion-skeleton-text :animated="true" /></p></ion-label>
        </ion-item>
      </ion-list>

      <ion-card v-else-if="isError">
        <ion-card-header><ion-card-title>Не получилось открыть данные</ion-card-title></ion-card-header>
        <ion-card-content>
          <p>Проверьте соединение и попробуйте ещё раз.</p>
          <ion-button expand="block" @click="refetch()">Повторить</ion-button>
        </ion-card-content>
      </ion-card>

      <ion-card v-else-if="!pets?.length">
        <ion-card-header>
          <ion-card-title>Добавьте первого питомца</ion-card-title>
          <ion-card-subtitle>Достаточно имени и вида. Остальное можно заполнить позже.</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button expand="block" router-link="/pets/new"><ion-icon slot="start" :icon="addOutline" />Добавить питомца</ion-button>
        </ion-card-content>
      </ion-card>

      <template v-else>
        <ion-list :inset="true">
          <ion-list-header><ion-label>Питомцы</ion-label><ion-button router-link="/pets/new">Добавить</ion-button></ion-list-header>
          <ion-item v-for="pet in pets" :key="pet.id" button :router-link="`/pets/${pet.id}`" detail>
            <pet-avatar slot="start" :src="pet.photoUrl" :name="pet.name" :species="pet.species" />
            <ion-label>
              <h2>{{ pet.name }}</h2>
              <p>{{ pet.species === 'cat' ? 'Кот' : 'Собака' }} · {{ formatPetAge(pet.birthDate, false) || 'Возраст не указан' }}</p>
            </ion-label>
            <ion-note v-if="pet.latestWeightKg" slot="end">{{ pet.latestWeightKg.toLocaleString('ru-RU') }} кг</ion-note>
          </ion-item>
        </ion-list>

        <ion-list :inset="true">
          <ion-list-header><ion-label>План ухода</ion-label></ion-list-header>
          <ion-item button detail>
            <ion-icon slot="start" :icon="medkitOutline" color="primary" />
            <ion-label><h2>Повторная вакцинация</h2><p>24 сентября, 12:00 · ВетЛайф</p></ion-label>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="medicalOutline" color="primary" />
            <ion-checkbox justify="space-between">Ветмедин, 1/2 таблетки в 20:00</ion-checkbox>
          </ion-item>
        </ion-list>

        <ion-list :inset="true">
          <ion-list-header><ion-label>Последняя запись</ion-label></ion-list-header>
          <ion-item button detail>
            <ion-icon slot="start" :icon="flaskOutline" />
            <ion-label><h2>Анализ крови</h2><p>12 сентября 2026</p></ion-label>
            <ion-note slot="end">1 файл</ion-note>
          </ion-item>
        </ion-list>

        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
          <ion-fab-button :router-link="`/pets/${pets[0].id}`" aria-label="Добавить событие"><ion-icon :icon="addOutline" /></ion-fab-button>
        </ion-fab>
      </template>
    </ion-content>

    <bottom-nav />
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IonAvatar, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonCheckbox, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonItem, IonLabel, IonList,
  IonListHeader, IonNote, IonPage, IonSkeletonText, IonTitle, IonToolbar,
} from '@ionic/vue'
import { addOutline, flaskOutline, logOutOutline, medicalOutline, medkitOutline, notificationsOutline } from 'ionicons/icons'
import BottomNav from '@/components/BottomNav.vue'
import PetAvatar from '@/components/PetAvatar.vue'
import { usePetsQuery } from '@/composables/usePets'
import { useAuthStore } from '@/stores/auth'
import { formatPetAge } from '@/utils/pet'

const router = useRouter()
const auth = useAuthStore()
const { data: pets, isPending, isError, refetch } = usePetsQuery()

async function logout() {
  await auth.signOut()
  await router.replace('/login')
}
</script>
