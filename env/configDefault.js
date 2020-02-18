const path = require('path');
const PACKAGE = require('../package');

const locales = (() => {
    try {
        return require(path.join('..', 'node_modules', 'proton-translations', 'config', 'locales.json'));
    } catch (e) {
        console.warn('No po/locales.json available yet');
        return {};
    }
})();

module.exports = {
    app_version: PACKAGE.version,
    api_version: '3',
    date_version: new Date().toGMTString(),
    year: new Date().getFullYear(),
    clientID: 'Web',
    clientSecret: '4957cc9a2e0a2a49d02475c9d013478d',
    articleLink: 'https://protonmail.com/blog/protonmail-v3-16-release-notes/',
    changelogPath: 'assets/changelog.tpl.html',
    versionPath: 'assets/version.json',
    translations: Object.keys(locales),
    locales
};
