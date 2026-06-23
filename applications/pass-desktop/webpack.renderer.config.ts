import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import browserslist from 'browserslist';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import type { Configuration } from 'webpack';

import getAssetsLoaders from '@proton/pack/webpack/assets.loader';
import getCssLoaders from '@proton/pack/webpack/css.loader';
import { getJsLoaders } from '@proton/pack/webpack/js.loader.swc';

import { webpackOptions } from './webpack.options';
import plugins from './webpack.plugins';

const { isProduction } = webpackOptions;

// This renderer ships inside Electron, so it targets the bundled Chromium version
// (the [electron-applications] section of the root .browserslistrc) rather than the web matrix.
const browserslistEnv = 'electron-applications';
const browserslistQuery = browserslist(null, { env: browserslistEnv }).join(', ');

const config: Configuration = {
    target: `browserslist:${browserslistEnv}`,
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
            'proton-pass-desktop': path.resolve(__dirname, 'src/'),
        },
    },
    module: {
        strictExportPresence: true,
        rules: [
            ...getJsLoaders({ ...webpackOptions, browserslist: browserslistQuery, hasReactRefresh: false }),
            ...getCssLoaders({ browserslist: undefined, noLogicalScss: true }),
            ...getAssetsLoaders({ inlineIcons: true }),
        ],
    },
    plugins: [...plugins, new ReactRefreshWebpackPlugin(), new MiniCssExtractPlugin({ filename: 'styles/[name].css' })],
    experiments: {
        asyncWebAssembly: true,
    },
};

export default config;
