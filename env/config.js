const extend = require('lodash/extend');
const execSync = require('child_process').execSync;
const argv = require('minimist')(process.argv.slice(2));

const i18n = require('../po/lang');
const PACKAGE = require('../package');

const APP_VERSION = PACKAGE.version;
const i18nLoader = require('./translationsLoader');

const AUTOPREFIXER_CONFIG = {
    browsers: [
        'last 2 versions',
        'iOS >= 8',
        'Safari >= 8'
    ]
};

const STATS_ID = {
    a: {
        siteId: 5, // the id of the global (total) piwik site
        abSiteId: 8 // the id of the piwik site that is configured to only track requests that touch this FE version
    },
    b: {
        siteId: 5, // the id of the global (total) piwik site
        abSiteId: 9 // the id of the piwik site that is configured to only track requests that touch this FE version
    }
};

const API_TARGETS = {
    blue: 'https://protonmail.blue/api',
    beta: 'https://beta.protonmail.com/api',
    prod: 'https://mail.protonmail.com/api',
    dev: 'https://dev.protonmail.com/api',
    v2: 'https://v2.protonmail.com/api',
    local: 'https://protonmail.dev/api',
    host: 'https://mail.protonmail.host/api',
    vagrant: 'https://172.28.128.3/api',
    build: '/api'
};

const PROD_STAT_MACHINE = {
    isEnabled: true,
    statsHost: 'stats.protonmail.ch',
    domains: ['*.protonmail.com', '*.mail.protonmail.com'],
    cookieDomain: '*.protonmail.com'
};

const HOST_STAT_MACHINE = {
    isEnabled: true,
    statsHost: 'stats.protonmail.host',
    domains: ['*.protonmail.host', '*.mail.protonmail.host'],
    cookieDomain: '*.protonmail.host'
};

const NO_STAT_MACHINE = { isEnabled: false };

const STATS_CONFIG = {
    beta: PROD_STAT_MACHINE,
    prod: PROD_STAT_MACHINE,
    dev: PROD_STAT_MACHINE,
    host: HOST_STAT_MACHINE
};

i18nLoader.set(i18n);

const APP = {
    app_version: APP_VERSION,
    api_version: '2',
    date_version: new Date().toDateString(),
    year: (new Date()).getFullYear(),
    clientID: 'Web',
    clientSecret: '4957cc9a2e0a2a49d02475c9d013478d',
    articleLink: 'https://protonmail.com/blog/protonmail-v3-12-release-notes/',
    translations: i18nLoader.get('list')
};


const getStatsConfig = (deployBranch = '') => {
    const [, host = 'dev', subhost = 'a' ] = deployBranch.split('-');
    return extend({}, STATS_CONFIG[host], STATS_ID[subhost]) || NO_STAT_MACHINE;
};

const getDefaultApiTarget = () => (/webclient/i.test(__dirname) ? 'prod' : 'dev');
const apiUrl = (type = getDefaultApiTarget()) => API_TARGETS[type];

const getVersion = () => argv['app-version'] || APP_VERSION;

const getConfig = (env = process.env.NODE_ENV) => {

    const CONFIG = extend({}, APP, {
        debug: ((env === 'dist') ? false : ('debug-app' in argv ? argv['debug-app'] : true)),
        apiUrl: apiUrl(argv.api),
        app_version: getVersion(),
        api_version: `${argv['api-version'] || APP.api_version}`,
        articleLink: argv.article || APP.articleLink,
        statsConfig: getStatsConfig(argv.branch)
    });

    return extend({ CONFIG }, { branch: argv.branch });
};

const isDistRelease = () => {
    return ['prod', 'beta'].includes(argv.api) || process.env.NODE_ENV === 'dist';
};

const getEnv = () => {
    if (isDistRelease()) {
        return argv.api || getDefaultApiTarget();
    }
    return argv.api || 'local';
}

module.exports = {
    AUTOPREFIXER_CONFIG, getConfig, PACKAGE, isDistRelease,
    getI18nMatchFile: i18nLoader.getI18nMatchFile,
    argv, getEnv
};
