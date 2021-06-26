const path = require('path');
const { writeFile } = require('fs').promises;

const { bash } = require('../helpers/cli');
const { success, info, warn } = require('../helpers/log')('proton-i18n');

async function main(outputCloned) {
    info('check if we are on a custom branch', false);
    const { stdout: currentBranch = '' } = await bash('echo "${CI_COMMIT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"');

    info(`validate current branch: ${currentBranch}`, false);
    if (/^release|^master$|-version$/.test(currentBranch)) {
        return warn('we will not extend from this branch');
    }

    info('build extracted locales', false);
    // We use it to lint + build extracted translation
    await bash('npm run i18n:prepare');

    const languages = require(path.join(process.cwd(), outputCloned, 'config', 'lang.json'));
    const DEFAULT_JSON = require(path.join(process.cwd(), 'locales', 'en.json'));

    const extend = (json) => {
        return Object.keys(DEFAULT_JSON).reduce((acc, key) => {
            if (key === 'languageBase' || key === 'language') {
                return {
                    ...acc,
                    [key]: json[key],
                };
            }

            return {
                ...acc,
                [key]: { ...DEFAULT_JSON[key], ...json[key] },
            };
        }, Object.create(null));
    };

    const getFile = (lang) => path.join(process.cwd(), outputCloned, `${lang}.json`);
    const promises = languages.map((lang) => {
        const file = getFile(lang);
        const data = require(file);
        return writeFile(file, JSON.stringify(extend(data)));
    });

    info('extend installed locales with extracted locales', false);
    await Promise.all(promises);
    success('Extend translations to mask missing ones');
}

module.exports = main;
