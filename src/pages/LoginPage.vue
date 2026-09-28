<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="8" size-lg="6">
            <ion-card>
              <ion-card-header>
                <ion-icon :icon="pawOutline" size="large" color="primary" aria-hidden="true" />
                <ion-card-title>Pet Worth</ion-card-title>
                <ion-card-subtitle>Профиль и медицинская история питомца в одном месте</ion-card-subtitle>
              </ion-card-header>

              <ion-card-content>
                <form v-if="!sent" @submit.prevent="submit">
                  <ion-input
                    v-model="email"
                    type="email"
                    autocomplete="email"
                    label="Электронная почта"
                    label-placement="stacked"
                    fill="outline"
                    placeholder="name@example.com"
                    required
                  />
                  <ion-text v-if="errorMessage" color="danger" role="alert"><p>{{ errorMessage }}</p></ion-text>
                  <ion-button expand="block" type="submit" :disabled="sending">
                    <ion-spinner v-if="sending" slot="start" name="crescent" />
                    {{ sending ? 'Отправляем' : 'Получить ссылку' }}
                  </ion-button>
                </form>

                <template v-else>
                  <ion-item lines="none">
                    <ion-icon slot="start" :icon="checkmarkCircleOutline" color="success" />
                    <ion-label><h2>Проверьте почту</h2><p>Ссылка отправлена на {{ email }}.</p></ion-label>
                  </ion-item>
                  <ion-button expand="block" fill="clear" @click="sent = false">Указать другую почту</ion-button>
                </template>
              </ion-card-content>
            </ion-card>

            <ion-button v-if="demoAvailable" expand="block" fill="outline" @click="openDemo">
              Посмотреть интерфейс без входа
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent,
  IonGrid, IonIcon, IonInput, IonItem, IonLabel, IonPage, IonRow, IonSpinner, IonText,
} from '@ionic/vue'
import { checkmarkCircleOutline, pawOutline } from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'
import { captureTechnicalError } from '@/lib/monitoring'
import { isDemoAvailable } from '@/lib/demo'

const auth = useAuthStore()
const router = useRouter()
const demoAvailable = isDemoAvailable()
const email = ref('')
const sending = ref(false)
const sent = ref(false)
const errorMessage = ref('')

async function submit() {
  sending.value = true
  errorMessage.value = ''
  try {
    await auth.sendMagicLink(email.value)
    sent.value = true
  } catch (error) {
    captureTechnicalError(error, 'send_magic_link')
    errorMessage.value = 'Не удалось отправить ссылку. Проверьте адрес и попробуйте ещё раз.'
  } finally {
    sending.value = false
  }
}

async function openDemo() {
  auth.enterDemo()
  await router.replace('/home')
}
</script>
