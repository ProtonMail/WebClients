import CircularDependencyPlugin from 'circular-dependency-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import fs from 'fs';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import type { Configuration } from 'webpack';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import getAssetsLoaders from '@proton/pack/webpack/assets.loader';
import getCssLoaders from '@proton/pack/webpack/css.loader';
import { getJsLoader } from '@proton/pack/webpack/js.loader.swc.js';
import getOptimizations from '@proton/pack/webpack/optimization';
import ProtonIconsTreeShakePlugin from '@proton/pass/utils/webpack/icons/plugin';
import { coreJsUint8ArrayFromBase64Rule, sideEffectsRule, zipJSRule } from '@proton/pass/utils/webpack/rules';

import envVars from './tools/env';
import { MANIFEST_PATH, getAppVersion, webpackOptions } from './webpack.options';

const {
    API_ENV,
    BETA,
    BUILD_TARGET,
    BUILD_STORE_TARGET,
    E2E_TESTS,
    ENV,
    HOT_MANIFEST_UPDATE,
    HTTP_DEBUGGER_PORT,
    HTTP_DEBUGGER,
    MANIFEST_KEY,
    REDUX_DEVTOOLS,
    REDUX_DEVTOOLS_PORT,
    RELEASE,
    RESUME_FALLBACK,
    RUNTIME_RELOAD_PORT,
    RUNTIME_RELOAD,
    WEBPACK_CIRCULAR_DEPS,
    WEBPACK_BUNDLE_ANALYZER,
    WEBPACK_DEV_PORT,
} = envVars;

if (!['chrome', 'firefox', 'safari'].includes(BUILD_TARGET)) {
    throw new Error(`Build target "${BUILD_TARGET}" is not supported`);
}

const MANIFEST_KEYS = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'manifest-keys.json'), 'utf8'));
const PUBLIC_KEY = BUILD_TARGET === 'chrome' ? MANIFEST_KEYS?.[MANIFEST_KEY] : null;
const ARGON2_CHUNK_NAMES = ['node_modules_openpgp_dist_lightweight_argon2id_min_mjs', 'vendor_argon2id_loader_ts'];
const NACL_CHUNK_NAME = 'node_modules_openpgp_dist_lightweight_nacl-fast_min_mjs';
const PQC_CHUNK_NAME = 'node_modules_openpgp_dist_lightweight_noble_post_quantum_min_mjs';

const section = (title: string, content: () => void) => {
    const width = process.stdout.columns || 80;
    const sep = '-'.repeat(width);
    console.log(`${sep}\n ${title}\n${sep}`);
    content();
    console.log(`${sep}\n`);
};

section('Build configuration', () => {
    console.log(` ENV = ${ENV}`);
    console.log(` API_ENV=${API_ENV}`);
    console.log(` RELEASE = ${RELEASE}`);
    console.log(` BUILD_TARGET = ${BUILD_TARGET}`);
    console.log(` BUILD_STORE_TARGET = ${BUILD_STORE_TARGET}`);
    console.log(` BETA = ${BETA}`);
    console.log(` MANIFEST_KEY = ${MANIFEST_KEY || 'none'}`);
    console.log(` MANIFEST_VERSION = ${JSON.parse(getAppVersion())}`);
    console.log(` PUBLIC_KEY = ${PUBLIC_KEY || 'none'}`);
    console.log(` HTTP_DEBUGGER = ${HTTP_DEBUGGER}`);

    if (HTTP_DEBUGGER) console.log(` HTTP_DEBUGGER_PORT = ${HTTP_DEBUGGER_PORT}`);

    if (ENV !== 'production') {
        console.log(` HOT_MANIFEST_UPDATE = ${HOT_MANIFEST_UPDATE}`);
        console.log(` REDUX_DEVTOOLS = ${REDUX_DEVTOOLS}`);
        console.log(` REDUX_DEVTOOLS_PORT = ${REDUX_DEVTOOLS_PORT}`);
        console.log(` RESUME_FALLBACK = ${RESUME_FALLBACK}`);
        console.log(` RUNTIME_RELOAD = ${RUNTIME_RELOAD}`);
        console.log(` RUNTIME_RELOAD_PORT = ${RUNTIME_RELOAD_PORT}`);
        console.log(` WEBPACK_DEV_PORT = ${WEBPACK_DEV_PORT}`);
    }
});

