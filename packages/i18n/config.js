const fs = require('fs');
const path = require('path');
const { warn } = require('./lib/helpers/log')('proton-i18n');

// Compat mode WebClient
const ENV_FILE = process.env.TEST_ENV || (fs.existsSync('.env') ? '.env' : 'env/.env');
require('dotenv').config({ path: ENV_FILE });

const PROTON_DEPENDENCIES = {
    app: ['src/app'].concat(
        ['react-components/{co*,helpers}', 'proton-shared/lib'].map((name) => `node_modules/${name}`)
    ),
    reactComponents: ['{co*,helpers}'],
    shared: ['lib']
};

/**
 * Detect the beta v4 -> we have a custom pot for this one
 * @return {Boolean}
 */
const isBetaAngularV4 = () => {
    try {
        const { name, 'version-beta': versionBeta } = require(path.join(process.cwd(), 'package.json')); // We might use proton-i18n on top of a non node package
        return versionBeta && name === 'protonmail-web';
    } catch (e) {
        return false;
    }
};

const getFiles = () => {
    const TEMPLATE_NAME = process.env.I18N_TEMPLATE_FILE || 'template.pot';
    const I18N_EXTRACT_DIR = process.env.I18N_EXTRACT_DIR || 'po';
    const I18N_JSON_DIR = process.env.I18N_JSON_DIR || 'src/i18n';
    const LANG_EXPORTABLE_LIST = path.join(process.cwd(), I18N_EXTRACT_DIR, 'i18n.txt');

    return {
        TEMPLATE_NAME,
        I18N_EXTRACT_DIR,
        I18N_JSON_DIR,
        LANG_EXPORTABLE_LIST,
        CACHE_FILE: path.join(I18N_EXTRACT_DIR, 'lang.json'),
        I18N_OUTPUT_DIR: path.join(process.cwd(), I18N_EXTRACT_DIR),
        TEMPLATE_FILE: path.join(I18N_EXTRACT_DIR, TEMPLATE_NAME),
        TEMPLATE_FILE_FULL: path.join(process.cwd(), I18N_EXTRACT_DIR, TEMPLATE_NAME)
    };
};
const getEnv = () => ({
    I18N_EXTRACT_DIR: process.env.I18N_EXTRACT_DIR,
    I18N_JSON_DIR: process.env.I18N_JSON_DIR,
    CROWDIN_KEY_API: process.env.CROWDIN_KEY_API,
    CROWDIN_FILE_NAME: !isBetaAngularV4() ? process.env.CROWDIN_FILE_NAME : process.env.CROWDIN_FILE_NAME_V4,
    CROWDIN_PROJECT_NAME: process.env.CROWDIN_PROJECT_NAME,
    APP_KEY: process.env.APP_KEY
});

const getCrowdin = () => {
    if (!process.env.CROWDIN_KEY_API || !process.env.CROWDIN_FILE_NAME || !process.env.CROWDIN_PROJECT_NAME) {
        const keys = ['CROWDIN_KEY_API', 'CROWDIN_FILE_NAME', 'CROWDIN_PROJECT_NAME'].join(' - ');
        warn(`Missing one/many mandatory keys from the .env ( cf the Wiki): \n${keys}`);
        process.exit(0);
    }

    return {
        KEY_API: process.env.CROWDIN_KEY_API,
        FILE_NAME: process.env.CROWDIN_FILE_NAME,
        PROJECT_NAME: process.env.CROWDIN_PROJECT_NAME
    };
};

module.exports = {
    getEnv,
    getCrowdin,
    getFiles,
    ENV_FILE,
    PROTON_DEPENDENCIES
};
