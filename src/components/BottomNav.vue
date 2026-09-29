<template>
  <ion-tab-bar slot="bottom" class="bottom-nav" aria-label="Основная навигация">
    <ion-tab-button tab="home" href="/home">
      <ion-icon :icon="route.path === '/home' ? home : homeOutline" /><ion-label>Главная</ion-label>
    </ion-tab-button>
    <ion-tab-button tab="pets" href="/pets">
      <ion-icon :icon="route.path.startsWith('/pets') ? paw : pawOutline" /><ion-label>Питомцы</ion-label>
    </ion-tab-button>
    <ion-tab-button tab="profile" href="/profile">
      <ion-icon :icon="route.path === '/profile' ? person : personOutline" /><ion-label>Пользователь</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</template>

<script setup lang="ts">
import { IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/vue'
import { useRoute } from 'vue-router'
import { home, homeOutline, paw, pawOutline, person, personOutline } from 'ionicons/icons'

const route = useRoute()
</script>
