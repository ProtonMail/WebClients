const webpack = require('webpack');
const getConfig = require('@proton/pack/webpack.config');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * There are some specific references to Buffer in the drive application,
 * e.g. MimeTypes so it has to be polyfilled
 */
module.exports = (...env) => {
    const config = getConfig(...env);

    const htmlIndex = config.plugins.findIndex((plugin) => {
        return plugin instanceof HtmlWebpackPlugin;
    });
    const htmlPlugin = config.plugins[htmlIndex];

    config.plugins.splice(
        htmlIndex,
        1,
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'ejs-webpack-loader!src/app.ejs',
            templateParameters: htmlPlugin.userOptions.templateParameters,
            scriptLoading: 'defer',
            inject: 'body',
        })
    );

    config.plugins.splice(
        htmlIndex,
        0,
        new HtmlWebpackPlugin({
            filename: 'urls.html',
            template: `ejs-webpack-loader!src/urls.ejs`,
            templateParameters: htmlPlugin.userOptions.templateParameters,
            scriptLoading: 'defer',
            excludeChunks: ['index'],
            inject: 'body',
        })
    );

    return {
        ...config,
        entry: {
            urls: [path.resolve('./src/app/index.tsx'), require.resolve('@proton/shared/lib/browser/supported.js')],
            ...config.urls,
        },
        resolve: {
            ...config.resolve,
            extensions: ['.js', '.tsx', '.ts', '...'], // ... is there to include default extensions for proper building of type script web workers.
            fallback: {
                ...config.resolve.fallback,
                buffer: require.resolve('buffer'),
                path: require.resolve('path-browserify'),
            },
        },
        plugins: [
            ...config.plugins,
            new webpack.ProvidePlugin({
                Buffer: [require.resolve('buffer'), 'Buffer'],
            }),
        ],
    };
};
