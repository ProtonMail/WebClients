import { type APP_NAMES, CLIENT_TYPES } from '../constants';

export interface ProtonConfig {
    API_URL: string;
    APP_NAME: APP_NAMES;
    APP_VERSION: string;
    BRANCH: string;
    CLIENT_SECRET: string;
    CLIENT_TYPE: CLIENT_TYPES;
    COMMIT: string;
    DATE_VERSION: string;
    LOCALES: { [key: string]: string };
    SENTRY_DESKTOP_DSN?: string;
    SENTRY_DSN: string;
    SSO_URL: string;
    VERSION_PATH: string;
}

export const getProtonConfig = (defaults: Partial<ProtonConfig> = {}): ProtonConfig => ({
    API_URL: defaults.API_URL ?? process.env.API_URL ?? '',
    APP_NAME: defaults.APP_NAME ?? (process.env.APP_NAME as unknown as APP_NAMES) ?? '',
    APP_VERSION: defaults.APP_VERSION ?? process.env.APP_VERSION ?? '',
    BRANCH: defaults.BRANCH ?? process.env.BRANCH ?? '',
    CLIENT_SECRET: defaults.CLIENT_SECRET ?? process.env.CLIENT_SECRET ?? '',
    CLIENT_TYPE: defaults.CLIENT_TYPE ?? (process.env.CLIENT_TYPE as unknown as CLIENT_TYPES) ?? CLIENT_TYPES.MAIL,
    COMMIT: defaults.COMMIT ?? process.env.COMMIT ?? '',
    DATE_VERSION: defaults.DATE_VERSION ?? process.env.DATE_VERSION ?? '',
    LOCALES: defaults.LOCALES ?? (process.env.LOCALES as unknown as {}) ?? {},
    SENTRY_DESKTOP_DSN: defaults.SENTRY_DESKTOP_DSN ?? process.env.SENTRY_DESKTOP_DSN ?? '',
    SENTRY_DSN: defaults.SENTRY_DSN ?? process.env.SENTRY_DSN ?? '',
    SSO_URL: defaults.SSO_URL ?? process.env.SSO_URL ?? '',
    VERSION_PATH: defaults.VERSION_PATH ?? process.env.VERSION_PATH ?? '',
});
