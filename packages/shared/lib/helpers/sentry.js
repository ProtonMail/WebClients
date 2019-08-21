import * as Sentry from '@sentry/browser';

function main({ SENTRY_DSN, SENTRY_RELEASE, APP_VERSION }) {
    // No need to configure it if we don't load the DSN
    if (!SENTRY_DSN && document.URL.includes('localhost:')) {
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        release: SENTRY_RELEASE
    });

    Sentry.configureScope((scope) => {
        scope.setTag('appVersion', APP_VERSION);
    });
}

export const traceError = (e) => !document.URL.includes('localhost:') && Sentry.captureException(e);

export default main;
