#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dedent = require('dedent');
const _ = require('lodash');
const got = require('got');
const chalk = require('chalk');
const JSZip = require('jszip');
const moment = require('moment');
const argv = require('minimist')(process.argv.slice(2));
const FormData = require('form-data');
require('dotenv').config({ path: 'env/.env' });

const { error } = require('./lib/helpers/log')('proton-i18n');

const is = (command) => argv._.includes(command) && argv._.length === 1;
const isEmpty = () => !argv._.length;

async function main() {
    if (is('crowdin')) {
      require('./lib/crowdin')();
    }

    if (is('extract')) {
      await require('./lib/extract')();
    }

    if (is('validate')) {
      require('./lib/validate')();
    }

  if (is('help') || isEmpty()) {
    console.log(dedent`
        Usage: $ proton-i18n <command>
        Available commands:
          - ${chalk.blue('crowdin')}
              To update, download etc. translations (--help to get more details)
          - ${chalk.blue('validate')}
              To validate the translations, check if we have contexts
          - ${chalk.blue('extract')}
              Extract all translations from the projet
    `);
  }
}

main().catch(error);