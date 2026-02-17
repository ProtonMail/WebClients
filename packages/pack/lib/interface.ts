import type { ProtonConfig } from '@proton/shared/lib/interfaces';

export interface ProtonPackOptions {
    version: string;
    api: string;
    apiProxy: boolean;
    sso: string;
    publicPath: string;
    appMode: string;
    featureFlags: string;
    sri: boolean;
    babelLoader: boolean;
    inlineIcons: boolean;
    browserslist: string;
    warningLogs: boolean;
    errorLogs: boolean;
    overlayWarnings: boolean;
    overlayErrors: boolean;
    overlayRuntimeErrors: boolean;
    noLogicalScss: boolean;
    analyze: boolean;
    optimizeAssets: boolean;
    handleSupportAndErrors: boolean;
    benchmarkBuild: boolean;
    prependAsyncCss: boolean;
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
    babelLoader: boolean;
    featureFlags: string;
    writeSRI: boolean;
    inlineIcons: boolean;
    browserslist: string;
    warningLogs: boolean;
    errorLogs: boolean;
    overlayWarnings: boolean;
    overlayErrors: boolean;
    overlayRuntimeErrors: boolean;
    noLogicalScss: boolean;
    analyze: boolean;
    optimizeAssets: boolean;
    handleSupportAndErrors: boolean;
    appData: AppData;
    buildData: BuildData;
    defineWebpackConfig: ProtonConfig;
    benchmarkBuild: boolean;
    /* prepend instead of append async css chunks so that the global css order can be respected (i.e. that the initial css file takes priority) */
    prependAsyncCss: boolean;
    ignoreCssOrderWarning: boolean;
}

export interface AppConfig {
    sentry?: string;
    sentryDesktop?: string;
    clientType?: number;
    clientSecret?: string;
}
