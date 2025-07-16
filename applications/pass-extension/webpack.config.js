const path = require('path');
const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const { sideEffectsRule, zipJSRule } = require('@proton/pass/utils/webpack/rules');
const getCssLoaders = require('@proton/pack/webpack/css.loader');
const getAssetsLoaders = require('@proton/pack/webpack/assets.loader');
const getOptimizations = require('@proton/pack/webpack/optimization');
const ProtonIconsTreeShakePlugin = require('@proton/pass/utils/webpack/icons/plugin');
const { excludeNodeModulesExcept, excludeFiles, createRegex } = require('@proton/pack/webpack/helpers/regex');
const { BABEL_EXCLUDE_FILES, BABEL_INCLUDE_NODE_MODULES } = require('@proton/pack/webpack/constants');
const fs = require('fs');

const {
    BETA,
    BUILD_TARGET,
    BUILD_STORE_TARGET,
    CLEAN_MANIFEST,
    ENV,
    HOT_MANIFEST_UPDATE,
    HTTP_DEBUGGER_PORT,
    HTTP_DEBUGGER,
    MANIFEST_KEY,
    REDUX_DEVTOOLS_PORT,
    RELEASE,
    RESUME_FALLBACK,
    RUNTIME_RELOAD_PORT,
    RUNTIME_RELOAD,
    WEBPACK_CIRCULAR_DEPS,
    WEBPACK_DEV_PORT,
} = require('./tools/env');

const SUPPORTED_TARGETS = ['chrome', 'firefox', 'safari'];

if (!SUPPORTED_TARGETS.includes(BUILD_TARGET)) {
    throw new Error(`Build target "${BUILD_TARGET}" is not supported`);
}

const CONFIG = fs.readFileSync('./src/app/config.ts', 'utf-8').replaceAll(/(export const |;)/gm, '');
const MANIFEST_KEYS = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'manifest-keys.json'), 'utf8'));
const PUBLIC_KEY = BUILD_TARGET === 'chrome' ? MANIFEST_KEYS?.[MANIFEST_KEY] : null;
const ARGON2_CHUNK_NAME = 'node_modules_openpgp_dist_lightweight_argon2id_min_mjs';

console.log(`ENV = ${ENV}`);
console.log(`RELEASE = ${RELEASE}`);
console.log(`BUILD_TARGET = ${BUILD_TARGET}`);
console.log(`BUILD_STORE_TARGET = ${BUILD_STORE_TARGET}`);
console.log(`BETA = ${BETA}`);
console.log(`MANIFEST_KEY = ${MANIFEST_KEY || 'none'}`);
console.log(`PUBLIC_KEY = ${PUBLIC_KEY || 'none'}`);
console.log(`CLEAN_MANIFEST = ${CLEAN_MANIFEST}`);
console.log(`HTTP_DEBUGGER = ${HTTP_DEBUGGER}`);

if (HTTP_DEBUGGER) console.log(`HTTP_DEBUGGER_PORT = ${HTTP_DEBUGGER_PORT}`);

if (ENV !== 'production') {
    console.log(`HOT_MANIFEST_UPDATE = ${HOT_MANIFEST_UPDATE}`);
    console.log(`REDUX_DEVTOOLS_PORT = ${REDUX_DEVTOOLS_PORT}`);
    console.log(`RESUME_FALLBACK = ${RESUME_FALLBACK}`);
    console.log(`RUNTIME_RELOAD = ${RUNTIME_RELOAD}`);
    console.log(`RUNTIME_RELOAD_PORT = ${RUNTIME_RELOAD_PORT}`);
    console.log(`WEBPACK_DEV_PORT = ${WEBPACK_DEV_PORT}`);
}

console.log(CONFIG);

const production = ENV === 'production';
const importScripts = BUILD_TARGET === 'chrome' || BUILD_TARGET === 'safari';
const manifest = `manifest-${BUILD_TARGET}.json`;
const manifestPath = path.resolve(__dirname, manifest);

const nonAccessibleWebResource = (entry) => [entry, './src/lib/utils/web-accessible-resource.ts'];
const disableBrowserTrap = (entry) => [entry, './src/lib/utils/disable-browser-trap.ts'];
const safariPatch = (entry) => (BUILD_TARGET === 'safari' ? [entry, './src/lib/utils/safari-patch.ts'] : entry);
const getManifestVersion = () => JSON.stringify(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).version);

