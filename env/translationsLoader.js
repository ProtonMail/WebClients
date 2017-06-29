const fs = require('fs');
const path = require('path');

const getCountry = (lang) => {
    const key = (lang === 'en') ? 'us' : lang;
    return key.toUpperCase();
};

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
