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
const parseEnvVar = require('./tools/env-var.parser');

const SUPPORTED_TARGETS = ['chrome', 'firefox'];

const ENV = parseEnvVar('NODE_ENV', 'development', String);
const BUILD_TARGET = parseEnvVar('BUILD_TARGET', SUPPORTED_TARGETS[0], String);
const RUNTIME_RELOAD = parseEnvVar('RUNTIME_RELOAD', false, Boolean);
const RESUME_FALLBACK = parseEnvVar('RESUME_FALLBACK', false, Boolean);
const HOT_MANIFEST_UPDATE = RUNTIME_RELOAD && parseEnvVar('HOT_MANIFEST_UPDATE', false, Boolean);

if (!SUPPORTED_TARGETS.includes(BUILD_TARGET)) {
    throw new Error(`Build target "${BUILD_TARGET}" is not supported`);
}

const config = fs.readFileSync('./src/app/config.ts', 'utf-8').replaceAll(/(export const |;)/gm, '');

console.log(`ENV = ${ENV}`);
console.log(`BUILD_TARGET = ${BUILD_TARGET}`);
console.log(`RUNTIME_RELOAD = ${RUNTIME_RELOAD}`);
console.log(`RESUME_FALLBACK = ${RESUME_FALLBACK}`);
console.log(`HOT_MANIFEST_UPDATE = ${HOT_MANIFEST_UPDATE}`);
console.log(config);

const production = ENV === 'production';

const nonAccessibleWebResource = (entry) => [entry, './src/shared/extension/web-accessible-resource.ts'];
const noBrowserTrap = (entry) => [entry, './src/shared/extension/disable-browser-trap.ts'];

module.exports = {
    ...(production
        ? { mode: 'production', devtool: 'source-map' }
        : { mode: 'development', devtool: 'inline-source-map' }),
    entry: {
        background: {
            import: './src/worker/index.ts',
            filename: 'background.js',
            chunkLoading: 'import-scripts',
        },
        client: './src/content/client.ts',
        dropdown: nonAccessibleWebResource('./src/content/injections/apps/dropdown/index.tsx'),
        elements: './src/content/elements.ts',
        notification: nonAccessibleWebResource('./src/content/injections/apps/notification/index.tsx'),
        onboarding: './src/pages/onboarding/index.tsx',
        orchestrator: noBrowserTrap('./src/content/orchestrator.ts'),
        popup: nonAccessibleWebResource('./src/popup/index.tsx'),
        settings: './src/pages/settings/index.tsx',
        ...(BUILD_TARGET === 'firefox' ? { authFallback: noBrowserTrap('./src/content/firefox/index.ts') } : {}),
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
        }),
        new ESLintPlugin({
            extensions: ['js', 'ts'],
            overrideConfigFile: path.resolve(__dirname, '.eslintrc.js'),
        }),
        new MiniCssExtractPlugin({
            filename: 'styles/[name].css',
        }),
        new CopyPlugin({
            patterns: [{ from: 'public' }, { from: `manifest-${BUILD_TARGET}.json`, to: 'manifest.json' }],
        }),
    ],
};
