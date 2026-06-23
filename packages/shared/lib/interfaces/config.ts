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
    LOGICAL_SCSS: boolean;
    SENTRY_DESKTOP_DSN?: string;
    SENTRY_DSN: string;
    SSO_URL: string;
    VERSION_PATH: string;
}

export const getProtonConfig = (defaults: Partial<ProtonConfig> = {}): ProtonConfig => ({
    API_URL: process.env.API_URL ?? defaults.API_URL ?? '',
    APP_NAME: (process.env.APP_NAME as unknown as APP_NAMES) ?? defaults.APP_NAME ?? '',
    APP_VERSION: process.env.APP_VERSION ?? defaults.APP_VERSION ?? '',
    BRANCH: process.env.BRANCH ?? defaults.BRANCH ?? '',
    CLIENT_SECRET: process.env.CLIENT_SECRET ?? defaults.CLIENT_SECRET ?? '',
    CLIENT_TYPE: (process.env.CLIENT_TYPE as unknown as CLIENT_TYPES) ?? defaults.CLIENT_TYPE ?? CLIENT_TYPES.MAIL,
    COMMIT: process.env.COMMIT ?? defaults.COMMIT ?? '',
    DATE_VERSION: process.env.DATE_VERSION ?? defaults.DATE_VERSION ?? '',
    LOCALES: (process.env.LOCALES as unknown as {}) ?? defaults.LOCALES ?? {},
    LOGICAL_SCSS: (process.env.LOGICAL_SCSS as unknown as boolean) ?? defaults.LOGICAL_SCSS ?? true,
    SENTRY_DESKTOP_DSN: process.env.SENTRY_DESKTOP_DSN ?? defaults.SENTRY_DESKTOP_DSN ?? '',
    SENTRY_DSN: process.env.SENTRY_DSN ?? defaults.SENTRY_DSN ?? '',
    SSO_URL: process.env.SSO_URL ?? defaults.SSO_URL ?? '',
    VERSION_PATH: process.env.VERSION_PATH ?? defaults.VERSION_PATH ?? '',
});
