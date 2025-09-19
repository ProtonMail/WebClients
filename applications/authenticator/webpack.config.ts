import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as path from 'path';
import { type Configuration, DefinePlugin } from 'webpack';
import 'webpack-dev-server';
import { parseResource } from 'webpack/lib/util/identifier';

import getAssetsLoaders from '@proton/pack/webpack/assets.loader';
import getCssLoaders from '@proton/pack/webpack/css.loader';
import { getJsLoaders } from '@proton/pack/webpack/js.loader.swc';

import { webpackOptions } from './webpack.options';

const isDevServer = Boolean(process.env.WEBPACK_SERVE);
const assetsFolder = 'assets/static';

const config: Configuration = {
    mode: webpackOptions.isProduction ? 'production' : 'development',
    entry: ['./src/app/main.tsx'],
    target: 'web',
    experiments: { asyncWebAssembly: true },
    devtool: webpackOptions.isProduction ? 'source-map' : 'cheap-module-source-map',
    devServer: {
        hot: !webpackOptions.isProduction,
        allowedHosts: 'all',
        compress: true,
        client: { overlay: false },
    },
    watchOptions: {
        ignored: /dist|node_modules|locales|\.(gif|jpeg|jpg|ico|png|svg)/,
        aggregateTimeout: 600,
    },
    module: {
        strictExportPresence: true, // Make missing exports an error instead of warning
        rules: [...getJsLoaders(webpackOptions), ...getCssLoaders(webpackOptions), ...getAssetsLoaders(webpackOptions)],
    },
    resolve: {
        alias: { 'proton-authenticator': path.resolve(__dirname, 'src/') },
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            crypto: false,
            buffer: false,
            stream: false,
            iconv: false,
            path: false,
            punycode: false,
        },
    },
    output: {
        filename: webpackOptions.isProduction
            ? `${assetsFolder}/[name].[contenthash:8].js`
            : `${assetsFolder}/[name].js`,
        publicPath: webpackOptions.publicPath,
        chunkFilename: (pathData) => {
            const result = webpackOptions.isProduction
                ? `${assetsFolder}/[name].[contenthash:8].chunk.js`
                : `${assetsFolder}/[name].chunk.js`;

            const chunkName = pathData?.chunk?.name;

            if (chunkName && (chunkName.startsWith('date-fns/') || chunkName.startsWith('locales/'))) {
                const strippedChunkName = chunkName.replaceAll(/-index-js|-json/g, '');
                return result.replace('[name]', strippedChunkName);
            }

            return result;
        },
        assetModuleFilename: (data) => {
            const { path: file } = parseResource(data?.filename || '');
            const ext = path.extname(file);
            const base = path.basename(file);
            const name = base.slice(0, base.length - ext.length);
            if (name.includes('.var')) {
                const replacedNamed = name.replace('.var', '-var');
                return `${assetsFolder}/${replacedNamed}.[hash][ext]`;
            }
            return `${assetsFolder}/[name].[hash][ext]`;
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            inject: true,
            minify: false,
        }),
        new MiniCssExtractPlugin({
            filename: `${assetsFolder}/[name].css`,
            chunkFilename: `${assetsFolder}/[name].css`,
        }),
        new DefinePlugin({
            /** ProtonConfigV2 (see `packages/pack/webpack/plugins.js`) */
            ...Object.fromEntries(
                Object.entries(webpackOptions.defineWebpackConfig).map(([key, value]) => [
                    `process.env.${key}`,
                    JSON.stringify(value),
                ])
            ),
            /** `QA_BUILD`: enables QA features for development and pre-release builds,
             * disables for production releases. CI sets this to "true"/"false" string,
             * default to `true` for local development */
            ['process.env.QA_BUILD']: JSON.stringify(
                process.env.QA_BUILD !== undefined ? process.env.QA_BUILD === 'true' : true
            ),
        }),
        ...(isDevServer ? [new ReactRefreshWebpackPlugin({ overlay: false })] : []),
    ],
};

export default config;
