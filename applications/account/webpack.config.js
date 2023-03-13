const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const getConfig = require('@proton/pack/webpack.config');

module.exports = (...env) => {
    const config = getConfig(...env);
    const htmlIndex = config.plugins.findIndex((plugin) => {
        return plugin instanceof HtmlWebpackPlugin;
    });
    const htmlPlugin = config.plugins[htmlIndex];

    config.entry = getConfig.mergeEntry(config.entry, {
        lite: [path.resolve('./src/lite/index.tsx'), require.resolve('@proton/shared/lib/supported/supported.ts')],
        storage: path.resolve('./src/app/storage.ts'),
    });

    config.devServer.historyApiFallback.rewrites = [{ from: /^\/lite/, to: '/lite.html' }];

    // We keep the order because the other plugins have an impact
    // Replace the old html webpackplugin with this
    config.plugins.splice(
        htmlIndex,
        1,
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve('./src/app.ejs'),
            templateParameters: {
                ...htmlPlugin.userOptions.templateParameters,
                appTitle: htmlPlugin.userOptions.templateParameters.appName,
            },
            scriptLoading: 'defer',
            excludeChunks: ['storage', 'lite'],
            inject: 'body',
        })
    );

    const pages = fs.readdirSync('./src/pages');

    pages.forEach((file) => {
        const parameters = require(`./src/pages/${file}`);

        const templateParameters = { ...htmlPlugin.userOptions.templateParameters, ...parameters };

        config.plugins.splice(
            htmlIndex,
            0,
            new HtmlWebpackPlugin({
                filename: file.replace('.json', '.html'),
                template: path.resolve(`./src/app.ejs`),
                templateParameters,
                scriptLoading: 'defer',
                excludeChunks: ['storage', 'lite'],
                inject: 'body',
            })
        );
    });

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
            chunks: ['pre', 'lite', 'unsupported'],
            inject: 'body',
        })
    );
    return config;
};
