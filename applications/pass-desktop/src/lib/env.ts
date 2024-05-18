import { type PassConfig } from '@proton/pass/hooks/usePassConfig';

import * as config from '../app/config';
import { getSentryHost } from './helpers';

export const PASS_CONFIG = { ...config, APP_NAME: 'proton-pass' } as PassConfig;

export const ARCH = (() => {
    if (typeof process === 'undefined') return '';
    return process.platform === 'darwin' ? 'universal' : process.arch;
})();

export const SENTRY_HOST = getSentryHost(PASS_CONFIG);

export const SENTRY_CONFIG = {
    host: SENTRY_HOST,
    release: SENTRY_HOST.endsWith('.proton.me') ? PASS_CONFIG.APP_VERSION : PASS_CONFIG.COMMIT,
    environment: SENTRY_HOST.split('.').splice(1).join('.'),
};
