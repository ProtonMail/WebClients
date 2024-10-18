import * as Sentry from '@sentry/electron/renderer';

export function initializeTelemetry() {
    Sentry.init({
        integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    });
}
