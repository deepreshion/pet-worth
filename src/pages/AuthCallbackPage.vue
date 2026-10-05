<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-grid>
        <ion-row class="ion-justify-content-center ion-align-items-center">
          <ion-col size="12" size-md="8" size-lg="6">
            <ion-card>
              <ion-card-content>
                <template v-if="status === 'loading'">
                  <ion-item lines="none">
                    <ion-spinner slot="start" name="crescent" />
                    <ion-label><h1> {{ t('Входим в Pet Worth') }} </h1><p> {{ t('Проверяем ссылку из письма.') }} </p></ion-label>
                  </ion-item>
                </template>
                <template v-else>
                  <ion-item lines="none">
                    <ion-icon slot="start" :icon="alertCircleOutline" color="danger" />
                    <ion-label class="ion-text-wrap"><h1> {{ t('Ссылка не сработала') }} </h1><p>{{ message }}</p></ion-label>
                  </ion-item>
                  <ion-button expand="block" router-link="/login"> {{ t('Запросить новую ссылку') }} </ion-button>
                </template>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { t } from '@/i18n'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonButton, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonIcon, IonItem, IonLabel, IonPage, IonRow, IonSpinner } from '@ionic/vue'
import { alertCircleOutline } from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'
import { captureTechnicalError } from '@/lib/monitoring'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const status = ref<'loading' | 'error'>('loading')
const message = ref(t('Ссылка могла истечь или уже была использована.'))

onMounted(async () => {
  const callbackError = route.query.error
  const code = route.query.code
  if (typeof callbackError === 'string') {
    status.value = 'error'
    return
  }
  if (typeof code !== 'string') {
    status.value = 'error'
    return
  }
  try {
    await auth.completeMagicLink(code)
    await router.replace(auth.consumeRedirect())
  } catch (error) {
    captureTechnicalError(error, 'complete_magic_link')
    status.value = 'error'
  }
})
</script>
