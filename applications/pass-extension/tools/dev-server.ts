import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import path from 'path';
import type { Configuration, EntryObject } from 'webpack';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import config from '../webpack.config';
import createDebuggerServer from './debugger-server';
import envVars from './env';
import createReduxDevTools from './redux-tools';
import createReloadRuntimeServer from './reload-runtime';

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

const {
    WEBPACK_DEV_PORT,
    REDUX_DEVTOOLS_PORT,
    HOT_MANIFEST_UPDATE,
    RUNTIME_RELOAD,
    RUNTIME_RELOAD_PORT,
    HTTP_DEBUGGER,
} = envVars;

const EXCLUDED_WEBPACK_ENTRIES = [
    'account',
    'background',
    'client',
    'dropdown',
    'elements',
    'notification',
    'orchestrator',
    'webauthn',
];

const sanitizeWebpackConfig = (config: Configuration) => {
    const alias = config.resolve!.alias as Record<string, string>;
    /** In `@pmmmwh/react-refresh-webpack-plugin/client/ReactRefreshEntry.js`, the import of
     * `core-js-pure` introduces corejs polyfills which we aim to exclude when injecting into
     * content-scripts. Therefore, we are aliasing the import to prevent this behavior. */
    alias['core-js-pure/features/global-this'] = path.resolve(__dirname, './global-this.js');

    /* Only allow hot reloading capabilities for the pop-up
     * app while maintaining a "stale watch mode" for other
     * parts of the extension. */
    Object.keys(config.entry!).forEach((entryName) => {
        if (!EXCLUDED_WEBPACK_ENTRIES.includes(entryName)) {
            const entryObj = config.entry! as EntryObject;
            const entry = entryObj[entryName];

            if (typeof entry === 'string' || Array.isArray(entry)) {
                entryObj[entryName] = [
                    /* runtime code for hotmodule replacement */
                    'webpack/hot/dev-server',
                    /* dev-server client for web socket transport */
                    `webpack-dev-server/client?hot=true&hostname=localhost&port=${WEBPACK_DEV_PORT}&protocol=ws:`,
                    entry,
                ].flat();
            } else {
                const entryImport = entry.import;
                if (typeof entryImport === 'string' || Array.isArray(entryImport)) {
                    entry.import = [
                        /* runtime code for hotmodule replacement */
                        'webpack/hot/dev-server',
                        /* dev-server client for web socket transport */
                        `webpack-dev-server/client?hot=true&hostname=localhost&port=${WEBPACK_DEV_PORT}&protocol=ws:`,
                        entryImport,
                    ].flat();
                }
            }
        }
    });

    config.plugins = [new ReactRefreshWebpackPlugin({ overlay: false }), ...(config.plugins ?? [])];
    return config;
};

const devConfig = sanitizeWebpackConfig(config);
const compiler = webpack(devConfig);
if (!compiler) {
    throw new Error('webpack compiler is missing');
}

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

    if (HTTP_DEBUGGER) createDebuggerServer();

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
