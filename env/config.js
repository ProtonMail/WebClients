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

const API_TARGETS = {
    blue: 'https://protonmail.blue/api',
    beta: 'https://beta.protonmail.com/api',
    prod: 'https://mail.protonmail.com/api',
    dev: 'https://dev.protonmail.com/api',
    v2: 'https://v2.protonmail.com/api',
    local: 'https://protonmail.dev/api',
    host: 'https://protonmail.host/api',
    vagrant: 'https://172.28.128.3/api',
    build: '/api'
};

const APP = {
    app_version: APP_VERSION,
    api_version: '1',
    date_version: new Date().toDateString(),
    year: (new Date()).getFullYear(),
    clientID: 'Web',
    clientSecret: '4957cc9a2e0a2a49d02475c9d013478d',
    articleLink: 'https://protonmail.com/blog/protonmail-v3-8-release-notes/',
    translations: TRANSLATIONS_APP
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
        articleLink: grunt.option('article') || APP.articleLink
    });

    const isDistRelease = () => ['prod', 'beta'].indexOf(grunt.option('api')) !== -1;

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
