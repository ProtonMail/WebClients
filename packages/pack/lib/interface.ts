import type { ProtonConfig } from '@proton/shared/lib/interfaces';

export interface ProtonPackOptions {
    version: string;
    api: string;
    apiProxy: boolean;
    sso: string;
    publicPath: string;
    appMode: string;
    webpackOnCaffeine: boolean;
    featureFlags: string;
    sri: boolean;
    inlineIcons: boolean;
    browserslist: string;
    warningLogs: boolean;
    errorLogs: boolean;
    overlayWarnings: boolean;
    overlayErrors: boolean;
    overlayRuntimeErrors: boolean;
    logical: boolean;
    analyze: boolean;
    optimizeAssets: boolean;
    handleSupportAndErrors: boolean;
}

interface Locales {
    [key: string]: string;
}

export interface AppData {
    appName: ProtonConfig['APP_NAME'];
    version: string;
    locales: Locales;
    api: string;
    sso: string;
    apiProxy: boolean;
    sentryDsn: string;
    sentryDesktopDsn: string;
    publicPath: string;
}

export interface BuildData {
    version: string;
    commit: string;
    branch: string;
    date: string;
}

export interface WebpackOptions {
    isProduction: boolean;
    isRelease: boolean;
    publicPath: string;
    api: string;
    appMode: string;
    webpackOnCaffeine: boolean;
    featureFlags: string;
    writeSRI: boolean;
    inlineIcons: boolean;
    browserslist: string;
    warningLogs: boolean;
    errorLogs: boolean;
    overlayWarnings: boolean;
    overlayErrors: boolean;
    overlayRuntimeErrors: boolean;
    logical: boolean;
    analyze: boolean;
    optimizeAssets: boolean;
    handleSupportAndErrors: boolean;
    appData: AppData;
    buildData: BuildData;
    defineWebpackConfig: ProtonConfig;
}
