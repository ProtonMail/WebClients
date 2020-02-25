const path = require('path');
const { success, warn } = require('./helpers/log')('proton-i18n');
const { bash } = require('./helpers/cli');
const { hasDirectory } = require('./helpers/file');
const { I18N_DEPENDENCY_REPO, I18N_DEPENDENCY_BRANCH } = require('../config').getEnv();

const OUTPUT_CLONE = path.join('node_modules', 'proton-translations');

async function main() {
    if (!I18N_DEPENDENCY_REPO || !I18N_DEPENDENCY_BRANCH) {
        const warningSpaces = false;
        console.log();
        await hasDirectory(OUTPUT_CLONE, true, { warningSpaces });
        warn(
            'you need the variable I18N_DEPENDENCY_REPO + I18N_DEPENDENCY_BRANCH available inside env to install translations',
            warningSpaces
        );
        return console.log();
    }

    const commands = [
        `rm -rf ${OUTPUT_CLONE} || echo`,
        `git clone ${I18N_DEPENDENCY_REPO} --depth 1 --branch ${I18N_DEPENDENCY_BRANCH} ${OUTPUT_CLONE}`,
        `rm -rf ${path.join(OUTPUT_CLONE, '.git')}`
    ].join(' && ');
    await bash(commands);
    success(`added translations inside ${OUTPUT_CLONE}`);
}

module.exports = main;
