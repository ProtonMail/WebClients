const { script } = require('./helpers/cli');
const { I18N_EXTRACT_DIR, I18N_JSON_DIR } = require('../config').getFiles();
const { debug } = require('./helpers/log')('proton-i18n');

/**
 * Commit translations inside the app
 * @param  {String} arg action for commit (upgrade|update)
 */
async function main(arg = '') {
    await script('commit.sh', [I18N_EXTRACT_DIR, I18N_JSON_DIR, arg], 'inherit');
}

module.exports = main;
