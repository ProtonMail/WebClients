const path = require('path');
const dedent = require('dedent');
const argv = require('minimist')(process.argv.slice(2));

const { warn } = require('./log');

const isHelp = argv._.includes('help');

const readJSON = (file) => {
    const fileName = `${file}.json`;

    if (file === 'env' && !isHelp) {
        warn('[DEPREACTION NOTICE] Please rename your file env.json to appConfig.json');
    }

    try {
        return require(path.join(process.cwd(), fileName));
    } catch (e) {
        !isHelp && warn(`Missing file ${fileName}`);
    }
};

/**
 * Extract the config of a project
 * - env: from env.json for sentry, and some custom config for the app
 *     appConfig: {
 *         name: 'Web',
 *         etc.
 *     }
 * - pkg: from package.json for sentry
 * @return {Object}   { env: Object, pkg: Object }
 */
const CONFIG_ENV = (() => {
    const pkg = require(path.join(process.cwd(), 'package.json'));
    const I18N_EXTRACT_DIR = 'po';
    // @todo load value from the env as it's done for proton-i19n
    return {
        lang: readJSON(path.join(I18N_EXTRACT_DIR, 'lang')) || [],
        env: readJSON('appConfig') || readJSON('env') || {},
        pkg
    };
})();

const ENV_CONFIG = Object.keys(CONFIG_ENV.env).reduce(
    (acc, key) => {
        if (key === 'appConfig') {
            acc.app = CONFIG_ENV.env[key];
            return acc;
        }
        const { api, ...sentry } = CONFIG_ENV.env[key];
        acc.sentry[key] = sentry;
        api && (acc.api[key] = api);
        return acc;
    },
    { sentry: {}, api: {}, pkg: CONFIG_ENV.pkg, app: {} }
);

const API_TARGETS = {
    prod: 'https://mail.protonmail.com/api',
    local: 'https://protonmail.dev/api',
    localhost: 'https://localhost/api',
    build: '/api',
    ...ENV_CONFIG.api
};

function main({ api = 'dev' }) {
    const apiUrl = API_TARGETS[api] || API_TARGETS.prod;
    const lang = CONFIG_ENV.lang.map(({ lang }) => lang);

    const config = dedent`
    export const CLIENT_ID = '${ENV_CONFIG.app.clientId || 'Web'}';
    export const CLIENT_TYPE = '${ENV_CONFIG.app.clientType || 1}'
    export const APP_VERSION = '${ENV_CONFIG.app.version || ENV_CONFIG.pkg.version || '3.16.20'}';
    export const API_URL = '${apiUrl}';
    export const API_VERSION = '3';
    export const DATE_VERSION = '${new Date().toGMTString()}';
    export const CHANGELOG_PATH = 'assets/changelog.tpl.html';
    export const VERSION_PATH = 'assets/version.json';
    export const TRANSLATIONS = ${JSON.stringify(lang)};
    export const TRANSLATIONS_URL = ${JSON.stringify(ENV_CONFIG.app.urlI18n || '')};
    `;

    return {
        config,
        apiUrl,
        path: path.join(process.cwd(), 'src', 'app', 'config.js')
    };
}

module.exports = main;
