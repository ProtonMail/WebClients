const path = require('path');
const dedent = require('dedent');
const execa = require('execa');

const readJSON = (file) => {
    const fileName = `${file}.json`;
    try {
        return require(path.join(process.cwd(), fileName));
    } catch {
        return undefined;
    }
};

const getGitBranch = () => {
    try {
        const { stdout = '' } = execa.sync('git describe --all', { shell: true });
        return stdout.trim();
    } catch (e) {
        return '';
    }
};

const getGitCommitHash = () => {
    try {
        const { stdout = '' } = execa.sync('git rev-parse HEAD', { shell: true });
        return stdout.trim();
    } catch (e) {
        return '';
    }
};

const getGitTagVersion = (applicationName) => {
    try {
        const { stdout = '' } = execa.sync(`git tag --sort=-v:refname | grep ${applicationName} | head -n 1`, {
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
const getVersionNumberFromTag = (tag) => {
    return tag.replace(/[^@]*@/g, '');
};

const APP_CONFIG_JSON = readJSON('appConfig') || {};

const LOCALES = (() => {
    try {
        return require(path.join(process.cwd(), 'locales', 'config', 'locales.json'));
    } catch (e) {
        return {};
    }
})();

const ENV_CONFIG = Object.keys(APP_CONFIG_JSON).reduce(
    (acc, key) => {
        if (key === 'appConfig') {
            acc.app = APP_CONFIG_JSON[key];
            return acc;
        }
        const { api, secure } = APP_CONFIG_JSON[key];
        if (api) {
            acc.api[key] = api;
        }
        if (secure) {
            acc.secure[key] = secure;
        }
        return acc;
    },
    { api: {}, secure: {}, app: {} }
);

const API_TARGETS = {
    prod: 'https://mail.proton.me',
    localhost: 'https://localhost',
    proxy: '/api',
    ...ENV_CONFIG.api,
};

const getApi = (value) => {
    // We can do --api=https://mail.proton.me/api and it's only for dev, so we can stop here
    if (value.startsWith('http') || value.startsWith('/api')) {
        return value;
    }
    return API_TARGETS[value] || API_TARGETS.prod;
};

const getConfigData = ({ api, sso, apiProxy, publicPath, version }) => {
    const pkg = require(path.join(process.cwd(), 'package.json'));
    const appName = pkg.name;
    if (!appName) {
        throw new Error('Missing app name');
    }

    const isProduction = process.env.NODE_ENV === 'production';

    const appData = {
        appName,
        version:
            version || getVersionNumberFromTag(process.env.CI_COMMIT_TAG || getGitTagVersion(appName)) || '5.0.999.999',
        locales: LOCALES,
        api,
        sso,
        apiProxy,
        sentryDsn: isProduction ? ENV_CONFIG.app.sentry || '' : '',
        sentryDesktopDsn: isProduction ? ENV_CONFIG.app.sentryDesktop || '' : '',
        publicPath,
    };

    const buildData = {
        version: appData.version,
        commit: process.env.CI_COMMIT_SHA || getGitCommitHash(),
        branch: process.env.CI_COMMIT_REF_NAME || getGitBranch(),
        date: new Date().toGMTString(),
    };

    return {
        appData,
        buildData,
    };
};

const getConfigFile = ({ buildData, appData }) => {
    return dedent`
    export const CLIENT_TYPE = ${ENV_CONFIG.app.clientType || 1};
    export const CLIENT_SECRET = '${ENV_CONFIG.app.clientSecret || ''}';
    export const APP_VERSION = '${buildData.version}';
    export const COMMIT = '${buildData.commit}';
    export const BRANCH = '${buildData.branch}';
    export const DATE_VERSION = '${buildData.date}';
    export const APP_NAME = '${appData.appName}';
    export const API_URL =  '${(!appData.apiProxy && appData.api) || '/api'}';
    export const SSO_URL = '${appData.sso || ''}';
    export const LOCALES = ${JSON.stringify(LOCALES)};
    export const VERSION_PATH = '${appData.publicPath}assets/version.json';
    export const SENTRY_DSN = '${appData.sentryDsn}';
    export const SENTRY_DESKTOP_DSN = '${appData?.sentryDesktopDsn ?? ''}';
    `;
};

const getConfigHead = ({ buildData, appData }) => {
    return JSON.stringify({
        CLIENT_TYPE: ENV_CONFIG.app.clientType || 1,
        CLIENT_SECRET: ENV_CONFIG.app.clientSecret || '',
        APP_VERSION: buildData.version,
        COMMIT: buildData.commit,
        BRANCH: buildData.branch,
        DATE_VERSION: buildData.date,
        APP_NAME: appData.appName,
        API_URL: !appData.apiProxy && appData.api ? appData.api : '/api',
        SSO_URL: appData.sso || '',
        LOCALES: LOCALES,
        VERSION_PATH: `${appData.publicPath}assets/version.json`,
        SENTRY_DSN: appData.sentryDsn,
        SENTRY_DESKTOP_DSN: appData.sentryDesktopDsn ?? '',
    });
};

module.exports = {
    getApi,
    getConfigData,
    getConfigFile,
    getConfigHead,
    getGitBranch,
    getGitCommitHash,
    getGitTagVersion,
    getVersionNumberFromTag,
};
