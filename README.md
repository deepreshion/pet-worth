# Pet Worth

Два готовых вертикальных среза мобильного приложения: вход по magic link и профили питомцев, а также медицинская история с фото/PDF, общим календарём и локальными напоминаниями за 24 часа. Клиент построен на Ionic Vue и Capacitor, данные и приватные файлы хранятся в Supabase.

## Локальный запуск

Требования: Node.js 22+, npm, Docker и Supabase CLI. Для iOS также нужны macOS и Xcode.

```bash
npm install
cp .env.example .env
npm run supabase:start
```

После запуска Supabase скопируйте локальные `API URL` и `Supabase publishable key` в `.env` как `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`, затем:

```bash
npm run dev
```

Письма magic link в локальной среде доступны в Inbucket по адресу `http://127.0.0.1:54324`.

### Быстрый просмотр без Supabase

В режиме `npm run dev` на экране входа появляется кнопка «Посмотреть интерфейс без входа». Она включает локальный деморежим с профилем Сени. Можно создавать питомцев и медицинские события, добавлять вложения, проверять историю и календарь. Данные деморежима сохраняются только в `localStorage` браузера и удаляются при выходе. В production-сборке кнопка недоступна; системные уведомления в Web не планируются.

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

В Xcode выберите Development Team только для запуска на физическом устройстве. URL scheme `petworth` уже настроен для callback `petworth://auth/callback`. Разрешение на локальные уведомления приложение запрашивает только при включении напоминания.

## Подключение staging

1. Создайте отдельный проект Supabase.
2. Привяжите CLI и примените миграции: `supabase link --project-ref <ref>` и `supabase db push`.
3. Добавьте в Auth URL Configuration адрес Web-приложения с `/auth/callback` и `petworth://auth/callback`.
4. Скопируйте из настроек проекта `Project URL` и `Supabase publishable key`, затем задайте их как `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY` в переменных окружения клиентской сборки.
5. При необходимости добавьте `VITE_SENTRY_DSN`. Sentry настроен без отправки PII и содержимого форм.

Supabase publishable key разрешено включать в клиентскую Web- или мобильную сборку. Он не является секретом: безопасность и разграничение доступа к данным должны обеспечиваться корректными политиками Row Level Security (RLS).

Supabase secret key и legacy `service_role` дают повышенные права. Их нельзя помещать в `.env` клиентского приложения, исходный код, CI-переменные клиентской сборки или мобильный bundle.

Никакие демонстрационные медицинские записи не создаются. Staging предназначен только для тестовых, не реальных медицинских данных.
