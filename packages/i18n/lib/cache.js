const fs = require('fs');
const path = require('path');
const { success, spin, debug, json } = require('./helpers/log')('proton-i18n');
const { CACHE_FILE } = require('../config').getFiles();

const PATH_ENV_I18N = path.resolve(`./${CACHE_FILE}`);

const getCountry = (lang) => {
    const key = lang === 'en' ? 'us' : lang;
    return key.toUpperCase();
};

const formatLang = (lang = '') => {
    if (lang.length === 2) {
        return `${lang}_${getCountry(lang)}`;
    }
    return lang;
};

/**
 * Read a translation file and extract the translatio key
 * @param  {String} file FilePath
 * @return {Promise}         resolve: <keyFile>#<keyTranslation>
 */
const readFile = (file) => {
    return new Promise((resolve, reject) => {
        const key = path.basename(file, '.po');
        const stream = fs.createReadStream(file, { start: 100, end: 600 });
        stream.on('data', (data) => {
            const [, lang] = data.toString().match(/"Language:.(\w+)/);
            resolve({ key, lang: formatLang(lang.trim()) });
        });
        stream.on('error', reject);
    });
};

/**
 * Create a list of available translations for the applications
 * Format: xx_XX
 * @return {Array}
 */
const getLanguages = () => {
    const promise = fs
        .readdirSync(path.join(process.cwd(), 'po'))
        .filter((file) => path.extname(file) === '.po')
        .map((file) => path.resolve('./po', file))
        .map(readFile);
    return Promise.all(promise);
};

/*
    Generate a cache files with transaltions keys
    - po/lang.json
 */
async function write(action) {
    const spinner = spin('Compiles translations');
    try {
        const list = await getLanguages();
        spinner.stop();

        if (action === 'show') {
            return json(list, true);
        }

        debug(list);
        fs.writeFileSync(PATH_ENV_I18N, JSON.stringify(list, null, 2));
        success('Generate cache app i18n');
    } catch (e) {
        spinner.stop();
        throw e;
    }
}

module.exports = { getLanguages, write };
