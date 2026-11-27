import { config as dotenvConfig } from 'dotenv';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'node:path';
import webpack, { type Configuration, type Module } from 'webpack';

import type { WebpackEnvArguments } from '@proton/pack/lib/config';
import { getWebpackOptions } from '@proton/pack/lib/config';
import { addDevEntry, getConfig } from '@proton/pack/webpack.config';
import { getIndexChunks } from '@proton/pack/webpack/entries';

import appConfig from './appConfig';

dotenvConfig({ path: path.join(__dirname, '.env') });

const APP_STYLES_ENTRY = 'meet-styles';
const APP_STYLES = /[\\/]src[\\/]app[\\/]app\.scss$/;

const result = (opts: WebpackEnvArguments): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });
    const config = getConfig({ ...webpackOptions, ignoreCssOrderWarning: true });

    config.plugins = config.plugins || [];

    // app.scss gets its own stylesheet after every other one, so its overrides and utilities keep winning
    config.entry = {
        ...(config.entry as Record<string, string[]>),
        [APP_STYLES_ENTRY]: [path.join(__dirname, 'src/app/app.scss')],
    };

    const splitChunks = config.optimization?.splitChunks;
    if (!splitChunks) {
        throw new Error('Missing splitChunks optimization');
    }
    config.optimization = {
        ...config.optimization,
        splitChunks: {
            ...splitChunks,
            cacheGroups: {
                ...splitChunks.cacheGroups,
                // Route CSS stays in one initial stylesheet to keep the single bundle's cascade. Merging it makes
                // mini-css-extract warn about conflicting order, which `ignoreCssOrderWarning` silences without
                // changing the order
                styles: {
                    type: 'css/mini-extract',
                    name: 'styles',
                    chunks: 'all',
                    enforce: true,
                    test: (module: Module) => !APP_STYLES.test(module.nameForCondition() ?? ''),
                },
            },
        },
    };

    const htmlPlugin = config.plugins.find((plugin): plugin is HtmlWebpackPlugin => {
        return plugin instanceof HtmlWebpackPlugin;
    });
    if (!htmlPlugin) {
        throw new Error('Missing html plugin');
    }
    const htmlIndex = config.plugins.indexOf(htmlPlugin);

    config.plugins.splice(
        htmlIndex,
        1,
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve('./src/app.ejs'),
            templateParameters: htmlPlugin.userOptions.templateParameters,
            scriptLoading: 'defer',
            inject: 'body',
            chunks: [...getIndexChunks('index'), APP_STYLES_ENTRY],
        })
    );

    if (webpackOptions.appMode === 'standalone') {
        addDevEntry(config);
    }

    return {
        ...config,
        resolve: {
            ...config.resolve,
            extensions: ['.js', '.tsx', '.ts', '.wasm'],
            fallback: {
                ...config.resolve?.fallback,
                buffer: require.resolve('buffer'),
                path: require.resolve('path-browserify'),
            },
        },
        experiments: { asyncWebAssembly: true },
        plugins: [
            ...config.plugins,
            new webpack.ProvidePlugin({
                Buffer: [require.resolve('buffer'), 'Buffer'],
            }),
        ],
    };
};

export default result;
