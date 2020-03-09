const os = require('os');

const { isWebClientLegacy } = require('../config');
const { bash, script } = require('../helpers/cli');
const { debug, info } = require('../helpers/log')('proton-bundler');

const SOURCE_FILE_INDEX = "find dist -maxdepth 1 -type f -name 'index*.js'";

/**
 * Get the configuration for a deployement
 *     [Warning] you must have  NODE_ENV=production
 * @param  {Array} flags flags used to bundle
 * @return {Object}       app's config
 */
async function getNewConfig(flags = process.argv.slice(3), api) {
    if (isWebClientLegacy()) {
        const { stdout = '' } = await bash('./tasks/setupConfig.js', [
            '--print-config',
            `--branch deploy-${api}`,
            ...flags
        ]);
        debug(stdout, 'stdout config angular');
        return JSON.parse(stdout);
    }

    // we don't use npx as for the CI we cached it so it's faster
    const { stdout = '' } = await bash('./node_modules/proton-pack/bin/protonPack print-config', flags);
    debug(stdout, 'stdout config app');
    return JSON.parse(stdout);
}

function sed(rule, files) {
    // Because for the lulz. cf https://myshittycode.com/2014/07/24/os-x-sed-extra-characters-at-the-end-of-l-command-error/
    if (os.platform() === 'darwin') {
        return bash(`sed -i '' '${rule}' $(${files})`);
    }
    return bash(`sed -i '${rule}' "$(${files})"`);
}

async function writeNewConfig() {
    const {
        sentry: { dsn: currentSentryDSN },
        secureUrl: currentSecureURL
    } = await getNewConfig(['--api proxy']);
    const {
        apiUrl,
        sentry: { dsn: newSentryDSN },
        secureUrl: newSecureURL
    } = await getNewConfig();

    if (isWebClientLegacy()) {
        await sed(`s#apiUrl:"/api"#apiUrl:"${apiUrl}"#;`, SOURCE_FILE_INDEX);
        info(`replace current api by ${apiUrl} inside the main index`);

        await sed(`s#sentry:"${currentSentryDSN}"#sentry:"${newSentryDSN}"#;`, SOURCE_FILE_INDEX);
        info('replace sentry config inside the main index');

        await sed(`s#secure:"${currentSecureURL}"#secure:"${newSecureURL}"#;`, SOURCE_FILE_INDEX);
        return info('replace secureURL config inside the main index');
    }

    await sed(`s#="/api"#="${apiUrl}"#;`, SOURCE_FILE_INDEX);
    info(`replace current api by ${apiUrl} inside the main index`);

    await sed(`s#="${currentSentryDSN}"#="${newSentryDSN}"#;`, SOURCE_FILE_INDEX);
    info('replace sentry config inside the main index');

    await sed(`s#="${currentSecureURL}"#="${newSecureURL}"#;`, SOURCE_FILE_INDEX);
    info('replace secureURL config inside the main index');
}

/**
 * Create a new bundle from an existing one
 * To validate the bundle, we use SRI <3 <3 <3 it's easy to validate a new build with them.
 * They crash if it doesn't match <3 <3 <3
 *     - Generate hash for files with the modifications
 *     - Replace them inside index.js
 *     - Then we replace the SRI of index.js inside index.html
 * @return {Promise}
 */
async function main({ api }) {
    await bash('cp -r dist distProd');
    info('made a copy of the current dist');

    await writeNewConfig();

    const { stdout } = await script('manageSRI.sh write-html');
    info('update new index.html');
    debug(stdout, 'write new SRIs HTML');

    const { stdout: stdoutSed } = await script('manageSRI.sh write-env', [api]);
    info('update new .env');
    debug(stdoutSed, 'write new APP_ENV');

    /**
     * Check if the sub-build is valid
     *     - Correct SRI for updated files
     *     - Correct SRI for the index
     *     - Right config for A/B
     *     - Right config for Sentry
     * Stop the process if it fails
     */
    await script('manageSRI.sh validate', [api]);
}

module.exports = main;
