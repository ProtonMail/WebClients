#!/usr/bin/env node

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const chalk = require('chalk');

const i18nConfig = require('../po/lang');

const success = (msg) => console.log(`${chalk.green('✓')} ${msg}.`);

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
        console.log(chalk.magentaBright(' ⚠ '), chalk.red(e.message));
        process.exit(1);
    }
})();
