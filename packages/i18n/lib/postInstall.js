const path = require('path');
const { success, warn } = require('./helpers/log')('proton-i18n');
const { bash } = require('./helpers/cli');
const { I18N_DEPENDENCY_REPO, I18N_DEPENDENCY_BRANCH } = require('../config').getEnv();

const OUTPUT_CLONE = path.join('node_modules', 'proton-translations');

async function main() {
    if (!I18N_DEPENDENCY_REPO) {
        warn('no I18N_DEPENDENCY_REPO available inside env, we "mock" the directory');
        return bash(`mkdir -p ${OUTPUT_CLONE} || echo`);
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
