const fs = require('fs');
const extend = require('lodash/extend');
const semver = require('semver');
const PACKAGE = require('../package');
const { TRANSLATIONS_APP } = require('./translationsLoader');

const APP_VERSION = PACKAGE.version || '3.8.18';

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

const APP = {
    app_version: APP_VERSION,
    api_version: '1',
    date_version: new Date().toDateString(),
    year: (new Date()).getFullYear(),
    clientID: 'Web',
    clientSecret: '4957cc9a2e0a2a49d02475c9d013478d',
    articleLink: 'https://protonmail.com/blog/protonmail-v3-11-release-notes/',
    translations: TRANSLATIONS_APP
};

const getStatsConfig = (deployBranch = '') => {
    const [, host = 'dev', subhost = 'a' ] = deployBranch.split('-');
    return extend({}, STATS_CONFIG[host], STATS_ID[subhost]) || NO_STAT_MACHINE;
};

const apiUrl = (type) => {
    if (type && API_TARGETS[type]) {
        return API_TARGETS[type];
    }
    return API_TARGETS.build;
};

const getVersion = ({ major, minor, patch, version }) => {
    if (major) {
        return semver.inc(APP_VERSION, 'major');
    }
    if (minor) {
        return semver.inc(APP_VERSION, 'minor');
    }
    if (patch) {
        return semver.inc(APP_VERSION, 'patch');
    }

    return version || APP_VERSION;
};

const getConfig = (grunt) => {

    const CONFIG = extend({}, APP, {
        debug: !!grunt.option('debug-app'),
        apiUrl: apiUrl(grunt.option('api')),
        app_version: getVersion({
            version: grunt.option('app-version'),
            patch: !!grunt.option('patch'),
            minor: !!grunt.option('minor'),
            major: !!grunt.option('major')
        }),
        api_version: `${grunt.option('api-version') || APP.api_version}`,
        articleLink: grunt.option('article') || APP.articleLink,
        statsConfig: getStatsConfig(grunt.option('dest'))
    });

    const isDistRelease = () => {
        const [, host] = (grunt.option('dest') || '').split('-');
        return /beta|prod/.test(host);
    };

    const getEnv = () => grunt.option('api') || 'local';

    const syncPackage = () => {
        if (PACKAGE.version !== CONFIG.app_version) {
            PACKAGE.version = CONFIG.app_version;
            fs.writeFileSync('./package.json', JSON.stringify(PACKAGE, null, 2));
            console.log(`== Package.json updated to version ${CONFIG.app_version} ==`);
            return true;
        }
    };


    return { CONFIG, isDistRelease, syncPackage, getEnv };
};

module.exports = { AUTOPREFIXER_CONFIG, getConfig, PACKAGE };
