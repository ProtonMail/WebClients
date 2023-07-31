import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

import getConfig from '@proton/pack/webpack.config';

/**
 * There are some specific references to Buffer in the drive application,
 * e.g. MimeTypes so it has to be polyfilled
 */
const result = (env: any): webpack.Configuration => {
    const config = getConfig(env);

    config.plugins = config.plugins || [];

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
            inject: 'body',
        })
    );

    return {
        ...config,
        resolve: {
            ...config.resolve,
            extensions: ['.js', '.tsx', '.ts', '...'], // ... is there to include default extensions for proper building of type script web workers.
            fallback: {
                ...config.resolve?.fallback,
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

export default result;
