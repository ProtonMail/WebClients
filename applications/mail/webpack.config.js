const webpack = require('webpack');
const { produce, setAutoFreeze } = require('immer');
const getConfig = require('@proton/pack/webpack.config');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = (...env) => {
    setAutoFreeze(false);

    return produce(getConfig(...env), (config) => {
        config.resolve.fallback.buffer = require.resolve('buffer');
        config.plugins.push(
            new webpack.ProvidePlugin({
                // It's required by the lib rfc2047 which is used by mimemessage.js
                // Without it any mimemessage with an attachment including special char will fail
                Buffer: [require.resolve('buffer'), 'Buffer'],
            })
        );

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
        config.entry = getConfig.mergeEntry(config.entry, {
            eo: [path.resolve('./src/app/eo.tsx'), require.resolve('@proton/shared/lib/supported/supported.ts')],
        });

        config.devServer.historyApiFallback.rewrites = [{ from: /^\/eo/, to: '/eo.html' }];

        const htmlIndex = config.plugins.findIndex((plugin) => {
            return plugin instanceof HtmlWebpackPlugin;
        });
        const htmlPlugin = config.plugins[htmlIndex];

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
                excludeChunks: ['eo'],
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
                excludeChunks: ['index'],
                inject: 'body',
            })
        );
    });
};
