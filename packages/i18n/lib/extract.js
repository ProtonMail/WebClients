const { promises: fs, constants: FS_CONSTANTS } = require('fs');
const path = require('path');

const { success, warn, debug } = require('./helpers/log')('proton-i18n');
const { script, bash } = require('./helpers/cli');
const { getFiles, PROTON_DEPENDENCIES } = require('../config');

const { TEMPLATE_FILE } = getFiles();

async function extractor(app = 'app') {
    if (process.env.APP_KEY === 'Angular') {
        const cmd = `npx angular-gettext-cli --files './src/+(app|templates)/**/**/*.+(js|html)' --dest ${TEMPLATE_FILE} --attributes "placeholder-translate","title-translate","pt-tooltip-translate","translate"`;
        debug(cmd);
        return bash(cmd);
    }

    if (app !== 'app') {
        const dest = PROTON_DEPENDENCIES[app].join(' ');
        const cmd = `npx ttag extract $(find ${dest} -type f -name '*.js' -o -name '*.ts' -o -name '*.tsx') -o ${TEMPLATE_FILE}`;
        debug(cmd);
        return bash(cmd);
    }

    return script('extract.sh', [TEMPLATE_FILE], 'inherit');
}

async function hasDirectory() {
    const dir = path.dirname(TEMPLATE_FILE);
    try {
        await fs.access(dir, FS_CONSTANTS.F_OK | FS_CONSTANTS.W_OK);
    } catch (e) {
        warn(`Cannot find/write the directory ${dir}, we're going to create it`);
        await fs.mkdir(dir);
    }
}

async function main(app) {
    await hasDirectory();
    const { stdout } = await extractor(app);
    debug(stdout);
    success(`Translations extracted to ${TEMPLATE_FILE}`);
}

module.exports = main;
