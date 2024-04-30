const path = require('path');
const plugins = require('./webpack.plugins');
const getCssLoaders = require('@proton/pack/webpack/css.loader');
const getAssetsLoaders = require('@proton/pack/webpack/assets.loader');
const { getJsLoaders } = require('@proton/pack/webpack/js.loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const isRelease = !!process.env.CI_COMMIT_TAG;
const env = {};

const options = {
    isProduction,
    isRelease,
    publicPath: env.publicPath || '/',
    api: env.api,
    appMode: env.appMode || 'standalone',
    featureFlags: env.featureFlags || '',
    writeSRI: env.writeSri !== 'false',
    browserslist: isProduction
        ? `> 0.5%, not IE 11, Firefox ESR, Safari 11`
        : 'last 1 chrome version, last 1 firefox version, last 1 safari version',
    buildData: {
        version: env.version,
        commit: env.commit,
        branch: env.branch,
        date: env.date,
        mode: env.appMode,
    },
    warningLogs: env.warningLogs || false,
    errorLogs: env.errorLogs || false,
    overlayWarnings: env.overlayWarnings || false,
    overlayErrors: env.overlayErrors || false,
    overlayRuntimeErrors: env.overlayRuntimeErrors || false,
    logical: env.logical || false,
};

/** @type {import('webpack').Configuration} */
module.exports = {
    target: `browserslist:${options.browserslist}`,
    mode: isProduction ? 'production' : 'development',
    bail: isProduction,
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    watchOptions: {
        ignored: /dist|node_modules|locales|\.(gif|jpeg|jpg|ico|png|svg)/,
        aggregateTimeout: 600,
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
        alias: {
            'proton-pass-web': path.resolve(__dirname, '../pass/src/'),
        },
    },
    module: {
        strictExportPresence: true,
        rules: [
            ...getJsLoaders({ ...options, hasReactRefresh: false }),
            ...getCssLoaders({ browserslist: undefined, logical: false }),
            ...getAssetsLoaders(),
        ],
    },
    plugins: [
        ...plugins,
        new ReactRefreshWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: 'styles/[name].css',
        }),
    ],
    experiments: {
        asyncWebAssembly: true,
    },
};
