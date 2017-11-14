const fs = require('fs');
const path = require('path');

const getCountry = (lang) => {
    const key = (lang === 'en') ? 'us' : lang;
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
const readFile = (file) => new Promise((resolve, reject) => {
    const key = path.basename(file, '.po');
    const stream = fs.createReadStream(file, { start: 100, end: 500 });
    stream.on('data', (data) => {
        const [ , lang ] = data.toString().match(/"Language:.(\w+)/);
        resolve(`${key}#${formatLang(lang.trim())}`);
    });
    stream.on('error', reject);
});

/**
 * Create a list of available translations for the applications
 * Format: xx_XX
 * @return {Array}
 */
const listAvailableTranslations = () => {
    return fs.readdirSync(path.join(__dirname, '../po'))
        .filter((file) => path.extname(file) === '.po')
        .map((file) => path.basename(file, '.po'))
        .map((name) => `${name}_${getCountry(name)}`);
};

const TRANSLATIONS_APP = listAvailableTranslations();

module.exports = {
    getCountry,
    TRANSLATIONS_APP
};
