<template>
  <ion-footer>
    <ion-tab-bar>
      <ion-tab-button tab="home" href="/home">
        <ion-icon :icon="homeOutline" /><ion-label>Главная</ion-label>
      </ion-tab-button>
      <ion-tab-button tab="pets" href="/pets">
        <ion-icon :icon="pawOutline" /><ion-label>Питомцы</ion-label>
      </ion-tab-button>
      <ion-tab-button tab="clinics" disabled>
        <ion-icon :icon="locationOutline" /><ion-label>Клиники</ion-label>
      </ion-tab-button>
      <ion-tab-button tab="profile" disabled>
        <ion-icon :icon="personOutline" /><ion-label>Профиль</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
  </ion-footer>
</template>

<script setup lang="ts">
import { IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/vue'
import { homeOutline, locationOutline, pawOutline, personOutline } from 'ionicons/icons'
</script>
