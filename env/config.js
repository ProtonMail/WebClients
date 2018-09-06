const extend = require('lodash/extend');
const { execSync } = require('child_process');
const argv = require('minimist')(process.argv.slice(2));
const CONFIG_DEFAULT = require('./configDefault');
const i18nLoader = require('../tasks/translationsLoader');

const {
    STATS_CONFIG,
    STATS_ID,
    NO_STAT_MACHINE,
    API_TARGETS,
    AUTOPREFIXER_CONFIG,
    SENTRY_CONFIG,
    TOR_URL
} = require('./config.constants');

const isWebClient = () => {
    try {
        const origin = execSync('git remote get-url origin');
        return !/ProtonMail\/A/.test((origin || '').toString());
    } catch (e) {
        return true;
    }
};

const hasEnv = () => Object.keys(SENTRY_CONFIG).length;
const isProdBranch = (branch = process.env.NODE_ENV_BRANCH) => /-prod/.test(branch);
const isTorBranch = (branch = process.env.NODE_ENV_BRANCH) => /-tor$/.test(branch);
const typeofBranch = (branch = process.env.NODE_ENV_BRANCH) => {
    const [, type] = (branch || '').match(/deploy-(\w+)/) || [];
    if (/dev|beta|prod/.test(type)) {
        return type;
    }

    if (isTorBranch(branch)) {
        return 'prod';
    }

    if (type === 'alpha') {
        return 'red';
    }

    if (type) {
        return 'blue';
    }
    return 'dev';
};

const getStatsConfig = (deployBranch = '') => {
    const [, host = 'dev', subhost = 'a'] = deployBranch.split('-');
    return extend({}, STATS_CONFIG[host], STATS_ID[subhost]) || NO_STAT_MACHINE;
};

const getDefaultApiTarget = (defaultType = 'dev') => {
    if (isWebClient() || !hasEnv()) {
        return 'prod';
    }

    if (process.env.NODE_ENV === 'dist') {
        const [, type] = (argv.branch || '').match(/\w+-(beta|prod)/) || [];
        if (type) {
            return type;
        }

        if (/red|alpha/.test(argv.branch || '')) {
            return 'dev';
        }

        return 'build';
    }

    return defaultType;
};

const isDistRelease = () => {
    return ['prod', 'beta'].includes(argv.api) || process.env.NODE_ENV === 'dist';
};

const getEnv = () => {
    if (isDistRelease()) {
        return argv.api || getDefaultApiTarget();
    }
    return argv.api || 'local';
};

const apiUrl = (type = getDefaultApiTarget(), branch = '') => {
    // Cannot override the branch when you deploy to live
    if (isProdBranch(branch) || isTorBranch(branch)) {
        return API_TARGETS.build;
    }
    return API_TARGETS[type] || API_TARGETS.dev;
};

const buildHost = () => {
    if (isTorBranch()) {
        return TOR_URL;
    }
    const host = isProdBranch() ? API_TARGETS.prod : process.env.NODE_ENV_API || apiUrl();
    return host.replace(/\api$/, '');
};

/**
 * Get correct sentry UR/releaseL config for the current env
 * release can be undefined if we don't have a release available
 * - on dev it's based on the API you specify
 * - on deploy it's based on the branch name
 * @return {String}
 */
const sentryConfig = () => {
    if (process.env.NODE_ENV === 'dist') {
        const env = typeofBranch(argv.branch);
        process.env.NODE_ENV_SENTRY = env;
        return SENTRY_CONFIG[env];
    }
    const env = getDefaultApiTarget(argv.api);
    process.env.NODE_ENV_SENTRY = env;
    return SENTRY_CONFIG[env];
};

const getHostURL = (encoded) => {
    const url = '/assets/host.png';

    if (encoded) {
        const encoder = (input) => `%${input.charCodeAt(0).toString(16)}`;
        return url
            .split('/')
            .map((chunk) => {
                if (chunk === '/') {
                    return chunk;
                }
                return chunk
                    .split('')
                    .map(encoder)
                    .join('');
            })
            .join('/');
    }
    return url;
};

const getConfig = (env = process.env.NODE_ENV) => {
    const CONFIG = extend({}, CONFIG_DEFAULT, {
        debug: env === 'dist' ? false : 'debug-app' in argv ? argv['debug-app'] : true,
        apiUrl: apiUrl(argv.api, argv.branch),
        sentry: sentryConfig(),
        app_version: argv['app-version'] || CONFIG_DEFAULT.app_version,
        api_version: `${argv['api-version'] || CONFIG_DEFAULT.api_version}`,
        articleLink: argv.article || CONFIG_DEFAULT.articleLink,
        changelogPath: env === 'dist' ? CONFIG_DEFAULT.changelogPath : 'changelog.tpl.html',
        statsConfig: getStatsConfig(argv.branch)
    });
    return extend({ CONFIG }, { branch: argv.branch });
};

module.exports = {
    AUTOPREFIXER_CONFIG,
    getHostURL,
    getConfig,
    isDistRelease,
    getI18nMatchFile: i18nLoader.getI18nMatchFile,
    getStatsConfig,
    argv,
    getEnv,
    getHostURL,
    hasEnv,
    isWebClient
};
