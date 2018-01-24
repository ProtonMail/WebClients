#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const env = require('../env/config');
const PATH_CONFIG = path.resolve('./src/app/config.js');
const { CONFIG } = env.getConfig();

fs.writeFileSync(PATH_CONFIG, `export default ${JSON.stringify(CONFIG, null, 4)};`);

/**
 * Fuck you webpack
 * thx https://github.com/webpack/watchpack/issues/25#issuecomment-357483744
 */
const now = Date.now() / 1000;
const then = now - 11;
fs.utimesSync(PATH_CONFIG, then, then);

env.argv.debug && console.log(`${JSON.stringify(CONFIG, null, 2)}`);
if (process.env.NODE_ENV !== 'dist') {
    console.log(`${chalk.green('✓')} Generate configuration`);
    console.log('~', chalk.bgYellow(chalk.black(`API: ${CONFIG.apiUrl}`)), '~');
}
