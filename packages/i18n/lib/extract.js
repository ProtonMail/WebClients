const { promises: fs, constants: FS_CONSTANTS } = require('fs');
const path = require('path');
const execa = require('execa');
const { success, spin, warn, debug } = require('./helpers/log')('proton-i18n');

const OUTPUT_FILE = 'po/template.pot';
const PROTON_DEP = ['src/app'].concat(
    ['react-components/{co*,helpers}', 'proton-shared/lib'].map((name) => `node_modules/${name}`)
);

async function extractor() {
    if (process.env.APP_KEY === 'Angular') {
        const cmd = `npx angular-gettext-cli --files './src/+(app|templates)/**/**/*.+(js|html)' --dest ${OUTPUT_FILE} --attributes "placeholder-translate","title-translate","pt-tooltip-translate","translate"`;
        debug(cmd);
        return execa.shell(cmd, {
            shell: '/bin/bash'
        });
    }

    const dest = PROTON_DEP.join(' ');
    const cmd = `npx ttag extract $(find ${dest} -type f -name '*.js') -o ${OUTPUT_FILE}`;
    debug(cmd);
    return execa.shell(cmd, {
        shell: '/bin/bash'
    });
}

async function hasDirectory() {
    const dir = path.dirname(OUTPUT_FILE);
    try {
        await fs.access(dir, FS_CONSTANTS.F_OK | FS_CONSTANTS.W_OK);
    } catch (e) {
        warn(`Cannot find/write the directory ${dir}, we're going to create it`);
        await fs.mkdir(dir);
    }
}

async function main() {
    const spinner = spin('Extracting translations');
    try {
        await hasDirectory();
        const { stdout } = await extractor();
        spinner.stop();
        debug(stdout);
        success(`Translations extracted to ${OUTPUT_FILE}`);
    } catch (e) {
        spinner.stop();
        throw e;
    }
}

module.exports = main;
