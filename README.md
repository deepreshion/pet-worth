# Pet Worth

Первый вертикальный срез мобильного приложения: вход по magic link, автоматическая личная семья, создание кошки или собаки, главная и карточка питомца. Клиент построен на Ionic Vue и Capacitor, данные и приватные фотографии хранятся в Supabase.

## Локальный запуск

Требования: Node.js 22+, npm, Docker и Supabase CLI. Для iOS также нужны macOS и Xcode.

```bash
npm install
cp .env.example .env
npm run supabase:start
```

После запуска Supabase скопируйте локальные `API URL` и `anon key` в `.env`, затем:

```bash
npm run dev
```

Письма magic link в локальной среде доступны в Inbucket по адресу `http://127.0.0.1:54324`.

### Быстрый просмотр без Supabase

В режиме `npm run dev` на экране входа появляется кнопка «Посмотреть интерфейс без входа». Она включает локальный деморежим с профилем Сени. Можно открыть главную и карточку питомца, создать новый профиль и проверить загрузку фотографии. Данные деморежима сохраняются только в `localStorage` браузера и удаляются при выходе. В production-сборке кнопка недоступна.

## Проверки

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run supabase:reset
npm run supabase:test
```

## iOS

Нативный проект находится в `ios/`. После изменения Web-кода выполните:

```bash
npm run build
npm run cap:sync
open ios/App/App.xcodeproj
```

В Xcode выберите Development Team только для запуска на физическом устройстве. URL scheme `petworth` уже настроен для callback `petworth://auth/callback`.

## Подключение staging

1. Создайте отдельный проект Supabase.
2. Привяжите CLI и примените миграции: `supabase link --project-ref <ref>` и `supabase db push`.
3. Добавьте в Auth URL Configuration адрес Web-приложения с `/auth/callback` и `petworth://auth/callback`.
4. Заполните `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`; `service_role` клиенту не требуется и не должен попадать в `.env`.
5. При необходимости добавьте `VITE_SENTRY_DSN`. Sentry настроен без отправки PII и содержимого форм.

Никакие демонстрационные медицинские записи не создаются. Staging предназначен только для тестовых, не реальных медицинских данных.
