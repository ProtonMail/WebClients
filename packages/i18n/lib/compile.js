const path = require('path');
const { success, debug, spin } = require('./helpers/log')('proton-i18n');
const { hasDirectory } = require('./helpers/file');
const { bash } = require('./helpers/cli');
const { I18N_JSON_DIR, I18N_EXTRACT_DIR, CACHE_FILE } = require('../config').getFiles();

const I18N_CACHE = path.join(process.cwd(), CACHE_FILE);

async function getConfig() {
    try {
        return require(I18N_CACHE);
    } catch (e) {
        throw new Error('You need to create the cache first, or make an export. Ex for the cache: proton-i18n list');
    }
}

async function run({ file, lang, key }) {
    const output = `${I18N_JSON_DIR}/${lang}.json`;

    if (process.env.APP_KEY === 'Angular') {
        const cmd = `npx angular-gettext-cli --files ${file} --dest ${output} --compile --format json`;
        return bash(cmd);
    }
    /*
     * crowdin exports the language header as fr_FR, while ttag expects it as just the language
     * https://github.com/ttag-org/plural-forms/blob/master/src/minimal-safe.js#L287
     */
    const [language] = key.split('-'); // cf pt-PT zh-CN zh-TW;
    const cmd = `npx ttag po2json --format=compact ${file} | sed 's/"language":"${lang}"/"language":"${language}"/' > ${output}`;
    return bash(cmd);
}

async function main() {
    const spinner = spin('Compiles translations');
    try {
        const config = await getConfig();
        await hasDirectory(`${I18N_JSON_DIR}/lang.json`);

        debug(config);
        const list = config
            .filter(({ key }) => key !== 'en')
            .map(({ key, lang }) => {
                return run({ file: `${I18N_EXTRACT_DIR}/${key}.po`, lang, key }).then(() =>
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
