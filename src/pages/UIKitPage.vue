<template>
  <ion-page>
    <ion-content :fullscreen="true" class="kit-shell">
      <div class="kit-page" :class="{ 'kit-page--dark': isDark }">
        <header class="kit-header">
          <div class="kit-header__inner">
            <router-link class="kit-back" to="/home">
              <ion-icon :icon="arrowBackOutline" />
              В приложение
            </router-link>
            <div class="kit-header__actions">
              <span class="kit-version">Draft 0.1</span>
              <button class="kit-icon-button" type="button" :aria-label="isDark ? 'Включить светлую тему' : 'Включить тёмную тему'" @click="isDark = !isDark">
                <ion-icon :icon="isDark ? sunnyOutline : moonOutline" />
              </button>
            </div>
          </div>
        </header>

        <main class="kit-layout">
          <aside class="kit-index" aria-label="Разделы UI-кита">
            <p class="kit-index__brand">Pet Worth</p>
            <nav>
              <a v-for="item in indexItems" :key="item.href" :href="item.href">{{ item.label }}</a>
            </nav>
          </aside>

          <div class="kit-content">
            <section class="kit-intro" aria-labelledby="kit-title">
              <div>
                <p class="kit-kicker">UI kit / mobile foundation</p>
                <h1 id="kit-title">Спокойная забота.<br />Точные детали.</h1>
                <p class="kit-lead">Визуальная система для медицинской истории, ежедневного ухода и совместной заботы о питомце.</p>
              </div>
              <div class="kit-dials" aria-label="Параметры дизайн-направления">
                <div><strong>6</strong><span>Вариативность</span></div>
                <div><strong>3</strong><span>Движение</span></div>
                <div><strong>5</strong><span>Плотность</span></div>
              </div>
            </section>

            <section id="principles" class="kit-section">
              <div class="kit-section__heading">
                <span>01</span>
                <div><h2>Принципы</h2><p>Надёжность медицинского продукта без больничной холодности.</p></div>
              </div>
              <div class="principle-grid">
                <article class="principle-card principle-card--wide">
                  <ion-icon :icon="shieldCheckmarkOutline" />
                  <div><h3>Сначала ясность</h3><p>Дата, действие и ответственный всегда важнее декоративной информации.</p></div>
                </article>
                <article class="principle-card principle-card--sky">
                  <ion-icon :icon="heartOutline" />
                  <div><h3>Личный характер</h3><p>Фото питомца создаёт эмоцию. Интерфейс остаётся спокойным.</p></div>
                </article>
                <article class="principle-card">
                  <ion-icon :icon="eyeOutline" />
                  <div><h3>Один фокус</h3><p>На экране одно главное действие и один доминирующий акцент.</p></div>
                </article>
              </div>
            </section>

            <section id="color" class="kit-section">
              <div class="kit-section__heading">
                <span>02</span>
                <div><h2>Цвет</h2><p>Нейтральная холодная база и четыре цвета с постоянными ролями.</p></div>
              </div>
              <div class="color-grid">
                <article v-for="color in colors" :key="color.token" class="color-swatch">
                  <div class="color-swatch__sample" :style="{ background: color.hex, color: color.ink }">
                    <span>{{ color.short }}</span>
                  </div>
                  <div class="color-swatch__meta"><strong>{{ color.name }}</strong><code>{{ color.hex }}</code><small>{{ color.role }}</small></div>
                </article>
              </div>
              <div class="color-rule">
                <ion-icon :icon="informationCircleOutline" />
                <p><strong>Правило экрана:</strong> один доминирующий акцент. Остальные цвета появляются только по своей семантической роли.</p>
              </div>
            </section>

            <section id="type" class="kit-section">
              <div class="kit-section__heading">
                <span>03</span>
                <div><h2>Типографика</h2><p>Manrope Variable. Одна семья для русского и английского интерфейса.</p></div>
              </div>
              <div class="type-specimen">
                <div class="type-specimen__hero">
                  <span>Manrope Variable</span>
                  <strong>Сеня здоров,<br />данные в порядке.</strong>
                  <p>Аа Бб Вв Гг Дд Ее 0123456789</p>
                </div>
                <div class="type-scale">
                  <div><code>Display / 40</code><span class="type-display">Карточка питомца</span></div>
                  <div><code>H1 / 32</code><span class="type-h1">Медицинская история</span></div>
                  <div><code>H2 / 24</code><span class="type-h2">Ближайшие события</span></div>
                  <div><code>Body / 16</code><span class="type-body">Повторная вакцинация запланирована на 24 сентября.</span></div>
                  <div><code>Caption / 12</code><span class="type-caption">ВетЛайф, ответственный Руслан</span></div>
                </div>
              </div>
            </section>

            <section id="shape" class="kit-section">
              <div class="kit-section__heading">
                <span>04</span>
                <div><h2>Форма и ритм</h2><p>Шаг 4 px. Мягкие радиусы обозначают уровень и функцию элемента.</p></div>
              </div>
              <div class="shape-layout">
                <div class="radius-demo">
                  <div class="radius-demo__item radius-demo__item--control"><span>12</span><small>Control</small></div>
                  <div class="radius-demo__item radius-demo__item--card"><span>20</span><small>Card</small></div>
                  <div class="radius-demo__item radius-demo__item--feature"><span>28</span><small>Feature</small></div>
                  <div class="radius-demo__item radius-demo__item--pill"><span>999</span><small>Pill</small></div>
                </div>
                <div class="spacing-demo">
                  <div v-for="space in spaces" :key="space" class="spacing-demo__row">
                    <code>{{ space }} px</code>
                    <span :style="{ width: `${space * 2}px` }" />
                  </div>
                </div>
              </div>
            </section>

            <section id="controls" class="kit-section">
              <div class="kit-section__heading">
                <span>05</span>
                <div><h2>Действия</h2><p>Одна главная кнопка на контекст. Все состояния остаются различимыми.</p></div>
              </div>
              <div class="component-stage component-stage--controls">
                <div class="button-column">
                  <button class="pw-button pw-button--primary" type="button"><ion-icon :icon="addOutline" /> Добавить событие</button>
                  <button class="pw-button pw-button--secondary" type="button">Открыть историю</button>
                  <button class="pw-button pw-button--danger" type="button">Удалить запись</button>
                  <button class="pw-button pw-button--primary" type="button" disabled>Сохранение</button>
                </div>
                <div class="icon-button-column">
                  <button class="pw-icon-button" type="button" aria-label="Уведомления"><ion-icon :icon="notificationsOutline" /></button>
                  <button class="pw-icon-button pw-icon-button--filled" type="button" aria-label="Добавить"><ion-icon :icon="addOutline" /></button>
                  <button class="pw-icon-button" type="button" disabled aria-label="Недоступно"><ion-icon :icon="lockClosedOutline" /></button>
                </div>
              </div>
            </section>

            <section id="forms" class="kit-section">
              <div class="kit-section__heading">
                <span>06</span>
                <div><h2>Формы</h2><p>Label сверху, понятный helper text и ошибка рядом с полем.</p></div>
              </div>
              <div class="form-layout">
                <form class="form-specimen" @submit.prevent>
                  <div class="pw-field">
                    <label for="pet-name">Имя питомца</label>
                    <input id="pet-name" value="Сеня" />
                    <small>Так имя будет показано в медицинской карте.</small>
                  </div>
                  <div class="pw-field pw-field--error">
                    <label for="event-date">Дата события</label>
                    <input id="event-date" value="31.02.2026" aria-invalid="true" aria-describedby="event-date-error" />
                    <small id="event-date-error">Проверьте дату: в феврале нет 31 числа.</small>
                  </div>
                  <fieldset class="pw-options">
                    <legend>Вид питомца</legend>
                    <label><input type="radio" name="species" checked /> <span>Кошка</span></label>
                    <label><input type="radio" name="species" /> <span>Собака</span></label>
                  </fieldset>
                </form>
                <div class="status-stack">
                  <div class="pw-status pw-status--success"><ion-icon :icon="checkmarkCircleOutline" /><span><strong>Сохранено</strong><small>Данные доступны всей семье.</small></span></div>
                  <div class="pw-status pw-status--warning"><ion-icon :icon="alertCircleOutline" /><span><strong>Нужна дата</strong><small>Укажите дату следующей прививки.</small></span></div>
                  <div class="pw-status pw-status--danger"><ion-icon :icon="closeCircleOutline" /><span><strong>Файл не загружен</strong><small>Попробуйте снова при стабильном соединении.</small></span></div>
                </div>
              </div>
            </section>

            <section id="cards" class="kit-section">
              <div class="kit-section__heading">
                <span>07</span>
                <div><h2>Карточки</h2><p>Карточка обозначает действие или самостоятельный объект, а не просто группирует текст.</p></div>
              </div>
              <div class="card-showcase">
                <article class="event-card">
                  <div class="event-card__icon"><ion-icon :icon="medicalOutline" /></div>
                  <p>Приём в клинике</p>
                  <h3>Повторная вакцинация</h3>
                  <time datetime="2026-09-24T12:00">24 сентября, 12:00</time>
                  <div class="event-card__meta"><span><ion-icon :icon="locationOutline" /> ВетЛайф</span><span>Ответственный: Руслан</span></div>
                  <button type="button" aria-label="Открыть событие"><ion-icon :icon="arrowForwardOutline" /></button>
                </article>
                <article class="medicine-example">
                  <div><span class="medicine-example__icon"><ion-icon :icon="medicalOutline" /></span><time datetime="20:00">20:00</time></div>
                  <p>Лекарство</p><h3>Ветмедин</h3><span>1/2 таблетки</span>
                  <label class="pw-check"><input v-model="medicineDone" type="checkbox" /><span><ion-icon :icon="checkmarkOutline" /></span>{{ medicineDone ? 'Выполнено' : 'Отметить' }}</label>
                </article>
                <article class="timeline-example">
                  <span class="timeline-example__icon"><ion-icon :icon="flaskOutline" /></span>
                  <div><h3>Анализ крови</h3><p>12 сентября 2026</p><small>Результаты прикреплены</small></div>
                  <span class="attachment"><ion-icon :icon="attachOutline" /> PDF</span>
                </article>
              </div>
            </section>

            <section id="states" class="kit-section">
              <div class="kit-section__heading">
                <span>08</span>
                <div><h2>Состояния</h2><p>Загрузка, отсутствие данных и ошибка проектируются вместе с успешным состоянием.</p></div>
              </div>
              <div class="state-grid">
                <article class="state-card"><div class="skeleton-card"><span /><span /><span /></div><h3>Загрузка</h3><p>Скелетон повторяет будущую форму.</p></article>
                <article class="state-card"><ion-icon :icon="documentTextOutline" /><h3>Пока нет документов</h3><p>Добавьте анализ или запись из ветпаспорта.</p><button type="button">Добавить файл</button></article>
                <article class="state-card"><ion-icon :icon="cloudOfflineOutline" /><h3>Нет соединения</h3><p>Загруженные данные доступны. Изменения синхронизируются позже.</p><button type="button">Повторить</button></article>
              </div>
            </section>

            <section id="navigation" class="kit-section kit-section--last">
              <div class="kit-section__heading">
                <span>09</span>
                <div><h2>Навигация</h2><p>Четыре стабильных раздела. Текстовые подписи видимы всегда.</p></div>
              </div>
              <div class="nav-stage">
                <nav class="nav-example" aria-label="Пример нижней навигации">
                  <button class="is-active" type="button"><ion-icon :icon="home" /><span>Главная</span></button>
                  <button type="button"><ion-icon :icon="paw" /><span>Питомцы</span></button>
                  <button type="button"><ion-icon :icon="locationOutline" /><span>Клиники</span></button>
                  <button type="button"><ion-icon :icon="personOutline" /><span>Профиль</span></button>
                </nav>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import {
  addOutline,
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  attachOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  closeCircleOutline,
  cloudOfflineOutline,
  documentTextOutline,
  eyeOutline,
  flaskOutline,
  heartOutline,
  home,
  informationCircleOutline,
  locationOutline,
  lockClosedOutline,
  medicalOutline,
  moonOutline,
  notificationsOutline,
  paw,
  personOutline,
  shieldCheckmarkOutline,
  sunnyOutline,
} from 'ionicons/icons'
import '@fontsource-variable/manrope'

