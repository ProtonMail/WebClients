import { APPS } from '@proton/shared/lib/constants';
import sentry from '@proton/shared/lib/helpers/sentry';
import { getAppUrlFromApiUrl } from '@proton/shared/lib/helpers/url';

import { PASS_CONFIG } from './core';

// Keep localhost in dev mode, use a valid Sentry host in prod
const host = (() => {
    if (window.location.host.startsWith('localhost')) return window.location.host;
    return getAppUrlFromApiUrl(PASS_CONFIG.API_URL, APPS.PROTONPASS).host;
})();

// Overrides default sentry host which doesn't support file:// URLs
const sentryConfig = {
    host,
    release: host.endsWith('.proton.me') ? PASS_CONFIG.APP_VERSION : PASS_CONFIG.COMMIT,
    environment: host.split('.').splice(1).join('.'),
};

sentry({ config: PASS_CONFIG, sentryConfig });
