const path = require('path');
const dedent = require('dedent');
const argv = require('minimist')(process.argv.slice(2));

const { warn } = require('./log');

const isHelp = argv._.includes('help');

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
    try {
        return {
            env: require(path.join(process.cwd(), 'env.json')),
            pkg
        };
    } catch (e) {
        !isHelp && warn('⚠⚠⚠ No ./env.json found ⚠⚠⚠', '➙ Please check the wiki to create it');
        return { pkg, env: {} };
    }
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
    const config = dedent`
    export const CLIENT_ID = '${ENV_CONFIG.app.clientId || 'Web'}';
    export const CLIENT_TYPE = '${ENV_CONFIG.app.clientType || 1}'
    export const APP_VERSION = '${ENV_CONFIG.pkg.version || '3.16.20'}';
    export const API_URL = '${apiUrl}';
    export const API_VERSION = '3';
    export const DATE_VERSION = '${new Date().toGMTString()}';
    export const CHANGELOG_PATH = 'assets/changelog.tpl.html';
    export const VERSION_PATH = 'assets/version.json';
    `;

    return {
        config,
        apiUrl,
        path: path.join(process.cwd(), 'src', 'app', 'config.js')
    };
}

module.exports = main;
