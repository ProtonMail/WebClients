const os = require('os');

const { isWebClientLegacy, getPackage } = require('../config');
const { bash, script } = require('../helpers/cli');
const { debug, info } = require('../helpers/log')('proton-bundler');

const SOURCE_FILE_INDEX = "find dist -maxdepth 1 -type f -name 'index*.js'";

/**
 * Fetch master and develop if we do not already have them
 */
const fetchBranches = async () => {
    for (const branch of ['master', 'develop']) {
        const { stdout = '' } = await bash(`git show-ref refs/heads/${branch} || echo`);
        if (!stdout) {
            info(`fetch branch ${branch} as we did not have its ref`);
            await bash(`git fetch origin ${branch}`);
        }
    }
};

/**
 * Get the develop package,json, the one we used to deploy
 */
const getPKGDevelopDeployed = async () => {
    const { stdout: hashApp = '' } = await bash('cat .env.bundle | grep HASH');
    const [, smallHash = 'origin/develop'] = hashApp.split('=');
    const { stdout: pkgDevelop } = await bash(`git show ${smallHash}:package.json`);
    return JSON.parse(pkgDevelop);
};

/**
 * When we deploy the APP we can deploy it from a cache bundle from staging with the previous version
 * as once we say staging is ok we tag, we need to bind the tag inside as we do for the sentry config
 * And we need to refresh the SRI config
 *
 * Here we get the version
 *  -> we take it from the commit of the previous commit as we're running on tag pipeline, so inside
 *     the current package.json we have the new version
 *
 * @param  {Boolean} isNewConfig Is it the new config we need to bind or not
 * @return {Object} {version}: <String>}
 */
const getConfigDeployGit = async (isNewConfig) => {
    if (!isNewConfig) {
        await fetchBranches();
        // Get vesion from the commit BEFORE the tag
        const { stdout: pkgMaster } = await bash('git show HEAD~1:package.json');
        const { version } = JSON.parse(pkgMaster);
        // Get version from what we deployed on develop
        const { version: versionDevelop } = await getPKGDevelopDeployed();
        return { version, versionDevelop };
    }

    const { version } = getPackage();
    return { version };
};

/**
 * Get the configuration for a deployement
 *     [Warning] you must have  NODE_ENV=production
 * @param  {Array} flags flags used to bundle
 * @return {Object}       app's config
 */
async function getNewConfig(api, flags = process.argv.slice(3), isCurrent = false) {
    debug({ api, flags, isCurrent }, 'flags getNewConfig');
    if (isWebClientLegacy()) {
        /**
         * Compat layer for old build as it binds dev API env instead of old :/
         * It doesn't make sense, but the main thing is we should upgrade the config setup on legacy
         * to match how it's done via proton-pack today for the react applications.
         * It will be easier to use than what we have today, build on top of obsolete config -> branches
         * so quick and dirty is the way sadly
         */
        const getBranch = () => {
            if (api.includes('old')) {
                return api.replace('+proxy', '');
            }
            return !isCurrent ? api.replace('+proxy', '') : 'dev';
        };

        const branch = getBranch();
        const cleanApi = (api) => {
            // When we deploy to these targets we must use the proxy api
            if (/prod|old|beta|tor/.test(api) && api.includes('+proxy')) {
                return (item) => item.replace(/\w+\+proxy/, 'proxy');
            }
            return (a) => a;
        };

        const { stdout = '' } = await bash('NODE_ENV=dist ./tasks/setupConfig.js', [
            '--print-config',
            `--branch deploy-${branch}`,
            ...flags.map(cleanApi(api)),
        ]);
        debug(stdout, 'stdout config angular');

        /*
            We need to rename the key sentry.sentry to sentry.dsn to match new config format from proton-pack
            because only Legacy Angular is with this weird format.
         */
        const { sentry = {}, ...json } = JSON.parse(stdout);
        const { sentry: dsn } = sentry;
        const newConfig = {
            ...json,
            sentry: {
                ...sentry,
                dsn,
            },
        };

        debug(newConfig, 'new config angular with right dsn');
        return newConfig;
    }

    // we don't use npx as for the CI we cached it so it's faster
    const { stdout = '' } = await bash('./node_modules/proton-pack/bin/protonPack print-config', flags);
    const deployConfig = await getConfigDeployGit(!isCurrent);
    debug({ stdout, deployConfig }, 'stdout config app');
    return {
        ...JSON.parse(stdout),
        deployConfig,
    };
}

function sed(rule, files) {
    // Because for the lulz. cf https://myshittycode.com/2014/07/24/os-x-sed-extra-characters-at-the-end-of-l-command-error/
    if (os.platform() === 'darwin') {
        return bash(`sed -i '' '${rule}' $(${files})`);
    }
    return bash(`sed -i '${rule}' "$(${files})"`);
}

async function writeNewConfig(api) {
    // Sentry does not exist for react application anymore.
    const {
        sentry: { dsn: currentSentryDSN } = {},
        secureUrl: currentSecureURL,
        deployConfig: { version: currentVersionDeploy, versionDevelop: currentVersionDeployFromDevelop } = {}, // no config for angular
    } = await getNewConfig(api, ['--api proxy'], true);
    const {
        apiUrl,
        sentry: { dsn: newSentryDSN } = {},
        secureUrl: newSecureURL,
        deployConfig: { version: newVersionDeploy } = {}, // no config for angular
    } = await getNewConfig(api);

    debug({
        current: {
            currentSentryDSN,
            currentSecureURL,
            currentVersionDeploy,
            currentVersionDeployFromDevelop,
        },
        newConfig: {
            newSentryDSN,
            newSecureURL,
            newVersionDeploy,
        },
    });

    if (isWebClientLegacy()) {
        await sed(`s#apiUrl:"/api"#apiUrl:"${apiUrl}"#;`, SOURCE_FILE_INDEX);
        info(`replace current api by ${apiUrl} inside the main index`);

        await sed(`s#sentry:"${currentSentryDSN}"#sentry:"${newSentryDSN}"#;`, SOURCE_FILE_INDEX);
        info('replace sentry config inside the main index');

        await sed(`s#secure:"${currentSecureURL}"#secure:"${newSecureURL}"#;`, SOURCE_FILE_INDEX);
        return info('replace secureURL config inside the main index');
    }

    // We don't have this use case for angular as we do not have this cache system
    if (!isWebClientLegacy()) {
        // First we try to replace the version from master
        await sed(`s#="${currentVersionDeploy}"#="${newVersionDeploy}"#;`, SOURCE_FILE_INDEX);
        info(
            `replace current deployed version ${currentVersionDeploy} by the one from the new tag ${newVersionDeploy} the main index`
        );

        // We try to replace the one from develop if we work on the bundle from develop we ship
        await sed(`s#="${currentVersionDeployFromDevelop}"#="${newVersionDeploy}"#;`, SOURCE_FILE_INDEX);
        info(
            `replace current deployed version ${currentVersionDeployFromDevelop} by the one from the new tag ${newVersionDeploy} the main index`
        );
    }

    await sed(`s#="/api"#="${apiUrl}"#;`, SOURCE_FILE_INDEX);
    info(`replace current api by ${apiUrl} inside the main index`);
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

    await writeNewConfig(api);

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
