const path = require('path');
const { error } = require('./lib/helpers/log')('proton-i18n');

const ENV_FILE = 'env/.env';
const PROTON_DEPENDENCIES = {
    app: ['src/app'].concat(
        ['react-components/{co*,helpers}', 'proton-shared/lib'].map((name) => `node_modules/${name}`)
    ),
    reactComponents: ['{co*,helpers}'],
    shared: ['lib']
};

const getFiles = () => {
    const TEMPLATE_NAME = 'template.pot';
    const I18N_EXTRACT_DIR = process.env.I18N_EXTRACT_DIR || 'po';
    const I18N_JSON_DIR = process.env.I18N_JSON_DIR || 'src/i18n';

    return {
        TEMPLATE_NAME,
        I18N_EXTRACT_DIR,
        I18N_JSON_DIR,
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
    CROWDIN_FILE_NAME: process.env.CROWDIN_FILE_NAME,
    CROWDIN_PROJECT_NAME: process.env.CROWDIN_PROJECT_NAME,
    APP_KEY: process.env.APP_KEY
});

const getCrowdin = () => {
    if (!process.env.CROWDIN_KEY_API || !process.env.CROWDIN_FILE_NAME || !process.env.CROWDIN_PROJECT_NAME) {
        const keys = ['CROWDIN_KEY_API', 'CROWDIN_FILE_NAME', 'CROWDIN_PROJECT_NAME'].join(' - ');
        error(new Error(`Missing one/many mandatory keys from the .env ( cf the Wiki): \n${keys}`));
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
