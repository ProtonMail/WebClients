import { join } from 'path';
import { sync } from 'execa';

import type { AppConfig, ProtonPackOptions, WebpackOptions } from './interface';

const getGitBranch = () => {
    try {
        const { stdout = '' } = sync('git describe --all', { shell: true });
        return stdout.trim();
    } catch (e) {
        return '';
    }
};

const getGitCommitHash = () => {
    try {
        const { stdout = '' } = sync('git rev-parse HEAD', { shell: true });
        return stdout.trim();
    } catch (e) {
        return '';
    }
};

const getGitTagVersion = (applicationName: string) => {
    try {
        const { stdout = '' } = sync(`git tag --sort=-v:refname | grep ${applicationName} | head -n 1`, {
            shell: true,
        });
        return stdout.trim();
    } catch (e) {
        return '';
    }
};

/**
 * Clean ex. proton-mail@4.x.x to 4.x.x
 */
const getVersionNumberFromTag = (tag: string) => {
    return tag.replace(/[^@]*@/g, '');
};


const LOCALES = (() => {
    try {
        return require(join(process.cwd(), 'locales', 'config', 'locales.json'));
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[pack][config] No locales found');
        return {};
    }
})();

/**
 * This is sent from protonPack in `getWebpackArgs` as `--env protonPackOptions`
 */
export interface WebpackEnvArguments {
    protonPackOptions: string;
}

export interface ExtraWebpackOptions {
    appConfig: AppConfig;
}

export const getWebpackOptions = (envArguments: WebpackEnvArguments, extra: ExtraWebpackOptions): WebpackOptions => {
    const { CI_COMMIT_TAG, NODE_ENV } = process.env;
    const { appConfig } = extra;

    const isProduction = NODE_ENV === 'production';
    const isRelease = !!CI_COMMIT_TAG;

    const pkg = require(join(process.cwd(), 'package.json'));
    const appName = pkg.name as WebpackOptions['defineWebpackConfig']['APP_NAME'];

    if (!appName) {
        throw new Error('[pack][config] Missing app name');
    }

    const protonPackOptions: Partial<ProtonPackOptions> = JSON.parse(envArguments.protonPackOptions);

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

    // No logical SCSS is opt-out, to make code easier in config the option is reversed
    const logicalScss = !protonPackOptions.noLogicalScss;

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
        LOGICAL_SCSS: logicalScss,
        SENTRY_DESKTOP_DSN: appData.sentryDesktopDsn ?? '',
        SENTRY_DSN: appData.sentryDsn,
        SSO_URL: appData.sso,
        VERSION_PATH: `${appData.publicPath}assets/version.json`,
    };


    const prependAsyncCss = protonPackOptions.prependAsyncCss ?? false;

    return {
        analyze: protonPackOptions.analyze ?? false,
        api: appData.api,
        appData,
        appMode: protonPackOptions.appMode ?? 'standalone',
        browserslist: protonPackOptions.browserslist ?? defaultBrowsersList,
        buildData,
        defineWebpackConfig,
        babelLoader: protonPackOptions.babelLoader ?? false,
        errorLogs: protonPackOptions.errorLogs ?? false,
        featureFlags: protonPackOptions.featureFlags ?? '',
        handleSupportAndErrors: protonPackOptions.handleSupportAndErrors ?? false,
        inlineIcons: protonPackOptions.inlineIcons === true,
        isProduction,
        isRelease,
        noLogicalScss: !logicalScss,
        optimizeAssets: protonPackOptions.optimizeAssets ?? false,
        overlayErrors: protonPackOptions.overlayErrors ?? false,
        overlayRuntimeErrors: protonPackOptions.overlayRuntimeErrors ?? false,
        overlayWarnings: protonPackOptions.overlayWarnings ?? false,
        publicPath: appData.publicPath,
        warningLogs: protonPackOptions.warningLogs ?? false,
        writeSRI: protonPackOptions.sri !== false,
        benchmarkBuild: protonPackOptions.benchmarkBuild ?? false,
        prependAsyncCss,
        ignoreCssOrderWarning: prependAsyncCss // Default to same value as `prependAsyncCss`
    };
};
