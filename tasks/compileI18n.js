#!/usr/bin/env node

const chalk = require('chalk');

const { exec } = require('./helpers/command');
const { success, error } = require('./helpers/log');

const i18nConfig = require('../po/lang');

const compile = async ({ file, lang }) => {
    const output = `src/i18n/${lang}.json`;
    await exec(`npx angular-gettext-cli --files ${file} --dest ${output} --compile --format json`);
    success(`Compilation done for ${chalk.yellow(lang)}`);
};


(async () => {
    try {
        const list = i18nConfig
            .filter(({ key }) => key !== 'en')
            .map(({ key, lang }) => compile({ file: `po/${key}.po`, lang }));

        await Promise.all(list);
        success('Compilation to JSON done');
        process.exit(0);
    } catch (e) {
        error(e);
    }
})();
