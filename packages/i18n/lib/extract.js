const { promises: fs, constants: FS_CONSTANTS } = require('fs');
const path = require('path');
const execa = require('execa');
const { success, spin, warn, debug } = require('./helpers/log')('proton-i18n');
const { getFiles, PROTON_DEPENDENCIES } = require('../config');

const { TEMPLATE_FILE } = getFiles();

async function extractor(app = 'app') {
    if (process.env.APP_KEY === 'Angular') {
        const cmd = `npx angular-gettext-cli --files './src/+(app|templates)/**/**/*.+(js|html)' --dest ${TEMPLATE_FILE} --attributes "placeholder-translate","title-translate","pt-tooltip-translate","translate"`;
        debug(cmd);
        return execa.shell(cmd, {
            shell: '/bin/bash'
        });
    }

    const dest = PROTON_DEPENDENCIES[app].join(' ');
    const cmd = `npx ttag extract $(find ${dest} -type f -name '*.js') -o ${TEMPLATE_FILE}`;
    debug(cmd);
    return execa.shell(cmd, {
        shell: '/bin/bash'
    });
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
    const spinner = spin('Extracting translations');
    try {
        await hasDirectory();
        const { stdout } = await extractor(app);
        spinner.stop();
        debug(stdout);
        success(`Translations extracted to ${TEMPLATE_FILE}`);
    } catch (e) {
        spinner.stop();
        throw e;
    }
}

module.exports = main;
