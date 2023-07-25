process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

const WebpackDevServer = require('webpack-dev-server');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const webpack = require('webpack');

const fs = require('fs');
const path = require('path');
const createReloadRuntimeServer = require('./reload-runtime');
const createReduxDevTools = require('./redux-tools');
const parseEnvVar = require('./env-var.parser');

const config = require('../webpack.config');

const WEBPACK_DEV_PORT = parseEnvVar('WEBPACK_DEV_PORT', 1337, Number);
const REDUX_DEVTOOLS_PORT = parseEnvVar('REDUX_DEVTOOLS_PORT', 8000, Number);
const RUNTIME_RELOAD = parseEnvVar('RUNTIME_RELOAD', false, Boolean);
const HOT_MANIFEST_UPDATE = RUNTIME_RELOAD && parseEnvVar('HOT_MANIFEST_UPDATE', false, Boolean);

const EXCLUDED_WEBPACK_ENTRIES = [
    'authFallback',
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
                    `webpack-dev-server/client?hot=true&hostname=localhost&port=${WEBPACK_DEV_PORT}&protocol=wss:`,
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
    let devVersion = 0;

    if (RUNTIME_RELOAD) {
        const { reload } = createReloadRuntimeServer({ cert, key });
        compiler.hooks.afterEmit.tap('ProtonPassExtensionReloader', reload);

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
    }
};

main().catch((err) => {
    console.warn(err);
    process.exit(0);
});
