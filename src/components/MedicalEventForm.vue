<template>
  <form class="medical-form" @submit.prevent="submit">
    <label class="field-label">Тип события
      <select v-model="type" class="native-field">
        <option v-for="(meta, value) in medicalEventMeta" :key="value" :value="value">{{ meta.label }}</option>
      </select>
    </label>
    <label class="field-label">Дата *<input v-model="eventDate" class="native-field" type="date" required /></label>
    <label class="field-label">Название *<input v-model="title" class="native-field" maxlength="120" required /></label>
    <label class="field-label">Заметка<textarea v-model="notes" class="native-field" rows="5" maxlength="10000" placeholder="Результаты, рекомендации или важные детали" /></label>

    <section class="attachment-picker" aria-labelledby="attachments-title">
      <div><h2 id="attachments-title">Вложения</h2><p>Фото или PDF, до 20 МБ каждый.</p></div>
      <ion-button type="button" fill="outline" @click="fileInput?.click()"><ion-icon slot="start" :icon="attachOutline" />Добавить</ion-button>
      <input ref="fileInput" hidden type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" @change="pickFiles" />
      <ul v-if="retained.length || files.length" class="attachment-list">
        <li v-for="attachment in retained" :key="attachment.id"><span>{{ attachment.fileName }}</span><button type="button" aria-label="Убрать вложение" @click="removeRetained(attachment.id)">Убрать</button></li>
        <li v-for="(file, index) in files" :key="`${file.name}-${index}`"><span>{{ file.name }}</span><button type="button" aria-label="Убрать новый файл" @click="files.splice(index, 1)">Убрать</button></li>
      </ul>
    </section>

    <section v-if="reminderEligible" class="reminder-card">
      <ion-toggle v-model="reminderEnabled">Напомнить за 24 часа</ion-toggle>
      <label v-if="reminderEnabled" class="field-label">Время события<input v-model="eventTime" class="native-field" type="time" required /></label>
    </section>
    <p v-else-if="eventDate > today" class="form-hint">Напоминание недоступно: до выбранного времени осталось меньше 24 часов.</p>
    <ion-text v-if="error" color="danger" role="alert"><p>{{ error }}</p></ion-text>
    <ion-button expand="block" type="submit" :disabled="pending"><ion-spinner v-if="pending" slot="start" name="crescent" />{{ pending ? 'Сохраняем…' : 'Сохранить событие' }}</ion-button>
  </form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { IonButton, IonIcon, IonSpinner, IonText, IonToggle } from '@ionic/vue'
import { attachOutline } from 'ionicons/icons'
import type { MedicalEvent, MedicalEventType } from '@/types/domain'
import { useSaveMedicalEventMutation } from '@/composables/useMedicalEvents'
import { isReminderEligible, localDateString, medicalEventMeta, validateMedicalFiles } from '@/utils/medicalEvents'
import { captureTechnicalError } from '@/lib/monitoring'

const props = defineProps<{ petId: string; initialType: MedicalEventType; profileTimezone: string; event?: MedicalEvent }>()
const lifecycleProfileTimezone = props.profileTimezone
const router = useRouter()
const type = ref(props.event?.type ?? props.initialType)
const eventDate = ref(props.event?.eventDate ?? localDateString())
const title = ref(props.event?.title ?? medicalEventMeta[props.initialType].label)
const notes = ref(props.event?.notes ?? '')
const eventTime = ref(props.event?.eventTime ?? '10:00')
const initialDate = props.event?.eventDate ?? localDateString()
const initialTime = props.event?.eventTime ?? null
const dateTimeChanged = computed(() => eventDate.value !== initialDate || (reminderEnabled.value ? eventTime.value : null) !== initialTime)
const timezoneContext = computed(() => props.event && !dateTimeChanged.value ? props.event.eventTimezone : lifecycleProfileTimezone)
const reminderEnabled = ref(Boolean(props.event?.reminder) && isReminderEligible(initialDate, props.event?.eventTime ?? '10:00', new Date(), props.event?.eventTimezone ?? lifecycleProfileTimezone))
const files = ref<File[]>([])
const retained = ref([...(props.event?.attachments ?? [])])
const fileInput = ref<HTMLInputElement>()
const error = ref('')
const requestId = crypto.randomUUID()
const saved = ref(false)
const { mutateAsync, isPending: pending } = useSaveMedicalEventMutation()
const today = localDateString()
const reminderEligible = computed(() => isReminderEligible(eventDate.value, eventTime.value, new Date(), timezoneContext.value))
const initialSnapshot = JSON.stringify({ type: type.value, eventDate: eventDate.value, title: title.value, notes: notes.value, eventTime: eventTime.value, reminderEnabled: reminderEnabled.value, retained: retained.value.map((item) => item.id) })
const dirty = computed(() => files.value.length > 0 || JSON.stringify({ type: type.value, eventDate: eventDate.value, title: title.value, notes: notes.value, eventTime: eventTime.value, reminderEnabled: reminderEnabled.value, retained: retained.value.map((item) => item.id) }) !== initialSnapshot)

watch(type, (value, previous) => {
  if (!props.event && title.value === medicalEventMeta[previous].label) title.value = medicalEventMeta[value].label
})
watch(reminderEligible, (eligible) => { if (!eligible) reminderEnabled.value = false })

function beforeUnload(event: Event) { if (dirty.value && !saved.value) event.preventDefault() }
window.addEventListener('beforeunload', beforeUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(() => !dirty.value || saved.value || window.confirm('Закрыть форму и потерять несохранённые изменения?'))

function pickFiles(event: Event) {
  const selected = Array.from((event.target as HTMLInputElement).files ?? [])
  const validation = validateMedicalFiles(selected)
  if (validation) { error.value = validation; return }
  files.value.push(...selected)
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
function removeRetained(id: string) { retained.value = retained.value.filter((item) => item.id !== id) }

async function submit() {
  error.value = ''
  if (!title.value.trim() || !eventDate.value) { error.value = 'Укажите дату и название.'; return }
  try {
    const result = await mutateAsync({
      id: props.event?.id,
      petId: props.petId,
      requestId,
      type: type.value,
      title: title.value,
      notes: notes.value,
      eventDate: eventDate.value,
      eventTime: reminderEnabled.value ? eventTime.value : undefined,
      eventTimezone: timezoneContext.value,
      reminderEnabled: reminderEnabled.value,
      files: files.value,
      retainedAttachmentIds: retained.value.map((item) => item.id),
    })
    saved.value = true
    if (result.reminderWarning) window.alert('Событие сохранено, но системные уведомления недоступны или запрещены. Напоминание не сработает.')
    if (result.cleanupWarnings.length) window.alert(result.cleanupWarnings.join('\n'))
    await router.replace(`/medical-events/${result.eventId}`)
  } catch (caught) {
    captureTechnicalError(caught, 'save_medical_event')
    error.value = caught instanceof Error && caught.message.startsWith('Напоминание') ? caught.message : 'Не удалось сохранить событие. Данные и выбранные файлы остались в форме.'
  }
}
</script>
