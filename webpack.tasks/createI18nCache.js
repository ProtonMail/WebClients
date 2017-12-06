#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const i18nLoader = require('../env/translationsLoader');
const PATH_ENV_I18N = path.resolve('./po/lang.json');

/*
    Generate a cache files with transaltions keys
    - po/lang.json
 */
(async () => {
    const list = await i18nLoader.load();
    fs.writeFileSync(PATH_ENV_I18N, JSON.stringify(list, null, 2));
    console.log(`${chalk.green('✓')} Generate cache app i18n`);
})();
