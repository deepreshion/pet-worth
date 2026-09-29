import type { App } from 'vue'
import type { Router } from 'vue-router'
import * as Sentry from '@sentry/vue'

const allowedEvents = new Set(['sign_in_completed', 'pet_created', 'pet_profile_opened'])

function withoutQuery(value?: string) {
  if (!value) return value
  try {
    const url = new URL(value, window.location.origin)
    return `${url.origin}${url.pathname}`
  } catch {
    return value.split('?')[0].split('#')[0]
  }
}

export function initializeMonitoring(app: App, router: Router) {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    app,
    dsn,
    environment: import.meta.env.VITE_APP_ENV ?? 'local',
    integrations: [Sentry.browserTracingIntegration({ router })],
    beforeSend(event) {
      delete event.user
      if (event.request) {
        delete event.request.data
        delete event.request.cookies
        event.request.url = withoutQuery(event.request.url)
      }
      return event
    },
    beforeSendTransaction(event) {
      if (event.request) event.request.url = withoutQuery(event.request.url)
      return event
    },
    beforeBreadcrumb(breadcrumb) {
      delete breadcrumb.data
      return breadcrumb
    },
  })
}

export function captureTechnicalError(error: unknown, context: string) {
  Sentry.withScope((scope) => {
    scope.setTag('context', context)
    Sentry.captureException(error)
  })
}

export function trackProductEvent(name: 'sign_in_completed' | 'pet_created' | 'pet_profile_opened') {
  if (!allowedEvents.has(name)) return
  Sentry.addBreadcrumb({ category: 'product', message: name, level: 'info' })
}
