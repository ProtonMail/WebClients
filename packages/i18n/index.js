#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const got = require('got');
const chalk = require('chalk');
const JSZip = require('jszip');
const moment = require('moment');
const argv = require('minimist')(process.argv.slice(2));
const FormData = require('form-data');
require('dotenv').config({ path: 'env/.env' });

const { error } = require('./lib/helpers/log');

try {

  if (argv._.includes('crowdin')) {
    require('./lib/crowdin')();
  }

  if (argv._.includes('extract')) {
    require('./lib/extract')();
  }

  if (argv._.includes('validate')) {
    require('./lib/validate')();
  }

} catch (e) {
  error(e)
}