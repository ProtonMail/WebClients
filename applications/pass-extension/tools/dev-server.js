process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

const WebpackDevServer = require('webpack-dev-server');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const webpack = require('webpack');

const path = require('path');
const createReloadRuntimeServer = require('./reload-runtime');
const createReduxDevTools = require('./redux-tools');

const config = require('../webpack.config');
const {
    WEBPACK_DEV_PORT,
    REDUX_DEVTOOLS_PORT,
    HOT_MANIFEST_UPDATE,
    RUNTIME_RELOAD,
    RUNTIME_RELOAD_PORT,
} = require('./env');

const EXCLUDED_WEBPACK_ENTRIES = [
    'account',
    'background',
    'client',
    'dropdown',
    'elements',
    'notification',
    'orchestrator',
];

const sanitizeWebpackConfig = (config) => {
    /**
     * Only allow hot reloading capabilities for the pop-up
     * app while maintaining a "stale watch mode" for other
     * parts of the extension.
     */
    Object.keys(config.entry).forEach((entryName) => {
        if (!EXCLUDED_WEBPACK_ENTRIES.includes(entryName)) {
            const entries = [config.entry[entryName]].flat();
            if (typeof config.entry[entryName] === 'string') {
                config.entry[entryName] = [
                    /* runtime code for hotmodule replacement */
                    'webpack/hot/dev-server',
                    /* dev-server client for web socket transport */
                    `webpack-dev-server/client?hot=true&hostname=localhost&port=${WEBPACK_DEV_PORT}&protocol=ws:`,
                    ...entries,
                ];
            }
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

const server = new WebpackDevServer(
    {
        hot: true,
        client: false,
        liveReload: false,
        host: 'localhost',
        port: WEBPACK_DEV_PORT,
        static: { directory: path.join(__dirname, '../dist') },
        headers: { 'Access-Control-Allow-Origin': '*' },
        allowedHosts: 'all',
        devMiddleware: {
            publicPath: `http://localhost:${WEBPACK_DEV_PORT}`,
            writeToDisk: true,
        },
    },
    compiler
);

const main = async () => {
    await server.start();
    await createReduxDevTools({ port: REDUX_DEVTOOLS_PORT });
    let devVersion = 0;

    if (RUNTIME_RELOAD) {
        const { reload } = createReloadRuntimeServer({ port: RUNTIME_RELOAD_PORT });
        compiler.hooks.afterEmit.tap('ProtonPassExtensionReloader', reload);
    }

    if (HOT_MANIFEST_UPDATE) {
        compiler.hooks.compilation.tap('ProtonPassUpdateManifest', (compilation) => {
            console.info(`[ProtonPassUpdateManifest] - Updating manifest version..`);
            compilation.hooks.processAssets.tap(
                {
                    name: 'ProtonPassUpdateManifest',
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
                },
                () => {
                    devVersion += 1;
                    const buffer = compilation.assets[`manifest.json`].source();
                    const source = buffer.toString('utf8');
                    const manifest = JSON.parse(source);
                    const version = `${manifest.version}.${devVersion}`;
                    manifest.version = version;

                    const newBuffer = Buffer.from(JSON.stringify(manifest), 'utf8');
                    compilation.updateAsset(`manifest.json`, new webpack.sources.RawSource(newBuffer));

                    console.info(`[ProtonPassUpdateManifest] - Updated manifest version to ${version}`);
                }
            );
        });
    }
};

main().catch((err) => {
    console.warn(err);
    process.exit(0);
});
