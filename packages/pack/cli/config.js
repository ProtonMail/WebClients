const path = require('path');
const { success, error } = require('./helpers/log');

/**
 * Load the config for webpack
 * We will try to load the proton.config.js in the user's app dir
 * if there is one.
 * We will use it to extend our config
 * @param  {Object} cfg Our own configuration
 * @return {Object}
 */
const loadUserConfig = (cfg) => {
    try {
        const fromUser = require(path.join(process.cwd(), 'proton.config.js'));

        if (typeof fromUser !== 'function') {
            const msg = [
                '[ProtonPack] Error',
                'The custom config from proton.config.js must export a function.',
                'This function takes one argument which is the webpack config.',
                ''
            ].join('\n');
            console.error(msg);
            process.exit(1);
        }

        const config = fromUser(cfg);
        success('Found proton.config.js, extend the config');
        return config;
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            return cfg;
        }
        error(e);
        return cfg;
    }
};

/**
 * format the config based on some options
 * - port: <Number> for the dev server
 * @param  {Object} options
 * @return {Object}         Webpack's config
 */
function main(options) {
    const defaultConfig = require('../webpack.config');
    const cfg = defaultConfig(options);
    return loadUserConfig(cfg);
}

module.exports = main;
