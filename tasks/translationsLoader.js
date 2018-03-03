const fs = require('fs');
const path = require('path');

const CACHE = {};

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
const readFile = (file) =>
    new Promise((resolve, reject) => {
        const key = path.basename(file, '.po');
        const stream = fs.createReadStream(file, { start: 100, end: 600 });
        stream.on('data', (data) => {
            const [, lang] = data.toString().match(/"Language:.(\w+)/);
            resolve({ key, lang: formatLang(lang.trim()) });
        });
        stream.on('error', reject);
    });

/**
 * Format a cache to get all translations available inside the app
 * Create a map matching type of file and the attached translation key
 * @param  {Array} collection List translations
 * @return {Object}       { map: <Object>, list: <Array> }
 */
const set = (collection = []) => {
    const { map, list } = collection.reduce(
        (acc, { key, lang }) => {
            acc.map[key] = lang;
            acc.list.push(lang);
            return acc;
        },
        { map: {}, list: [] }
    );
    CACHE.map = map;
    CACHE.list = list;
    return CACHE;
};

/**
 * Create a list of available translations for the applications
 * Format: xx_XX
 * @return {Array}
 */
const load = () => {
    const promise = fs
        .readdirSync(path.join(__dirname, '../po'))
        .filter((file) => path.extname(file) === '.po')
        .map((file) => path.resolve('./po', file))
        .map(readFile);
    return Promise.all(promise).then((list) => (set(list), list));
};

module.exports = {
    load,
    set,
    get(key) {
        return CACHE[key];
    },
    getI18nMatchFile(key) {
        return CACHE.map[key];
    }
};
