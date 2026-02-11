import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import type { Configuration } from 'webpack';

import getAssetsLoaders from '@proton/pack/webpack/assets.loader';
import getCssLoaders from '@proton/pack/webpack/css.loader';
import { getJsLoaders } from '@proton/pack/webpack/js.loader.swc';

import { webpackOptions } from './webpack.options';
import plugins from './webpack.plugins';

const { browserslist, isProduction } = webpackOptions;

const config: Configuration = {
    target: `browserslist:${browserslist}`,
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
            ...getJsLoaders({ ...webpackOptions, hasReactRefresh: false }),
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
