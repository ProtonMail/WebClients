import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import type { Configuration } from 'webpack';

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config';
import { addDevEntry, getConfig } from '@proton/pack/webpack.config';
import { getIndexChunks, getSupportedEntry, mergeEntry } from '@proton/pack/webpack/entries';

import appConfig from './appConfig';

const result = (opts: WebpackEnvArguments): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });
    const config = getConfig(webpackOptions);
    config.plugins = config.plugins || [];

    if (webpackOptions.appMode === 'standalone') {
        addDevEntry(config);
    }

    // The order is important so that the unsupported file is loaded after
    config.entry = mergeEntry(config.entry, {
        ['bookings-index']: [path.resolve('./src/app/bookings.tsx'), getSupportedEntry()],
    });

    const htmlPlugin = config.plugins.find((plugin): plugin is HtmlWebpackPlugin => {
        return plugin instanceof HtmlWebpackPlugin;
    });
    if (!htmlPlugin) {
        throw new Error('Missing html plugin');
    }

    const templateParameters = {
        ...htmlPlugin.userOptions.templateParameters,
        defineWebpackConfig: JSON.stringify(webpackOptions.defineWebpackConfig),
    };

    const htmlIndex = config.plugins.indexOf(htmlPlugin);

    config.plugins.splice(
        htmlIndex,
        1,
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve('./src/app.ejs'),
            templateParameters,
            scriptLoading: 'defer',
            chunks: getIndexChunks('index'),
            inject: 'body',
        })
    );
    // Add another webpack plugin on top
    config.plugins.splice(
        htmlIndex,
        0,
        new HtmlWebpackPlugin({
            filename: 'bookings.html',
            template: path.resolve('./src/bookings.ejs'),
            templateParameters,
            scriptLoading: 'defer',
            chunks: getIndexChunks('bookings-index'),
            inject: 'body',
        })
    );

    if (config.devServer) {
        config.devServer.historyApiFallback = {
            rewrites: [
                {
                    from: /^\/u\/[0-9]+\/bookings/, // Matches `/u/X/bookings`
                    to: '/bookings.html', // Serves `bookings.html`
                },
                {
                    from: /^\/bookings/, // Matches any path starting with `/bookings`
                    to: '/bookings.html', // Serves `bookings.html`
                },
            ],
        };
    }

    return config;
};

export default result;