const isDark = ref(globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
const medicineDone = ref(false)

const indexItems = [
  { href: '#principles', label: 'Принципы' },
  { href: '#color', label: 'Цвет' },
  { href: '#type', label: 'Типографика' },
  { href: '#shape', label: 'Форма и ритм' },
  { href: '#controls', label: 'Действия' },
  { href: '#forms', label: 'Формы' },
  { href: '#cards', label: 'Карточки' },
  { href: '#states', label: 'Состояния' },
  { href: '#navigation', label: 'Навигация' },
]

const colors = [
  { token: 'bg', short: 'BG', name: 'Cloud', hex: '#F5F6F8', role: 'Фон', ink: '#17181C' },
  { token: 'ink', short: 'Aa', name: 'Ink', hex: '#17181C', role: 'Текст', ink: '#F4F5F7' },
  { token: 'sky', short: 'Sky', name: 'Sky', hex: '#59B6F0', role: 'Бренд', ink: '#17181C' },
  { token: 'lime', short: 'Go', name: 'Lime', hex: '#D7F45B', role: 'Действие', ink: '#17181C' },
  { token: 'lilac', short: 'Doc', name: 'Lilac', hex: '#DCD4F8', role: 'Документы', ink: '#17181C' },
  { token: 'coral', short: 'Care', name: 'Coral', hex: '#F27B66', role: 'Уход', ink: '#17181C' },
  { token: 'success', short: 'OK', name: 'Leaf', hex: '#287A4B', role: 'Успех', ink: '#FFFFFF' },
  { token: 'danger', short: '!', name: 'Alert', hex: '#B42318', role: 'Ошибка', ink: '#FFFFFF' },
]

const spaces = [4, 8, 12, 16, 24, 32, 48]
</script>

<style scoped>
.kit-page {
  --k-bg: #f5f6f8;
  --k-surface: #fff;
  --k-surface-soft: #eceef2;
  --k-ink: #17181c;
  --k-muted: #5f646d;
  --k-line: #dde0e6;
  --k-sky: #59b6f0;
  --k-lime: #d7f45b;
  --k-lilac: #dcd4f8;
  --k-coral: #f27b66;
  --k-success: #287a4b;
  --k-warning: #9a5a00;
  --k-danger: #b42318;
  min-height: 100dvh;
  color: var(--k-ink);
  background: var(--k-bg);
  font-family: "Manrope Variable", "SF Pro Text", "Segoe UI", system-ui, sans-serif;
  transition: color .2s ease, background-color .2s ease;
}

.kit-page--dark {
  --k-bg: #17181c;
  --k-surface: #22242a;
  --k-surface-soft: #2b2e35;
  --k-ink: #f4f5f7;
  --k-muted: #b5bac3;
  --k-line: #3a3e47;
  --k-sky: #68bdf3;
  --k-lime: #d2ef63;
  --k-lilac: #a99ae2;
  --k-coral: #f08a76;
  --k-success: #62be83;
  --k-warning: #e2a64c;
  --k-danger: #ff8178;
}

.kit-page *, .kit-page *::before, .kit-page *::after { box-sizing: border-box; }
.kit-page h1, .kit-page h2, .kit-page h3, .kit-page p { margin-top: 0; }
.kit-page button, .kit-page input { font: inherit; }
.kit-header { position: sticky; z-index: 10; top: 0; border-bottom: 1px solid color-mix(in srgb, var(--k-line) 80%, transparent); background: color-mix(in srgb, var(--k-bg) 88%, transparent); backdrop-filter: blur(18px); }
.kit-header__inner { width: min(100% - 32px, 1180px); min-height: 68px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.kit-back { display: inline-flex; align-items: center; gap: 8px; color: var(--k-ink); font-size: 14px; font-weight: 700; }
.kit-back ion-icon { font-size: 20px; }
.kit-header__actions { display: flex; align-items: center; gap: 10px; }
.kit-version { padding: 7px 11px; color: var(--k-muted); background: var(--k-surface-soft); border-radius: 999px; font-size: 12px; font-weight: 700; }
.kit-icon-button { width: 44px; height: 44px; display: grid; place-items: center; color: var(--k-ink); background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 50%; font-size: 21px; cursor: pointer; }
.kit-icon-button:active { transform: scale(.98); }
.kit-icon-button:focus-visible, .kit-back:focus-visible, .kit-page button:focus-visible, .kit-page input:focus-visible, .kit-index a:focus-visible { outline: 3px solid var(--k-sky); outline-offset: 3px; }

.kit-layout { width: min(100% - 32px, 1180px); margin: 0 auto; display: grid; grid-template-columns: 176px minmax(0, 1fr); gap: 64px; }
.kit-index { position: sticky; top: 104px; height: max-content; padding-top: 64px; }
.kit-index__brand { margin-bottom: 22px; font-size: 17px; font-weight: 800; letter-spacing: -.04em; }
.kit-index nav { display: grid; gap: 3px; }
.kit-index a { padding: 7px 9px; color: var(--k-muted); border-radius: 9px; font-size: 13px; font-weight: 600; transition: color .18s ease, background-color .18s ease; }
.kit-index a:hover { color: var(--k-ink); background: var(--k-surface-soft); }
.kit-content { min-width: 0; padding-bottom: 100px; }

.kit-intro { min-height: 480px; padding: 78px 0 56px; display: grid; grid-template-columns: 1.25fr .75fr; align-items: end; gap: 48px; border-bottom: 1px solid var(--k-line); }
.kit-kicker { margin-bottom: 18px; color: var(--k-muted); font-size: 12px; font-weight: 700; }
.kit-intro h1 { max-width: 720px; margin-bottom: 22px; font-size: clamp(42px, 6.2vw, 76px); font-weight: 800; line-height: .98; letter-spacing: -.065em; }
.kit-lead { max-width: 610px; margin-bottom: 0; color: var(--k-muted); font-size: 18px; line-height: 1.55; }
.kit-dials { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--k-line); border-bottom: 1px solid var(--k-line); }
.kit-dials div { min-width: 0; padding: 18px 8px 18px 0; }
.kit-dials div + div { padding-left: 13px; border-left: 1px solid var(--k-line); }
.kit-dials strong, .kit-dials span { display: block; }
.kit-dials strong { font-size: 26px; font-variant-numeric: tabular-nums; }
.kit-dials span { margin-top: 4px; overflow-wrap: anywhere; color: var(--k-muted); font-size: 10px; }

.kit-section { padding: 78px 0; border-bottom: 1px solid var(--k-line); scroll-margin-top: 86px; }
.kit-section--last { border-bottom: 0; }
.kit-section__heading { margin-bottom: 34px; display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 14px; }
.kit-section__heading > span { padding-top: 8px; color: var(--k-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.kit-section__heading h2 { margin-bottom: 7px; font-size: clamp(30px, 4vw, 44px); font-weight: 800; line-height: 1; letter-spacing: -.045em; }
.kit-section__heading p { max-width: 650px; margin-bottom: 0; color: var(--k-muted); font-size: 15px; line-height: 1.55; }

.principle-grid { display: grid; grid-template-columns: 1.25fr .75fr; gap: 14px; }
.principle-card { min-height: 190px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; color: var(--k-ink); background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 20px; }
.principle-card--wide { grid-row: span 2; min-height: 394px; background: var(--k-lime); border: 0; color: #17181c; }
.principle-card--sky { color: #17181c; background: var(--k-sky); border: 0; }
.principle-card > ion-icon { font-size: 30px; }
.principle-card h3 { margin-bottom: 7px; font-size: 21px; }
.principle-card p { max-width: 34ch; margin-bottom: 0; color: inherit; font-size: 14px; line-height: 1.55; opacity: .76; }

.color-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.color-swatch { overflow: hidden; background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 20px; }
.color-swatch__sample { aspect-ratio: 1.45; padding: 16px; display: flex; align-items: flex-end; font-size: 22px; font-weight: 800; }
.color-swatch__meta { padding: 14px; display: grid; grid-template-columns: 1fr auto; gap: 4px 8px; }
.color-swatch__meta strong { font-size: 14px; }
.color-swatch__meta code { color: var(--k-muted); font-size: 11px; }
.color-swatch__meta small { grid-column: 1 / -1; color: var(--k-muted); font-size: 11px; }
.color-rule { margin-top: 14px; padding: 16px 18px; display: flex; align-items: flex-start; gap: 11px; background: var(--k-surface-soft); border-radius: 16px; }
.color-rule ion-icon { margin-top: 2px; flex: none; font-size: 20px; }
.color-rule p { margin: 0; color: var(--k-muted); font-size: 13px; line-height: 1.55; }
.color-rule strong { color: var(--k-ink); }

.type-specimen { overflow: hidden; background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 28px; }
.type-specimen__hero { min-height: 350px; padding: 34px; display: flex; flex-direction: column; justify-content: space-between; color: #17181c; background: var(--k-lilac); }
.type-specimen__hero > span { font-size: 13px; font-weight: 700; }
.type-specimen__hero strong { font-size: clamp(38px, 6vw, 66px); font-weight: 800; line-height: .98; letter-spacing: -.06em; }
.type-specimen__hero p { margin: 0; font-size: 17px; letter-spacing: .02em; }
.type-scale { padding: 10px 28px 22px; }
.type-scale > div { padding: 19px 0; display: grid; grid-template-columns: 120px minmax(0, 1fr); align-items: baseline; gap: 18px; border-bottom: 1px solid var(--k-line); }
.type-scale > div:last-child { border-bottom: 0; }
.type-scale code { color: var(--k-muted); font-size: 11px; }
.type-display { font-size: 40px; font-weight: 800; line-height: 1.1; letter-spacing: -.045em; }
.type-h1 { font-size: 32px; font-weight: 800; line-height: 1.18; letter-spacing: -.035em; }
.type-h2 { font-size: 24px; font-weight: 700; line-height: 1.25; }
.type-body { font-size: 16px; font-weight: 500; line-height: 1.5; }
.type-caption { color: var(--k-muted); font-size: 12px; font-weight: 600; line-height: 1.33; }

.shape-layout { display: grid; grid-template-columns: 1.3fr .7fr; gap: 14px; }
.radius-demo { min-height: 320px; padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 28px; }
.radius-demo__item { padding: 16px; display: flex; flex-direction: column; justify-content: space-between; color: #17181c; background: var(--k-lilac); }
.radius-demo__item--control { border-radius: 12px; }
.radius-demo__item--card { border-radius: 20px; }
.radius-demo__item--feature { border-radius: 28px; }
.radius-demo__item--pill { border-radius: 999px; }
.radius-demo__item span { font-size: 26px; font-weight: 800; }
.radius-demo__item small { font-size: 11px; font-weight: 700; }
.spacing-demo { padding: 24px; display: grid; align-content: center; gap: 17px; background: var(--k-surface-soft); border-radius: 20px; }
.spacing-demo__row { display: grid; grid-template-columns: 46px 1fr; align-items: center; gap: 12px; }
.spacing-demo__row code { color: var(--k-muted); font-size: 10px; }
.spacing-demo__row span { height: 8px; max-width: 100%; background: var(--k-sky); border-radius: 999px; }

.component-stage { padding: 28px; background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 28px; }
.component-stage--controls { display: grid; grid-template-columns: minmax(0, 430px) 1fr; gap: 54px; }
.button-column { display: grid; gap: 10px; }
.pw-button { min-height: 52px; padding: 0 20px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; border-radius: 999px; font-weight: 750; cursor: pointer; }
.pw-button:active { transform: translateY(1px) scale(.995); }
.pw-button--primary { color: #17181c; background: var(--k-lime); border: 1px solid var(--k-lime); }
.pw-button--secondary { color: var(--k-ink); background: transparent; border: 1px solid var(--k-line); }
.pw-button--danger { color: var(--k-danger); background: transparent; border: 1px solid color-mix(in srgb, var(--k-danger) 36%, transparent); }
.pw-button:disabled { cursor: not-allowed; filter: saturate(.35); opacity: .48; }
.icon-button-column { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 10px; }
.pw-icon-button { width: 48px; height: 48px; display: grid; place-items: center; color: var(--k-ink); background: var(--k-surface-soft); border: 1px solid transparent; border-radius: 50%; font-size: 22px; cursor: pointer; }
.pw-icon-button--filled { color: #17181c; background: var(--k-lime); }
.pw-icon-button:disabled { opacity: .42; }

.form-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-specimen, .status-stack { padding: 26px; background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 28px; }
.pw-field { margin-bottom: 22px; }
.pw-field label, .pw-options legend { margin-bottom: 8px; display: block; color: var(--k-ink); font-size: 13px; font-weight: 750; }
.pw-field input { width: 100%; min-height: 52px; padding: 0 14px; color: var(--k-ink); background: var(--k-bg); border: 1px solid var(--k-line); border-radius: 12px; outline: 0; }
.pw-field small { margin-top: 7px; display: block; color: var(--k-muted); font-size: 11px; line-height: 1.45; }
.pw-field--error input { border-color: var(--k-danger); }
.pw-field--error small { color: var(--k-danger); }
.pw-options { margin: 0; padding: 0; border: 0; }
.pw-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pw-options legend { grid-column: 1 / -1; }
.pw-options label { margin: 0; cursor: pointer; }
.pw-options input { position: absolute; opacity: 0; }
.pw-options span { min-height: 48px; display: grid; place-items: center; color: var(--k-muted); background: var(--k-bg); border: 1px solid var(--k-line); border-radius: 12px; font-size: 13px; font-weight: 700; }
.pw-options input:checked + span { color: #17181c; background: var(--k-lime); border-color: #17181c; }
.pw-options input:focus-visible + span { outline: 3px solid var(--k-sky); outline-offset: 3px; }
.status-stack { display: grid; align-content: center; gap: 10px; }
.pw-status { padding: 14px; display: flex; align-items: flex-start; gap: 11px; border-radius: 16px; }
.pw-status > ion-icon { margin-top: 2px; flex: none; font-size: 22px; }
.pw-status span, .pw-status strong, .pw-status small { display: block; }
.pw-status strong { margin-bottom: 2px; font-size: 13px; }
.pw-status small { font-size: 11px; line-height: 1.4; opacity: .78; }
.pw-status--success { color: var(--k-success); background: color-mix(in srgb, var(--k-success) 12%, var(--k-surface)); }
.pw-status--warning { color: var(--k-warning); background: color-mix(in srgb, var(--k-warning) 12%, var(--k-surface)); }
.pw-status--danger { color: var(--k-danger); background: color-mix(in srgb, var(--k-danger) 12%, var(--k-surface)); }

.card-showcase { display: grid; grid-template-columns: 1.2fr .8fr; gap: 12px; }
.event-card { position: relative; min-height: 270px; padding: 24px; overflow: hidden; color: #17181c; background: var(--k-coral); border-radius: 28px; }
.event-card::after { content: ""; position: absolute; right: -50px; bottom: -72px; width: 180px; height: 180px; background: rgb(255 255 255 / .16); border-radius: 50%; }
.event-card__icon { position: absolute; top: 22px; right: 22px; width: 52px; height: 52px; display: grid; place-items: center; background: rgb(255 255 255 / .5); border-radius: 18px; font-size: 28px; transform: rotate(-7deg); }
.event-card > p { margin-bottom: 28px; font-size: 12px; font-weight: 750; }
.event-card h3 { max-width: 15ch; margin-bottom: 6px; font-size: 24px; line-height: 1.1; }
.event-card time { font-size: 15px; }
.event-card__meta { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 10px 18px; font-size: 12px; }
.event-card__meta span { display: flex; align-items: center; gap: 5px; }
.event-card > button { position: absolute; z-index: 1; right: 20px; bottom: 20px; width: 44px; height: 44px; display: grid; place-items: center; color: #17181c; background: #fff; border: 0; border-radius: 50%; font-size: 20px; cursor: pointer; }
.medicine-example { min-height: 270px; padding: 22px; display: flex; flex-direction: column; color: var(--k-ink); background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 28px; }
.medicine-example > div { display: flex; align-items: center; justify-content: space-between; }
.medicine-example__icon { width: 46px; height: 46px; display: grid; place-items: center; color: #5a39a4; background: var(--k-lilac); border-radius: 16px; font-size: 23px; }
.medicine-example time { color: var(--k-muted); font-size: 13px; font-weight: 700; }
.medicine-example > p { margin: auto 0 3px; color: var(--k-muted); font-size: 12px; font-weight: 700; }
.medicine-example h3 { margin-bottom: 3px; font-size: 21px; }
.medicine-example > span { color: var(--k-muted); font-size: 13px; }
.pw-check { margin: 18px 0 0; display: flex; align-items: center; gap: 8px; color: var(--k-muted); font-size: 12px; font-weight: 700; cursor: pointer; }
.pw-check input { position: absolute; opacity: 0; }
.pw-check > span { width: 28px; height: 28px; display: grid; place-items: center; border: 2px solid var(--k-muted); border-radius: 9px; }
.pw-check ion-icon { opacity: 0; }
.pw-check input:checked + span { color: #17181c; background: var(--k-lime); border-color: #17181c; }
.pw-check input:checked + span ion-icon { opacity: 1; }
.pw-check input:focus-visible + span { outline: 3px solid var(--k-sky); outline-offset: 3px; }
.timeline-example { grid-column: 1 / -1; min-height: 104px; padding: 16px; display: flex; align-items: center; gap: 14px; color: var(--k-ink); background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 20px; }
.timeline-example__icon { width: 52px; height: 52px; flex: none; display: grid; place-items: center; color: #486100; background: var(--k-lime); border-radius: 16px; font-size: 24px; }
.timeline-example h3 { margin-bottom: 3px; font-size: 16px; }
.timeline-example p { margin-bottom: 1px; color: var(--k-muted); font-size: 12px; }
.timeline-example small { color: var(--k-muted); font-size: 11px; }
.attachment { margin-left: auto; padding: 8px 11px; display: flex; align-items: center; gap: 5px; color: #493578; background: var(--k-lilac); border-radius: 999px; font-size: 11px; font-weight: 700; }

.state-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.state-card { min-height: 260px; padding: 22px; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 20px; }
.state-card > ion-icon { margin-bottom: auto; color: var(--k-muted); font-size: 34px; }
.state-card h3 { margin-bottom: 6px; font-size: 17px; }
.state-card p { margin-bottom: 16px; color: var(--k-muted); font-size: 12px; line-height: 1.5; }
.state-card button { min-height: 40px; padding: 0 15px; color: var(--k-ink); background: transparent; border: 1px solid var(--k-line); border-radius: 999px; font-size: 12px; font-weight: 700; cursor: pointer; }
.skeleton-card { width: 100%; margin-bottom: auto; display: grid; gap: 10px; }
.skeleton-card span { height: 16px; background: var(--k-surface-soft); border-radius: 8px; animation: kit-pulse 1.5s ease-in-out infinite; }
.skeleton-card span:first-child { height: 92px; border-radius: 16px; }
.skeleton-card span:nth-child(2) { width: 72%; }
.skeleton-card span:nth-child(3) { width: 48%; }

.nav-stage { min-height: 270px; padding: 30px; display: grid; place-items: end center; background: var(--k-sky); border-radius: 28px; }
.nav-example { width: min(100%, 620px); min-height: 76px; padding: 7px 9px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; background: color-mix(in srgb, var(--k-surface) 94%, transparent); border: 1px solid color-mix(in srgb, var(--k-line) 70%, transparent); border-radius: 26px; box-shadow: 0 16px 45px rgb(27 67 90 / .18); backdrop-filter: blur(16px); }
.nav-example button { min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--k-muted); background: transparent; border: 0; border-radius: 19px; font-size: 11px; cursor: pointer; }
.nav-example button ion-icon { font-size: 22px; }
.nav-example button.is-active { color: #17181c; background: var(--k-lime); font-weight: 800; }

@keyframes kit-pulse { 50% { opacity: .48; } }

@media (max-width: 900px) {
  .kit-layout { grid-template-columns: 1fr; gap: 0; }
  .kit-index { position: static; padding-top: 28px; overflow-x: auto; }
  .kit-index { scrollbar-width: none; }
  .kit-index::-webkit-scrollbar { display: none; }
  .kit-index__brand { display: none; }
  .kit-index nav { display: flex; width: max-content; }
  .kit-index a { white-space: nowrap; }
  .kit-intro { min-height: 420px; padding-top: 54px; }
  .color-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 680px) {
  .kit-header__inner, .kit-layout { width: min(100% - 28px, 1180px); }
  .kit-version { display: none; }
  .kit-intro { min-height: auto; padding: 44px 0; grid-template-columns: 1fr; align-items: start; gap: 36px; }
  .kit-intro h1 { font-size: clamp(40px, 11vw, 48px); }
  .kit-lead { font-size: 16px; }
  .kit-section { padding: 58px 0; }
  .kit-section__heading { grid-template-columns: 34px 1fr; margin-bottom: 26px; }
  .principle-grid, .shape-layout, .component-stage--controls, .form-layout, .card-showcase { grid-template-columns: 1fr; }
  .principle-card--wide { grid-row: auto; min-height: 250px; }
  .color-grid { grid-template-columns: 1fr 1fr; }
  .type-specimen__hero { min-height: 300px; padding: 24px; }
  .type-scale { padding: 8px 20px 18px; }
  .type-scale > div { grid-template-columns: 1fr; gap: 8px; }
  .type-display { font-size: 32px; }
  .radius-demo { min-height: 280px; padding: 14px; }
  .component-stage { padding: 18px; }
  .component-stage--controls { gap: 28px; }
  .timeline-example { grid-column: auto; }
  .state-grid { grid-template-columns: 1fr; }
  .state-card { min-height: 220px; }
  .nav-stage { min-height: 230px; padding: 18px 10px; }
  .nav-example { min-height: 72px; }
  .nav-example button { font-size: 10px; }
}

@media (max-width: 390px) {
  .color-grid { grid-template-columns: 1fr; }
  .kit-dials span { font-size: 9px; }
  .attachment { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .kit-page { transition: none; }
  .skeleton-card span { animation: none; }
}
</style>
