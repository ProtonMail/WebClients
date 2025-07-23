import { type PassConfig } from '@proton/pass/hooks/usePassConfig';
import { APPS } from '@proton/shared/lib/constants';
import { getAppUrlFromApiUrl } from '@proton/shared/lib/helpers/url';

import config from '../app/config';

export const PASS_CONFIG = { ...config, APP_NAME: 'proton-pass' } as PassConfig;

export const ARCH = (() => {
    if (typeof process === 'undefined') return '';
    return process.platform === 'darwin' ? 'universal' : process.arch;
})();

/* Overrides default sentry host which doesn't support file:// URLs */
export const SENTRY_HOST = ((): string => {
    if (typeof window !== 'undefined' && window.location.host.startsWith('localhost')) return window.location.host;
    return getAppUrlFromApiUrl(PASS_CONFIG.API_URL, APPS.PROTONPASS).host;
})();

export const SENTRY_CONFIG = {
    host: SENTRY_HOST,
    release: SENTRY_HOST.endsWith('.proton.me') ? PASS_CONFIG.APP_VERSION : PASS_CONFIG.COMMIT,
    environment: SENTRY_HOST.split('.').splice(1).join('.'),
};
