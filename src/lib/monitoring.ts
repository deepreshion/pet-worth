import * as Sentry from "@sentry/react-native";
export function initializeMonitoring() {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      // Only keep technical frames and error kinds; native SDK payloads can contain URLs and user input.
      delete event.user;
      delete event.request;
      delete event.extra;
      delete event.contexts;
      delete event.breadcrumbs;
      delete event.message;
      for (const exception of event.exception?.values ?? []) {
        exception.value = "redacted";
        for (const frame of exception.stacktrace?.frames ?? []) {
          delete frame.vars;
          if (frame.filename) frame.filename = frame.filename.split(/[?#]/)[0];
        }
      }
      return event;
    },
    beforeBreadcrumb: () => null,
  });
}
export function captureTechnicalError(error: unknown, context: string) {
  Sentry.withScope((scope) => {
    scope.setTag("context", context);
    Sentry.captureException(error);
  });
}
export function trackProductEvent(_name: string) {
  /* No user content or product payloads in crash reports. */
}
