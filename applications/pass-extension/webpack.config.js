const path = require('path');
const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const getCssLoaders = require('@proton/pack/webpack/css.loader');
const getAssetsLoaders = require('@proton/pack/webpack/assets.loader');
const getOptimizations = require('@proton/pack/webpack/optimization');
const { excludeNodeModulesExcept, excludeFiles, createRegex } = require('@proton/pack/webpack/helpers/regex');
const { BABEL_EXCLUDE_FILES, BABEL_INCLUDE_NODE_MODULES } = require('@proton/pack/webpack/constants');
const fs = require('fs');

const {
    ENV,
    BUILD_TARGET,
    HOT_MANIFEST_UPDATE,
    RESUME_FALLBACK,
    RUNTIME_RELOAD,
    RUNTIME_RELOAD_PORT,
    REDUX_DEVTOOLS_PORT,
    WEBPACK_DEV_PORT,
    CLEAN_MANIFEST,
} = require('./tools/env');

const SUPPORTED_TARGETS = ['chrome', 'firefox'];

if (!SUPPORTED_TARGETS.includes(BUILD_TARGET)) {
    throw new Error(`Build target "${BUILD_TARGET}" is not supported`);
}

const config = fs.readFileSync('./src/app/config.ts', 'utf-8').replaceAll(/(export const |;)/gm, '');

console.log(`ENV = ${ENV}`);
console.log(`BUILD_TARGET = ${BUILD_TARGET}`);
console.log(`CLEAN_MANIFEST = ${CLEAN_MANIFEST}`);

if (ENV !== 'production') {
    console.log(`HOT_MANIFEST_UPDATE = ${HOT_MANIFEST_UPDATE}`);
    console.log(`REDUX_DEVTOOLS_PORT = ${REDUX_DEVTOOLS_PORT}`);
    console.log(`RESUME_FALLBACK = ${RESUME_FALLBACK}`);
    console.log(`RUNTIME_RELOAD = ${RUNTIME_RELOAD}`);
    console.log(`RUNTIME_RELOAD_PORT = ${RUNTIME_RELOAD_PORT}`);
    console.log(`WEBPACK_DEV_PORT = ${WEBPACK_DEV_PORT}`);
}

console.log(config);

const production = ENV === 'production';

const nonAccessibleWebResource = (entry) => [entry, './src/lib/utils/web-accessible-resource.ts'];
const disableBrowserTrap = (entry) => [entry, './src/lib/utils/disable-browser-trap.ts'];
const manifest = `manifest-${BUILD_TARGET}.json`;
const manifestPath = path.resolve(__dirname, manifest);
const getManifestVersion = () => JSON.stringify(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).version);

