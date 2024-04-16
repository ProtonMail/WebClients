import HtmlWebpackPlugin from 'html-webpack-plugin';
import { produce, setAutoFreeze } from 'immer';
import path from 'path';
import { Configuration, ProvidePlugin } from 'webpack';
import { InjectManifest } from 'workbox-webpack-plugin';

import getConfig from '@proton/pack/webpack.config';
import { addDevEntry, getIndexChunks, getSupportedEntry, mergeEntry } from '@proton/pack/webpack/entries';

const result = (env: any): Configuration => {
    setAutoFreeze(false);

    return produce(getConfig(env), (config) => {
        config.plugins = config.plugins || [];
        config.resolve = config.resolve || {};
        config.resolve.fallback = config.resolve.fallback || {};

        // @ts-ignore
        config.resolve.fallback.buffer = require.resolve('buffer');
        config.plugins.push(
            new ProvidePlugin({
                // It's required by the lib rfc2047 which is used by mimemessage.js
                // Without it any mimemessage with an attachment including special char will fail
                Buffer: [require.resolve('buffer'), 'Buffer'],
            })
        );

        config.resolve.alias = {
            'proton-mail': path.resolve(__dirname, 'src/app/'),
            perf_hooks: path.resolve(__dirname, './perf_hooks_polyfill.ts'),
        };

        // if (config.mode !== 'development') {
        config.plugins.push(
            new InjectManifest({
                swSrc: './src/service-worker.js',
                swDest: 'service-worker.js',
                // Any other config if needed.
                maximumFileSizeToCacheInBytes: 10000000,
            })
        );
        // }

        // The order is important so that the unsupported file is loaded after
        config.entry = mergeEntry(config.entry, {
            eo: [path.resolve('./src/app/eo.tsx'), getSupportedEntry()],
        });

        // @ts-ignore
        config.devServer.historyApiFallback.rewrites = [{ from: /^\/eo/, to: '/eo.html' }];

        const htmlPlugin = config.plugins.find((plugin): plugin is HtmlWebpackPlugin => {
            return plugin instanceof HtmlWebpackPlugin;
        });
        if (!htmlPlugin) {
            throw new Error('Missing html plugin');
        }
        const htmlIndex = config.plugins.indexOf(htmlPlugin);

        if (env.appMode === 'standalone') {
            addDevEntry(config);
        }

        // We keep the order because the other plugins have an impact
        // Replace the old html webpackplugin with this
        config.plugins.splice(
            htmlIndex,
            1,
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: path.resolve('./src/app.ejs'),
                templateParameters: htmlPlugin.userOptions.templateParameters,
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
                filename: 'eo.html',
                template: path.resolve('./src/eo.ejs'),
                templateParameters: htmlPlugin.userOptions.templateParameters,
                scriptLoading: 'defer',
                chunks: getIndexChunks('eo'),
                inject: 'body',
            })
        );
    });
};

export default result;
