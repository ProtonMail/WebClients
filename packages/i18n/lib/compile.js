const path = require('path');
const execa = require('execa');
const { success, debug, spin } = require('./helpers/log')('proton-i18n');
const { I18N_JSON_DIR, I18N_EXTRACT_DIR, CACHE_FILE } = require('../config').getFiles();

const I18N_CACHE = path.join(process.cwd(), CACHE_FILE);

async function getConfig() {
    try {
        return require(I18N_CACHE);
    } catch (e) {
        throw new Error('You need to create the cache first, or make an export. Ex for the cache: proton-i18n list');
    }
}

async function run({ file, lang }) {
    const output = `${I18N_JSON_DIR}/${lang}.json`;
    if (process.env.APP_KEY === 'Angular') {
        const cmd = `npx angular-gettext-cli --files ${file} --dest ${output} --compile --format json`;
        debug(cmd);
        return execa.shell(cmd, {
            shell: '/bin/bash'
        });
    }

    const cmd = `npx ttag po2json ${file} > ${output}`;
    debug(cmd);
    return execa.shell(cmd, {
        shell: '/bin/bash'
    });
}

async function main() {
    const spinner = spin('Compiles translations');
    try {
        const config = await getConfig();
        debug(config);
        const list = config
            .filter(({ key }) => key !== 'en')
            .map(({ key, lang }) => {
                return run({ file: `${I18N_EXTRACT_DIR}}/${key}.po`, lang }).then(() =>
                    debug(`Compilation done for ${lang}`)
                );
            });

        await Promise.all(list);
        spinner.stop();
        success('Compilation to JSON done');
    } catch (e) {
        spinner.stop();
        throw e;
    }
}

module.exports = main;