module.exports = {
    ...(production
        ? { mode: 'production', devtool: 'source-map' }
        : { mode: 'development', devtool: 'inline-source-map' }),
    entry: {
        background: {
            import: './src/app/worker/index.ts',
            filename: 'background.js',
            /* MV3 implementations of non-persistent background scripts change
             * depending on the platform. On chromium based browsers, we'll be
             * in a ServiceWorker environment whereas on FF it'll actually be a
             * non-persistent event page. One of the quirks of chunk loading in
             * a service-worker is that you have to register any imported script
             * during the service worker's oninstall phase (`/worker/index.ts`)
             * https://bugs.chromium.org/p/chromium/issues/detail?id=1198822#c10  */
            chunkLoading: BUILD_TARGET === 'chrome' ? 'import-scripts' : 'jsonp',
        },
        client: './src/app/content/client.ts',
        dropdown: nonAccessibleWebResource('./src/app/content/injections/apps/dropdown/index.tsx'),
        elements: './src/app/content/elements.ts',
        notification: nonAccessibleWebResource('./src/app/content/injections/apps/notification/index.tsx'),
        onboarding: './src/app/pages/onboarding/index.tsx',
        orchestrator: disableBrowserTrap('./src/app/content/orchestrator.ts'),
        popup: './src/app/popup/index.tsx',
        settings: './src/app/pages/settings/index.tsx',
        /* custom element styles */
        'styles.root': './src/app/content/injections/custom-elements/ProtonPassRoot.scss',
        'styles.control': './src/app/content/injections/custom-elements/ProtonPassControl.scss',
        /* FF account communication fallback */
        ...(BUILD_TARGET === 'firefox' ? { account: disableBrowserTrap('./src/app/content/firefox/index.ts') } : {}),
    },
    module: {
        strictExportPresence: true,
        rules: [
            {
                test: /\.js$|\.tsx?$/,
                exclude: createRegex(
                    excludeNodeModulesExcept(BABEL_INCLUDE_NODE_MODULES),
                    excludeFiles([...BABEL_EXCLUDE_FILES, 'pre.ts', 'unsupported.ts'])
                ),
                use: require.resolve('babel-loader'),
            },
            ...getCssLoaders({ browserslist: undefined, logical: false }),
            ...getAssetsLoaders(),
        ],
    },
    optimization: {
        ...getOptimizations({ isProduction: production }),
        runtimeChunk: false,
        splitChunks: undefined,
        usedExports: true,
    },
    resolve: {
        extensions: ['.js', '.tsx', '.ts'],
        fallback: {
            crypto: false,
            buffer: false,
            stream: false,
            iconv: false,
            path: false,
            punycode: false,
        },
        modules: [path.resolve(__dirname), 'node_modules'],
        alias: {
            'proton-pass-extension': path.resolve(__dirname, 'src/'),
            /* friends don't let friends publish code with `eval` : but that didn't stop `ttag`  */
            ttag$: path.resolve(__dirname, '../../node_modules/ttag/dist/ttag.min.js'),
        },
    },
    cache: {
        type: 'filesystem',
        cacheDirectory: path.resolve('./node_modules/.cache/webpack'),
        buildDependencies: {
            defaultWebpack: ['webpack/lib/'],
            config: [__filename],
        },
    },
    output: {
        filename: '[name].js',
        /* webpack can sometimes prefix chunks with an `_`
        which is disallowed in an extension's file. Force chunks
        to be prefixed correctly. This is mostly due to the presence
        of lazy loaded files in asmcrypto.js */
        chunkFilename: 'chunk.[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        assetModuleFilename: 'assets/[hash][ext][query]',
        publicPath: '/',
    },
    plugins: [
        new webpack.EnvironmentPlugin({ NODE_ENV: ENV }),
        new webpack.DefinePlugin({
            ENV: JSON.stringify(ENV),
            BUILD_TARGET: JSON.stringify(BUILD_TARGET),
            RUNTIME_RELOAD: RUNTIME_RELOAD,
            RESUME_FALLBACK: RESUME_FALLBACK,
            REDUX_DEVTOOLS_PORT: REDUX_DEVTOOLS_PORT,
            RUNTIME_RELOAD_PORT: RUNTIME_RELOAD_PORT,
            VERSION:
                ENV === 'production'
                    ? getManifestVersion()
                    : webpack.DefinePlugin.runtimeValue(getManifestVersion, true),
        }),
        new ESLintPlugin({
            extensions: ['js', 'ts'],
            overrideConfigFile: path.resolve(__dirname, '.eslintrc.js'),
        }),
        new MiniCssExtractPlugin({
            filename: 'styles/[name].css',
        }),
        new CopyPlugin({
            patterns: [
                { from: 'public' },
                {
                    from: manifest,
                    to: 'manifest.json',
                    transform(content) {
                        const data = content.toString('utf-8');
                        const manifest = JSON.parse(data);

                        /* add the appropriate CSP policies for the development build to connect
                         * to unsecure ws:// protocols without firefox trying to upgrade it to
                         * wss:// - currently the redux cli tools do not support https */
                        if (ENV !== 'production' && BUILD_TARGET === 'firefox') {
                            manifest.content_security_policy = {
                                extension_pages:
                                    "connect-src 'self' https: ws:; script-src 'self'; object-src 'self'; ",
                            };
                        }

                        /* sanitize manifest when building for production */
                        if (CLEAN_MANIFEST) {
                            switch (BUILD_TARGET) {
                                case 'firefox':
                                    manifest.content_scripts[1].matches = ['https://account.proton.me/*'];
                                    break;
                                case 'chrome':
                                    manifest.externally_connectable.matches = ['https://account.proton.me/*'];
                            }
                        }

                        return Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
                    },
                },
            ],
        }),
    ],
};
