#!/usr/bin/env node

const dedent = require('dedent');
const chalk = require('chalk');
const argv = require('minimist')(process.argv.slice(2));
require('dotenv').config({ path: 'env/.env' });

const { error } = require('./lib/helpers/log')('proton-i18n');

const is = (command) => argv._.includes(command);

async function main() {
    if (is('crowdin')) {
        await require('./lib/crowdin')();
    }

    if (is('extract')) {
        await require('./lib/extract')();
    }

    if (is('validate')) {
        require('./lib/validate')(argv._[1], { dir: argv._[2] });
    }

    if (is('compile')) {
        require('./lib/compile')();
    }

    if (is('list')) {
        require('./lib/cache').write();
    }

    if (is('help')) {
        console.log(dedent`
        Usage: $ proton-i18n <command>
        Available commands:
          - ${chalk.blue('crowdin')}
              To update, download etc. translations (--help to get more details)

          - ${chalk.blue('validate')} ${chalk.blue('<type>')}
              To validate the translations, check if we have contexts
                - type: default (default) validate we don't have missing context
                - type: lint-functions check if we use the right format for ttag

          - ${chalk.blue('extract')}
              Extract all translations from the projet
    `);
    }
}

main().catch(error);
