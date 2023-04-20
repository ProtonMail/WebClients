process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

const WebpackDevServer = require('webpack-dev-server');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const webpack = require('webpack');

const fs = require('fs');
const path = require('path');
const createReloadRuntimeServer = require('./dev:reload-runtime');
const createReduxDevTools = require('./dev:redux-tools');
const parseEnvVar = require('./env-var.parser');

const config = require('../webpack.config');

const WEBPACK_DEV_PORT = parseEnvVar('WEBPACK_DEV_PORT', 1337, Number);
const RUNTIME_RELOAD = parseEnvVar('RUNTIME_RELOAD', false, Boolean);
const REDUX_DEVTOOLS_PORT = parseEnvVar('REDUX_DEVTOOLS_PORT', 8000, Number);

const EXCLUDED_WEBPACK_ENTRIES = ['background', 'content', 'notification', 'dropdown'];

const sanitizeWebpackConfig = (config) => {
    /**
     * Only allow hot reloading capabilities for the pop-up
     * app while maintaining a "stale watch mode" for other
     * parts of the extension.
     */
    Object.keys(config.entry).forEach((entryName) => {
        if (!EXCLUDED_WEBPACK_ENTRIES.includes(entryName)) {
            const entries = [config.entry[entryName]].flat();
            config.entry[entryName] = [
                /* runtime code for hotmodule replacement */
                'webpack/hot/dev-server',
                /* dev-server client for web socket transport */
                `webpack-dev-server/client?hot=true&hostname=localhost&port=${WEBPACK_DEV_PORT}&protocol=wss:`,
                ...entries,
            ];
        }
    });

    /**
     * TODO: verify everything works correctly when
     * activating the getPlugins() helper from the parent
     * webpack.config.js
     */
    config.plugins = [new ReactRefreshWebpackPlugin({ overlay: false }), ...config.plugins];
    return config;
};

const compiler = webpack(sanitizeWebpackConfig(config));
const key = fs.readFileSync(path.resolve(__dirname, './localhost-key.pem')).toString();
const cert = fs.readFileSync(path.resolve(__dirname, './localhost.pem')).toString();

const server = new WebpackDevServer(
    {
        server: {
            type: 'https',
            options: { key, cert },
        },
        hot: true,
        client: false,
        liveReload: false,
        host: 'localhost',
        port: WEBPACK_DEV_PORT,
        static: { directory: path.join(__dirname, '../dist') },
        headers: { 'Access-Control-Allow-Origin': '*' },
        allowedHosts: 'all',
        devMiddleware: {
            publicPath: `https://localhost:${WEBPACK_DEV_PORT}`,
            writeToDisk: true,
        },
    },
    compiler
);

const main = async () => {
    await server.start();
    await createReduxDevTools({ key, cert, port: REDUX_DEVTOOLS_PORT });

    if (RUNTIME_RELOAD) {
        const { reload } = createReloadRuntimeServer({ cert, key });
        compiler.hooks.afterEmit.tap('ProtonPassExtensionReloader', reload);
    }
};

main().catch(() => process.exit(0));
