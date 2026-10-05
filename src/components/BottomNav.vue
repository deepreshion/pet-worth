<template>
  <ion-tab-bar slot="bottom" class="bottom-nav" :aria-label="t('Основная навигация')">
    <ion-tab-button tab="home" href="/home">
      <ion-icon :icon="route.path === '/home' ? home : homeOutline" /><ion-label> {{ t('Главная') }} </ion-label>
    </ion-tab-button>
    <ion-tab-button tab="pets" href="/pets">
      <ion-icon :icon="route.path.startsWith('/pets') ? paw : pawOutline" /><ion-label> {{ t('Питомцы') }} </ion-label>
    </ion-tab-button>
    <ion-tab-button tab="profile" href="/profile">
      <ion-icon :icon="route.path === '/profile' ? person : personOutline" /><ion-label> {{ t('Пользователь') }} </ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</template>

<script setup lang="ts">
import { t } from '@/i18n'
import { IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/vue'
import { useRoute } from 'vue-router'
import { home, homeOutline, paw, pawOutline, person, personOutline } from 'ionicons/icons'

const route = useRoute()
</script>
