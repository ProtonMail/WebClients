const path = require('path');
const execa = require('execa');
const { I18N_EXTRACT_DIR, I18N_JSON_DIR } = require('../config').getFiles();
const { debug } = require('./helpers/log')('proton-i18n');

/**
 * Validate the code to check if we use the correct format when
 * we write ttag translations.
 * @param  {String} arg path to lint
 */
async function main(arg = '') {
    const cmd = path.resolve(__dirname, '..', 'scripts/commit.sh');
    const { stdout } = await execa.shell(`${cmd} ${I18N_EXTRACT_DIR} ${I18N_EXTRACT_DIR} ${arg}`, {
        shell: '/bin/bash'
    });
    debug(stdout);
}

module.exports = main;
