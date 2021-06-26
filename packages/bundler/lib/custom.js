const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const { success, debug } = require('./helpers/log')('proton-bundler');

const defaultHook = [];
const defaultCustom = {
    config: {},
    tasks() {},
};

/**
 * Allow custom extend of the deploy process via a config files
 * We will try to load the proton.bundler.js in the user's app dir
 * if there is one.
 * We will use it to extend our config
 *
 * Format:
 *     (argv) => {
 *
 *         const tasks = (deployConfig) => ({
 *             hookPreTasks: [...task]
 *             hookPostTasks: [...task]
 *             hookPostTaskClone: [...task]
 *             hookPostTaskBuild: [...task]
 *         });
 *
 *         const config = {
 *             EXTERNAL_FILES: [...<String>],
 *             apiUrl: <String>
 *         };
 *
 *         return { tasks, config };
 *     }
 *
 * deployConfig:
 *     - branch: branch's name
 *     - appMode: Type of app we build, standalone or bundle (default)
 *     -
 *     - flowType: Type of deploy ('single', or 'many')
 *     - EXTERNAL_FILES: List of assets to copy before the build
 *
 * context:
 *     - originCommit: Commit from where we create the deploy
 *     - originBranch: Branch from where we create the deploy
 *     - tag: Tag from where we deploy (usefull for prod)
 *
 *
 * @param  {Object} cfg Our own configuration
 * @return {Object}
 */
function loadCustomBundler(argv) {
    if (argv._.includes('hosts')) {
        return defaultCustom;
    }

    try {
        const fromUser = require(path.join(process.cwd(), 'proton.bundler.js'));
        success('Found proton.bundler.js, we can extend the deploy');

        if (fromUser.tasks && typeof fromUser.tasks !== 'function') {
            const msg = [
                '[proton-bundler] Error',
                'The custom config from proton.bundler.js must export a function, which returns { tasks: <Function>, config: <Object> }',
                '',
            ].join('\n');
            console.error(msg);
            process.exit(1);
        }

        return fromUser(argv);
    } catch (e) {
        debug(
            {
                'Error loading custom config': e,
            },
            'proton.bundler.js'
        );
        if (e.code !== 'MODULE_NOT_FOUND') {
            throw e;
        }
        return defaultCustom;
    }
}

function getCustomHooks(customConfig = {}) {
    return {
        customConfigSetup: defaultHook,
        hookPreTasks: defaultHook,
        hookPostTasks: defaultHook,
        hookPostTaskClone: defaultHook,
        hookPostTaskBuild: defaultHook,
        ...customConfig,
    };
}

module.exports = {
    customBundler: loadCustomBundler(argv),
    getCustomHooks,
};
