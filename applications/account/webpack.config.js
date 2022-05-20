const HtmlWebpackPlugin = require('html-webpack-plugin');
const getConfig = require('@proton/pack/webpack.config');
const path = require('path');

module.exports = (...env) => {
    const config = getConfig(...env);
    const htmlIndex = config.plugins.findIndex((plugin) => {
        return plugin instanceof HtmlWebpackPlugin;
    });
    const htmlPlugin = config.plugins[htmlIndex];

    config.entry = {
        lite: [path.resolve('./src/lite/index.tsx'), require.resolve('@proton/shared/lib/browser/supported.js')],
        storage: path.resolve('./src/app/storage.ts'),
        ...config.entry,
    };

    config.devServer.historyApiFallback.rewrites = [{ from: /^\/lite/, to: '/lite.html' }];

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
            excludeChunks: ['storage', 'lite'],
            inject: 'body',
        })
    );
    // Add another webpack plugin on top
    config.plugins.splice(
        htmlIndex,
        0,
        new HtmlWebpackPlugin({
            filename: 'storage.html',
            template: path.resolve('./src/storage.ejs'),
            templateParameters: htmlPlugin.userOptions.templateParameters,
            scriptLoading: 'defer',
            chunks: ['storage'],
            inject: 'body',
        })
    );
    // Add another webpack plugin on top
    config.plugins.splice(
        htmlIndex,
        0,
        new HtmlWebpackPlugin({
            filename: 'lite.html',
            template: path.resolve('./src/lite.ejs'),
            templateParameters: htmlPlugin.userOptions.templateParameters,
            scriptLoading: 'defer',
            chunks: ['unsupported', 'lite'],
            inject: 'body',
        })
    );
    return config;
};
