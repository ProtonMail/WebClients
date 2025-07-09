import { join } from 'path';

import type { AppMode } from '@proton/shared/lib/webpack.constants';

// @ts-ignore TODO: these methods will be moved to this file at the end of the migration
import { getGitBranch, getGitCommitHash, getGitTagVersion, getVersionNumberFromTag } from './config';
import type { ProtonPackOptions, WebpackOptions } from './interface';

const LOCALES = (() => {
    try {
        return require(join(process.cwd(), 'locales', 'config', 'locales.json'));
    } catch (e) {
        console.warn('[pack][config] No locales found');
        return {};
    }
})();

export interface ConfigOptions {
    appConfig: {
        sentry?: string;
        sentryDesktop?: string;
        clientType?: number;
        clientSecret?: string;
    };
    appMode: AppMode;
    protonPackOptions: string;
}

export const getWebpackOptions = (opts: ConfigOptions): WebpackOptions => {
    const { CI_COMMIT_TAG, NODE_ENV } = process.env;
    const { appConfig } = opts;

    const isProduction = NODE_ENV === 'production';
    const isRelease = !!CI_COMMIT_TAG;

    const pkg = require(join(process.cwd(), 'package.json'));
    const appName = pkg.name as WebpackOptions['defineWebpackConfig']['APP_NAME'];

    if (!appName) {
        throw new Error('[pack][config] Missing app name');
    }

    const protonPackOptions: Partial<ProtonPackOptions> = JSON.parse(opts.protonPackOptions);

    const appData: WebpackOptions['appData'] = {
        api: protonPackOptions.api || `https://${appName.replaceAll(/proton-|-settings/g, '')}.proton.black`,
        apiProxy: protonPackOptions.apiProxy || false,
        appName,
        locales: LOCALES,
        publicPath: protonPackOptions.publicPath || '/',
        sentryDesktopDsn: (isProduction && appConfig.sentryDesktop) || '',
        sentryDsn: (isProduction && appConfig.sentry) || '',
        sso: protonPackOptions.sso || '',
        version:
            protonPackOptions.version ||
            getVersionNumberFromTag(process.env.CI_COMMIT_TAG || getGitTagVersion(appName)) ||
            '5.0.999.999',
    };

    const buildData: WebpackOptions['buildData'] = {
        branch: process.env.CI_COMMIT_REF_NAME || getGitBranch(),
        commit: process.env.CI_COMMIT_SHA || getGitCommitHash(),
        date: new Date().toUTCString(),
        version: appData.version,
    };

    const defaultBrowsersList = isProduction
        ? `> 0.5%, not IE 11, Firefox ESR, Safari 14, iOS 14, Chrome 80`
        : 'last 1 chrome version, last 1 firefox version, last 1 safari version';

    const defineWebpackConfig: WebpackOptions['defineWebpackConfig'] = {
        API_URL: !appData.apiProxy && appData.api ? appData.api : '/api',
        APP_NAME: appData.appName,
        APP_VERSION: buildData.version,
        BRANCH: buildData.branch,
        CLIENT_SECRET: appConfig.clientSecret || '',
        CLIENT_TYPE: appConfig.clientType || 1,
        COMMIT: buildData.commit,
        DATE_VERSION: buildData.date,
        LOCALES: LOCALES,
        SENTRY_DESKTOP_DSN: appData.sentryDesktopDsn ?? '',
        SENTRY_DSN: appData.sentryDsn,
        SSO_URL: appData.sso,
        VERSION_PATH: `${appData.publicPath}assets/version.json`,
    };

    return {
        analyze: protonPackOptions.analyze ?? false,
        api: appData.api,
        appData,
        appMode: protonPackOptions.appMode ?? 'standalone',
        browserslist: protonPackOptions.browserslist ?? defaultBrowsersList,
        buildData,
        defineWebpackConfig,
        errorLogs: protonPackOptions.errorLogs ?? false,
        featureFlags: protonPackOptions.featureFlags ?? '',
        handleSupportAndErrors: protonPackOptions.handleSupportAndErrors ?? false,
        inlineIcons: protonPackOptions.inlineIcons === true,
        isProduction,
        isRelease,
        logical: protonPackOptions.logical ?? false,
        optimizeAssets: protonPackOptions.optimizeAssets ?? false,
        overlayErrors: protonPackOptions.overlayErrors ?? false,
        overlayRuntimeErrors: protonPackOptions.overlayRuntimeErrors ?? false,
        overlayWarnings: protonPackOptions.overlayWarnings ?? false,
        publicPath: appData.publicPath,
        warningLogs: protonPackOptions.warningLogs ?? false,
        webpackOnCaffeine: protonPackOptions.webpackOnCaffeine ?? false,
        writeSRI: protonPackOptions.sri !== false,
    };
};
