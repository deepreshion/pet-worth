<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <bottom-nav />
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonRouterOutlet, IonTabs } from '@ionic/vue'
import BottomNav from '@/components/BottomNav.vue'
</script>
