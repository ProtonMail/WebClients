#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const { success } = require('./helpers/log');
const i18nLoader = require('./translationsLoader');

const PATH_ENV_I18N = path.resolve('./po/lang.json');

/*
    Generate a cache files with transaltions keys
    - po/lang.json
 */
(async () => {
    const list = await i18nLoader.load();
    fs.writeFileSync(PATH_ENV_I18N, JSON.stringify(list, null, 2));
    success('Generate cache app i18n');
})();