const JS_EXCLUDES = createRegex(
    excludeNodeModulesExcept(BABEL_INCLUDE_NODE_MODULES),
    excludeFiles([...BABEL_EXCLUDE_FILES, 'pre.ts', 'unsupported.ts'])
);

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
            chunkLoading: importScripts ? 'import-scripts' : 'jsonp',
        },
        client: {
            import: './src/app/content/client.ts',
            layer: 'injection',
        },
        dropdown: nonAccessibleWebResource('./src/app/content/injections/apps/dropdown/index.tsx'),
        elements: {
            import: './src/app/content/elements.ts',
            layer: 'injection',
        },
        internal: './src/app/pages/internal/index.tsx',
        notification: nonAccessibleWebResource('./src/app/content/injections/apps/notification/index.tsx'),
        onboarding: './src/app/pages/onboarding/index.tsx',
        orchestrator: {
            import: disableBrowserTrap('./src/app/content/orchestrator.ts'),
            layer: 'injection',
        },
        popup: safariPatch('./src/app/popup/index.tsx'),
        settings: './src/app/pages/settings/index.tsx',

        ...(BUILD_TARGET !== 'safari'
            ? {
                  webauthn: {
                      /* Passkey handling not available in Safari */
                      import: './src/app/content/webauthn.ts',
                      layer: 'injection',
                  },
              }
            : {}),

        ...(BUILD_TARGET === 'firefox'
            ? {
                  external: {
                      /* FF account communication fallback */
                      import: disableBrowserTrap('./src/app/content/firefox/index.ts'),
                      layer: 'injection',
                  },
              }
            : {}),

        ...(BUILD_TARGET === 'safari'
            ? {
                  fork: {
                      /* Safari fork fallback */
                      import: disableBrowserTrap('./src/app/content/safari/index.ts'),
                      layer: 'injection',
                  },
              }
            : {}),
    },
    module: {
        strictExportPresence: true,
        rules: [
            sideEffectsRule,
            zipJSRule,
            {
                oneOf: [
                    {
                        test: /\.js$|\.tsx?$/,
                        issuerLayer: 'injection',
                        exclude: JS_EXCLUDES,
                        use: {
                            loader: require.resolve('babel-loader'),
                            options: { configFile: path.resolve(__dirname, 'babel.config.injection.js') },
                        },
                    },
                    {
                        test: /\.js$|\.tsx?$/,
                        exclude: JS_EXCLUDES,
                        use: require.resolve('babel-loader'),
                    },
                ],
            },

            ...getCssLoaders({ browserslist: undefined, logical: false }),
            ...getAssetsLoaders({ inlineIcons: true }),
        ],
    },
    optimization: {
        ...getOptimizations({ isProduction: production }),
        runtimeChunk: false,
        splitChunks: false,
        usedExports: true,
        chunkIds: 'named',
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
            ...(BUILD_TARGET === 'safari'
                ? /* exclude `webextension-polyfill` from safari build to avoid
                   * service-worker registration errors when worker fails. */
                  { 'webextension-polyfill': '@proton/pass/lib/globals/webextension-polyfill.stub.ts' }
                : {}),
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

        /** Some chunks need to be predictable in order for
         * importScripts to work properly in the context of
         * chromium builds (eg crypto lazy loaded modules) */
        chunkFilename: ({ chunk: { name, id } }) => {
            if (name === null) {
                if (id === ARGON2_CHUNK_NAME) return 'chunk.crypto-argon2.js';
                return 'chunk.[contenthash:8].js';
            }

            return 'chunk.[name].js';
        },
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        assetModuleFilename: 'assets/[hash][ext][query]',
        publicPath: '/',
    },
    plugins: [
        new webpack.EnvironmentPlugin({ NODE_ENV: ENV }),
        new webpack.DefinePlugin({
            BETA: JSON.stringify(BETA),
            BUILD_TARGET: JSON.stringify(BUILD_TARGET),
            BUILD_STORE_TARGET: JSON.stringify(BUILD_STORE_TARGET),
            DESKTOP_BUILD: false,
            ENV: JSON.stringify(ENV),
            EXTENSION_BUILD: true,
            HTTP_DEBUGGER_PORT,
            HTTP_DEBUGGER,
            OFFLINE_SUPPORTED: false,
            REDUX_DEVTOOLS_PORT,
            RESUME_FALLBACK,
            RUNTIME_RELOAD_PORT,
            RUNTIME_RELOAD,
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

                        if (PUBLIC_KEY) manifest.key = PUBLIC_KEY;

                        /* add the appropriate CSP policies for the development build to connect
                         * to unsecure ws:// protocols without firefox trying to upgrade it to
                         * wss:// - currently the redux cli tools do not support https */
                        if (ENV !== 'production' && BUILD_TARGET === 'firefox') {
                            manifest.content_security_policy = {
                                extension_pages:
                                    "connect-src 'self' https: ws:; script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; ",
                            };
                        }

                        /* sanitize manifest when building for production */
                        if (CLEAN_MANIFEST) {
                            switch (BUILD_TARGET) {
                                case 'firefox':
                                    manifest.content_scripts[1].matches = [
                                        'https://account.proton.me/*',
                                        'https://pass.proton.me/*',
                                    ];
                                    break;
                                case 'chrome':
                                    manifest.externally_connectable.matches = [
                                        'https://account.proton.me/*',
                                        'https://pass.proton.me/*',
                                    ];
                                    break;
                                case 'safari':
                                    manifest.content_scripts[1].matches = ['https://account.proton.me/*'];
                                    manifest.externally_connectable.matches = [
                                        'https://account.proton.me/*',
                                        'https://pass.proton.me/*',
                                    ];
                                    break;
                            }
                        }

                        if (BETA) {
                            manifest.name = 'Proton Pass (BETA)';
                            manifest.icons = {
                                16: '/assets/protonpass-beta-icon-16.png',
                                32: '/assets/protonpass-beta-icon-32.png',
                                48: '/assets/protonpass-beta-icon-48.png',
                                128: '/assets/protonpass-beta-icon-128.png',
                            };
                        }

                        return Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
                    },
                },
            ],
        }),
        ...(WEBPACK_CIRCULAR_DEPS
            ? [
                  new CircularDependencyPlugin({
                      exclude: /node_modules/,
                      include: /(packages\/pass|applications\/pass-extension)/,
                      failOnError: false,
                      allowAsyncCycles: false,
                      cwd: process.cwd(),
                  }),
              ]
            : []),
        ...(production
            ? [
                  new ProtonIconsTreeShakePlugin({
                      entries: ['dropdown', 'notification', 'onboarding', 'popup', 'settings', 'internal'],
                      excludeMimeIcons: true,
                  }),
              ]
            : []),
    ],
    experiments: {
        asyncWebAssembly: true,
        layers: true,
    },
};
