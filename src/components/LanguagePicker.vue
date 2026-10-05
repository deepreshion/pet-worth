<template>
  <ion-item lines="none">
    <ion-select v-model="selectedLocale" :disabled="saving" :label="t('Язык')" interface="popover" @ion-change="change($event.detail.value)">
      <ion-select-option value="ru">Русский</ion-select-option>
      <ion-select-option value="en">English</ion-select-option>
    </ion-select>
  </ion-item>
  <ion-text v-if="error" color="danger" role="alert"><p class="ion-padding-horizontal">{{ t('Не удалось сохранить язык на устройстве.') }}</p></ion-text>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonItem, IonSelect, IonSelectOption, IonText } from '@ionic/vue'
import { locale, setLocale, t } from '@/i18n'
import { syncMedicalNotifications } from '@/services/notifications'
import { captureTechnicalError } from '@/lib/monitoring'

const error = ref(false)
const saving = ref(false)
const selectedLocale = ref(locale.value)
watch(locale, (value) => { selectedLocale.value = value })
async function change(value: unknown) {
  if (value !== 'ru' && value !== 'en') return
  error.value = false
  saving.value = true
  try { await setLocale(value) }
  catch (caught) { selectedLocale.value = locale.value; error.value = true; captureTechnicalError(caught, 'save_language'); return }
  finally { saving.value = false }
  try { await syncMedicalNotifications() }
  catch (caught) { captureTechnicalError(caught, 'sync_notification_language') }
}
</script>
