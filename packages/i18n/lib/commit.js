const path = require('path');
const execa = require('execa');
const { I18N_EXTRACT_DIR, I18N_JSON_DIR } = require('../config').getFiles();
const { debug } = require('./helpers/log')('proton-i18n');

/**
 * Commit translations inside the app
 * @param  {String} arg action for commit (upgrade|update)
 */
async function main(arg = '') {
    const cmd = path.resolve(__dirname, '..', 'scripts/commit.sh');
    debug(`${cmd} ${I18N_EXTRACT_DIR} ${I18N_JSON_DIR} ${arg}`);
    const { stdout } = await execa.shell(`${cmd} ${I18N_EXTRACT_DIR} ${I18N_JSON_DIR} ${arg}`, {
        shell: '/bin/bash'
    });
    debug(stdout);
}

module.exports = main;
