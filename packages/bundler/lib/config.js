const path = require('path');
const { bash } = require('./helpers/cli');
const extractArgument = require('./helpers/arguments');
const {
    customBundler: { tasks: customTasks, config: customConfig },
    getCustomHooks
} = require('./custom');
const { debug, about } = require('./helpers/log')('proton-bundler');

const PKG = require(path.join(process.cwd(), 'package.json'));

function getHooks() {
    return { customTasks, getCustomHooks };
}

/**
 * Get the API dest when we deploy.
 * You can use the custom config from proton.bundler.js to get it
 * @return {Promise<String>}
 */
async function getAPIUrl() {
    if (customConfig.apiUrl) {
        return customConfig.apiUrl;
    }

    const args = process.argv.slice(2);
    const { stdout } = await bash('npx proton-pack print-config', args);
    debug(stdout, 'print-config output');
    const [, url] = stdout.match(/apiUrl": "(.+)"(,*?)/);
    return url;
}

function getExternalFiles({ EXTERNAL_FILES = ['.htaccess'] } = customConfig) {
    return EXTERNAL_FILES;
}

async function get(argv) {
    const flowType = argv.flow;
    const appMode = argv.appMode;
    const isRemoteBuild = argv.source === 'remote';
    const branch = extractArgument(argv.branch) || '';
    const featureFlags = extractArgument(argv.featureFlags) || '';
    const isDeployGit = argv.git;
    const isOnlyDeployGit = argv['only-git'];
    debug({ customConfig, argv, branch }, 'configuration deploy');

    if (!branch && (isOnlyDeployGit || isDeployGit)) {
        throw new Error('You must define a branch name. --branch=XXX');
    }

    const apiUrl = !PKG.name.includes('-Static') ? await getAPIUrl() : '';

    process.env.NODE_ENV_BRANCH = branch;
    process.env.NODE_ENV_API = apiUrl;

    about({
        branch,
        isOnlyDeployGit,
        isDeployGit,
        ...(!isOnlyDeployGit && {
            appMode,
            apiUrl,
            isRemoteBuild,
            featureFlags,
            SENTRY: process.env.NODE_ENV_SENTRY
        })
    });

    return {
        branch,
        appMode,
        flowType,
        isDeployGit,
        isOnlyDeployGit,
        featureFlags,
        isRemoteBuild,
        apiUrl
    };
}

/**
 * Detect the old WebClient Angular
 * @return {Boolean}
 */
const isWebClientLegacy = () => {
    const { name } = PKG;
    return name === 'protonmail-web';
};

const getPackage = () => PKG;

const readCurrentRelease = () => {
    return require(path.join(process.cwd(), 'dist', 'assets', 'version.json'));
};

module.exports = {
    get,
    getHooks,
    getAPIUrl,
    getPackage,
    getExternalFiles,
    isWebClientLegacy,
    readCurrentRelease
};
