import APP_CONFIG from 'proton-authenticator/app/config';

export const config = APP_CONFIG;

const SENTRY_HOST = new URL(config.API_URL).host;

export const arch = (() => {
    if (typeof process === 'undefined') return '';
    return process.platform === 'darwin' ? 'universal' : process.arch;
})();

export const sentryConfig = {
    host: new URL(config.API_URL).host,
    release: SENTRY_HOST.endsWith('.proton.me') ? APP_CONFIG.APP_VERSION : APP_CONFIG.COMMIT,
    environment: SENTRY_HOST.split('.').splice(1).join('.'),
};
