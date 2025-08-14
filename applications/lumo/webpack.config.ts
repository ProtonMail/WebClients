import type { Configuration } from 'webpack';

import { type WebpackEnvArgumentsV2, getWebpackOptions } from '@proton/pack/lib/configV2';
import { getConfigV2 } from '@proton/pack/webpack.config';
import { addDevEntry } from '@proton/pack/webpack/entries';

import appConfig from './appConfig';

const result = (opts: WebpackEnvArgumentsV2): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });
    const config = getConfigV2(webpackOptions);
    if (webpackOptions.appMode === 'standalone') {
        addDevEntry(config);
    }
    // @ts-ignore
    const scssRule = config.module.rules.find((rule) => rule.test.toString().includes('scss'));
    // @ts-ignore
    const postCssLoader = scssRule.use.find((use) => use.loader.includes('postcss-loader'));

    // Exclude all mock-related files from production builds
    if (webpackOptions.isProduction) {
        config.plugins = config.plugins || [];
        config.plugins.push(
            new (require('webpack').IgnorePlugin)({
                resourceRegExp: /[\\/](mocks|__mocks__)[\\/]|mockServiceWorker\.js$/,
            })
        );
    }

    // @ts-ignore
    config.module.rules.push({
        test: /\.worker$/,
        loader: 'file-loader',
        options: {
            // @ts-ignore
            outputPath(url, resourcePath, context) {
                return 'assets/';
            },
        },
    });
    //
    // // @ts-ignore
    // config.entry ??= {};
    // // @ts-ignore
    // config.entry['service-worker'] = './src/app/remote/service-worker/worker.ts';
    //
    // // @ts-ignore
    // config.output ??= {};
    // config.output.filename = (pathData) => {
    //     // @ts-ignore
    //     if (pathData.chunk.name === 'service-worker') {
    //         return 'service-worker.js';
    //     }
    //     return '[name].[contenthash].js';
    // };
    //
    return config;
};

export default result;
