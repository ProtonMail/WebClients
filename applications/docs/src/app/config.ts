import type { APP_NAMES } from "@proton/shared/lib/constants";

export interface ConfigData {
    CLIENT_TYPE: number;
    CLIENT_SECRET: string;
    APP_VERSION: string;
    COMMIT: string;
    BRANCH: string;
    DATE_VERSION: string;
    APP_NAME: APP_NAMES;
    API_URL: string;
    SSO_URL: string;
    LOCALES: { [key: string]: string };
    VERSION_PATH: string;
    SENTRY_DSN: string;
    SENTRY_DESKTOP_DSN: string;
}

let configData: ConfigData;

export const getConfigData = (): ConfigData => {
    if(configData) {
        return configData
    }
    const scriptTag = document.getElementById('configData');
    if (scriptTag) {
        return JSON.parse(scriptTag.textContent || '{}')
    }
    return {} as ConfigData;
};

const get = <K extends keyof ConfigData>(key: K): ConfigData[K] => {
    if (!configData) {
        configData = getConfigData();
    }
    return configData[key];
};

// Default values are for unit test usage only
export const CLIENT_TYPE: number = get('CLIENT_TYPE') || 1;
export const CLIENT_SECRET: string = get('CLIENT_SECRET') || "";
export const APP_VERSION: string = get('APP_VERSION') || '5.0.0+abcdefg';
export const COMMIT: string = get('COMMIT') || "ca5ba1f4062ebb502edeffd4e7dd1095560e6622";
export const BRANCH: string = get('BRANCH');
export const DATE_VERSION: string = get('DATE_VERSION');
export const APP_NAME: APP_NAMES = get('APP_NAME') || "proton-docs";
export const API_URL: string = get('API_URL');
export const SSO_URL: string = get('SSO_URL');
export const LOCALES: { [key: string]: string } = get('LOCALES');
export const VERSION_PATH: string = get('VERSION_PATH');
export const SENTRY_DSN: string = get('SENTRY_DSN');
export const SENTRY_DESKTOP_DSN: string = get('SENTRY_DESKTOP_DSN');
