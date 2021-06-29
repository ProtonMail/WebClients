import { APP_NAMES, CLIENT_TYPES } from '../constants';

export interface ProtonConfig {
    CLIENT_TYPE: typeof CLIENT_TYPES[keyof typeof CLIENT_TYPES];
    CLIENT_SECRET: string;
    APP_VERSION: string;
    APP_VERSION_DISPLAY?: string;
    APP_NAME: APP_NAMES;
    API_URL: string;
    LOCALES: { [key: string]: string };
    API_VERSION: string;
    DATE_VERSION: string;
    COMMIT: string;
    BRANCH: string;
    SENTRY_DSN: string;
    VERSION_PATH: string;
}
