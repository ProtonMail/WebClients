const HtmlWebpackPlugin = require('html-webpack-plugin');
const getConfig = require('@proton/pack/webpack.config');
const path = require('path');

module.exports = (...env) => {
    const config = getConfig(...env);
    const htmlIndex = config.plugins.findIndex((plugin) => {
        return plugin instanceof HtmlWebpackPlugin;
    });
    config.entry.storage = path.resolve('./src/app/storage.ts');
    // We keep the order because the other plugins have an impact
    // Replace the old html webpackplugin with this
    config.plugins.splice(
        htmlIndex,
        1,
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve('./src/app.ejs'),
            scriptLoading: 'defer',
            excludeChunks: ['storage'],
        })
    );
    // Add another webpack plugin on top
    config.plugins.splice(
        htmlIndex,
        0,
        new HtmlWebpackPlugin({
            filename: 'storage.html',
            template: path.resolve('./src/storage.ejs'),
            scriptLoading: 'defer',
            chunks: ['storage'],
        })
    );
    return config;
};