section('Proton Configuration', () => {
    const configLock = fs.existsSync('./config.lock.json')
        ? fs.readFileSync('./config.lock.json', { encoding: 'utf-8' })
        : null;

    if (configLock) {
        console.log(' ⚠️ Using `config.lock.json` override\n');
        webpackOptions.defineWebpackConfig = JSON.parse(configLock);
    }

    Object.entries(webpackOptions.defineWebpackConfig).forEach(([key, value]) => {
        if (typeof value === 'object') console.log(` ${key} = ${Object.values(value)}`);
        else console.log(` ${key} = ${value}`);
    });
});

const USE_IMPORT_SCRIPTS = BUILD_TARGET === 'chrome' || BUILD_TARGET === 'safari';
const CHROME_STORE_RELEASE = BUILD_TARGET === 'chrome' && BUILD_STORE_TARGET !== 'edge';

const hasReactRefresh = !webpackOptions.isProduction && !RUNTIME_RELOAD;

/** Disables corejs polyfills in injected scripts */
const scriptJSLoader = getJsLoader({ ...webpackOptions, hasReactRefresh: false });
scriptJSLoader.use.options.env = {};

/** Force "usage" mode for other extension components */
const appJSLoader = getJsLoader({ ...webpackOptions, hasReactRefresh });
appJSLoader.use.options.env.mode = 'usage';
appJSLoader.use.options.env.shippedProposals = false;
appJSLoader.use.options.env.include = [
    'esnext.uint8-array.from-base64',
    'esnext.uint8-array.from-hex',
    'esnext.uint8-array.set-from-hex',
    'esnext.uint8-array.set-from-base64',
    'esnext.uint8-array.to-base64',
    'esnext.uint8-array.to-hex',
];

const layeredJSLoaders = { oneOf: [{ issuerLayer: 'injection', ...scriptJSLoader }, appJSLoader] };

const nonAccessibleWebResource = (entry: string) => [entry, './src/lib/utils/web-accessible-resource.ts'];
const disableBrowserTrap = (entry: string) => [entry, './src/lib/utils/disable-browser-trap.ts'];
const safariPatch = (entry: string) => (BUILD_TARGET === 'safari' ? [entry, './src/lib/utils/safari-patch.ts'] : entry);

