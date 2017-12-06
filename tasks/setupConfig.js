#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const env = require('../env/config');

const PATH_CONFIG = path.resolve('./src-tmp/app/config.js');
const { CONFIG } = env.getConfig();

fs.writeFileSync(PATH_CONFIG, `export default ${JSON.stringify(CONFIG, null, 4)};`);

env.argv.debug && console.log(`${JSON.stringify(CONFIG, null, 2)}`);
console.log(`${chalk.green('✓')} Generate configuration`);
