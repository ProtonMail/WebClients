const path = require('path');
const _ = require('lodash');
const i18n = require('../po/lang');
const PACKAGE = require('../package');

const locales = (() => {
    try {
        return require(path.join('..', 'po', 'locales.json'));
    } catch (e) {
        console.warn('No po/locales.json available yet');
        return {};
    }
})();

module.exports = {
    app_version: PACKAGE.version,
    app_version_v4: PACKAGE['version-beta'],
    api_version: '3',
    date_version: new Date().toGMTString(),
    year: new Date().getFullYear(),
    clientID: 'Web',
    clientSecret: '4957cc9a2e0a2a49d02475c9d013478d',
    articleLink: 'https://protonmail.com/blog/protonmail-v3-16-release-notes/',
    changelogPath: 'assets/changelog.tpl.html',
    versionPath: 'assets/version.json',
    translations: _.map(i18n, 'lang'),
    locales
};