const config: Configuration = {
    ...(webpackOptions.isProduction
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
            chunkLoading: USE_IMPORT_SCRIPTS ? 'import-scripts' : 'jsonp',
        },
        client: {
            import: './src/app/content/client.ts',
            layer: 'injection',
        },
        dropdown: nonAccessibleWebResource('./src/app/content/services/inline/dropdown/app/index.tsx'),
        elements: {
            import: './src/app/content/elements.ts',
            layer: 'injection',
        },
        internal: './src/app/pages/internal/index.tsx',
        notification: nonAccessibleWebResource('./src/app/content/services/inline/notification/app/index.tsx'),
        onboarding: './src/app/pages/onboarding/index.tsx',
        orchestrator: {
            import: disableBrowserTrap('./src/app/content/orchestrator.ts'),
            layer: 'injection',
        },
        popup: safariPatch('./src/app/popup/index.tsx'),
        settings: './src/app/pages/settings/index.tsx',
        webauthn: {
            import: './src/app/content/webauthn.ts',
            layer: 'injection',
        },
        offscreen: './src/app/worker/offscreen/offscreen.ts',

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
            layeredJSLoaders,
            ...(BUILD_TARGET === 'safari' ? [coreJsUint8ArrayFromBase64Rule] : []),
            ...getCssLoaders({ browserslist: undefined, noLogicalScss: true }),
            ...getAssetsLoaders({ inlineIcons: true }),
        ],
    },
    optimization: {
        ...getOptimizations(webpackOptions),
        runtimeChunk: false,
        splitChunks: {
            cacheGroups: {
                default: false,
                defaultVendors: false,
                corejs: {
                    test: /[\\/]node_modules[\\/]core-js[\\/]/,
                    name: 'polyfills',
                    /** Keep polyfills inlined in service-worker */
                    chunks: (chunk) => chunk.canBeInitial() && chunk.name !== 'background',
                    priority: 10,
                },
            },
        },
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

            /** Patch openpgp argon2id.min.mjs to avoid WASM base64 inlining
             * which gets flagged as code-obfuscation on chrome store review */
            ...(CHROME_STORE_RELEASE
                ? { './argon2id.min.mjs': path.resolve(__dirname, 'vendor/argon2id.loader.ts') }
                : {}),
        },
    },
    output: {
        filename: '[name].js',
        webassemblyModuleFilename: 'assets/wasm/[hash].wasm',
        /** Some chunks need to be predictable in order for
         * importScripts to work properly in the context of
         * chromium builds (eg crypto lazy loaded modules) */
        chunkFilename: ({ chunk }) => {
            if (!chunk?.name) {
                if (chunk?.id && ARGON2_CHUNK_NAMES.includes(chunk.id.toString())) return 'chunk.crypto-argon2.js';
                if (chunk?.id && NACL_CHUNK_NAME === chunk.id.toString()) return 'chunk.crypto-nacl.js';
                if (chunk?.id && PQC_CHUNK_NAME === chunk.id.toString()) return 'chunk.crypto-pqc.js';

                return 'chunk.[contenthash:8].js';
            }

            return 'chunk.[name].js';
        },
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        assetModuleFilename: (asset) => {
            if (asset.filename && /\.wasm$/.test(asset.filename)) return 'assets/wasm/[hash].wasm';
            return 'assets/[hash][ext][query]';
        },
        publicPath: '/',
    },
    plugins: [
        new webpack.EnvironmentPlugin({ NODE_ENV: ENV }),
        new webpack.DefinePlugin({
            /** ProtonConfigV2 (see `packages/pack/webpack/plugins.js`) */
            ...Object.fromEntries(
                Object.entries(webpackOptions.defineWebpackConfig).map(([key, value]) => [
                    `process.env.${key}`,
                    JSON.stringify(value),
                ])
            ),
            BETA: JSON.stringify(BETA),
            BUILD_TARGET: JSON.stringify(BUILD_TARGET),
            BUILD_STORE_TARGET: JSON.stringify(BUILD_STORE_TARGET),
            DESKTOP_BUILD: false,
            E2E_TESTS,
            ENV: JSON.stringify(ENV),
            EXTENSION_BUILD: true,
            HTTP_DEBUGGER_PORT,
            HTTP_DEBUGGER,
            OFFLINE_SUPPORTED: false,
            REDUX_DEVTOOLS,
            REDUX_DEVTOOLS_PORT,
            RESUME_FALLBACK,
            RUNTIME_RELOAD_PORT,
            RUNTIME_RELOAD,
            VERSION: webpackOptions.isProduction
                ? getAppVersion()
                : webpack.DefinePlugin.runtimeValue(getAppVersion, true),
        }),
        new MiniCssExtractPlugin({ filename: 'styles/[name].css' }),
        new CopyPlugin({
            patterns: [
                { from: 'public' },
                {
                    from: MANIFEST_PATH,
                    to: 'manifest.json',
                    transform(content) {
                        const data = content.toString('utf-8');
                        const manifest = JSON.parse(data);

                        if (PUBLIC_KEY) manifest.key = PUBLIC_KEY;

                        /* sanitize manifest when building for production */
                        switch (BUILD_TARGET) {
                            case 'firefox':
                                /* add the appropriate CSP policies for the development build to connect
                                 * to unsecure ws:// protocols without firefox trying to upgrade it to
                                 * wss:// - currently the redux cli tools do not support https */
                                if (ENV !== 'production') {
                                    manifest.content_security_policy = {
                                        extension_pages:
                                            "connect-src 'self' https: ws:; script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; ",
                                    };
                                }

                                manifest.content_scripts[1].matches = [
                                    `https://account.${API_ENV}/*`,
                                    `https://pass.${API_ENV}/*`,
                                ];
                                break;
                            case 'chrome':
                                manifest.externally_connectable.matches = [
                                    `https://account.${API_ENV}/*`,
                                    `https://pass.${API_ENV}/*`,
                                ];
                                break;
                            case 'safari':
                                manifest.content_scripts[1].matches = [`https://account.${API_ENV}/*`];
                                manifest.externally_connectable.matches = [
                                    `https://account.${API_ENV}/*`,
                                    `https://pass.${API_ENV}/*`,
                                ];
                                break;
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
        ...(WEBPACK_BUNDLE_ANALYZER ? [new BundleAnalyzerPlugin({ generateStatsFile: true })] : []),
        ...(webpackOptions.isProduction
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

export default config;
