const ENV = (() => {
    try {
        return require('./env.json');
    } catch (e) {
        return {};
    }
})();

const AUTOPREFIXER_CONFIG = {
    browsers: ['last 2 versions', 'iOS >= 8', 'Safari >= 8']
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

const ENV_CONFIG = Object.keys(ENV).reduce(
    (acc, key) => {
        const { api, securedIframe, ...sentry } = ENV[key];
        acc.sentry[key] = sentry;
        api && (acc.api[key] = api);
        securedIframe && (acc.securedIframe[key] = securedIframe);
        return acc;
    },
    { sentry: {}, api: {}, securedIframe: {} }
);

const API_TARGETS = {
    prod: 'https://mail.protonmail.com/api',
    local: 'https://protonmail.dev/api',
    localhost: 'https://localhost/api',
    host: 'https://mail.protonmail.host/api',
    vagrant: 'https://172.28.128.3/api',
    build: '/api',
    ...ENV_CONFIG.api
};

const SENTRY_CONFIG = ENV_CONFIG.sentry;

const PROD_STAT_MACHINE = {
    isEnabled: false,
    statsHost: 'stats.protonmail.ch',
    domains: ['*.protonmail.com', '*.mail.protonmail.com'],
    cookieDomain: '*.protonmail.com'
};

const HOST_STAT_MACHINE = {
    isEnabled: false,
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

const TOR_URL = 'https://protonirockerxow.onion/';

module.exports = {
    TOR_URL,
    AUTOPREFIXER_CONFIG,
    STATS_ID,
    API_TARGETS,
    PROD_STAT_MACHINE,
    HOST_STAT_MACHINE,
    NO_STAT_MACHINE,
    STATS_CONFIG,
    SENTRY_CONFIG,
    SECURED_IFRAME: ENV_CONFIG.securedIframe
};
