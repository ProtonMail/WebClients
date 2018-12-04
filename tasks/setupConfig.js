#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const dedent = require('dedent');
const execa = require('execa');
const localIp = require('my-local-ip');
const portfinder = require('portfinder'); // Coming from webpack-dev-server

// Default PORT for webpack
portfinder.basePort = 8080;

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

const generator = (() => {
    const fileNameChangelog = path.join('build', CONFIG.changelogPath);
    const fileNameVersionInfo = path.join('build', CONFIG.versionPath);
    const changelog = () => {
        execa.shell(`tasks/generateChangelog.js ./CHANGELOG.md ${fileNameChangelog}`);
    };

    const version = () => {
        execa.shell(`tasks/generateVersionInfo.js ${CONFIG.app_version} ${CONFIG.commit} ${fileNameVersionInfo}`);
    };

    return { changelog, version };
})();

// Debug mode npm start
if (process.env.NODE_ENV !== 'dist' && env.argv.debug) {
    if (!fs.existsSync('build')) {
        fs.mkdirSync('build');
    }
    generator.changelog();
}

if (process.env.NODE_ENV !== 'dist' && process.env.NODE_ENV_MODE !== 'config') {
    generator.version();

    if (!env.hasEnv() && !env.isWebClient()) {
        console.log();
        console.log(dedent`
            ${chalk.bgMagenta('⚠ No env.json detected')}
            ➙ Please check the wiki to create it
        `);
        console.log();
    }

    portfinder.getPortPromise().then((port) => {
        process.env.NODE_ENV_PORT = port;
        const server = (ip = 'localhost') => chalk.yellow(`http://${ip}:${port}`);
        console.log(dedent`
            ${chalk.green('✓')} Generate configuration
            ➙ Api: ${chalk.bgYellow(chalk.black(CONFIG.apiUrl))}
            ➙ Sentry: ${chalk.yellow(process.env.NODE_ENV_SENTRY)}
            ➙ Dev server: ${server()}
            ➙ Dev server: ${server(localIp())}
        `);
    });
}
