import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

import getConfig from '@proton/pack/webpack.config';
import { addDevEntry, getIndexChunks } from '@proton/pack/webpack/entries';

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

    config.entry = Object.assign({}, config.entry, {
        ['urls-index']: [path.resolve('./src/app/urls.tsx')],
    });

    if (env.appMode === 'standalone') {
        addDevEntry(config);
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
            inject: true,
            chunks: getIndexChunks('index', true),
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
            inject: true,
            chunks: getIndexChunks('urls-index', true),
        })
    );

    if (config.devServer) {
        config.devServer.historyApiFallback = {
            rewrites: [
                {
                    from: /^\/urls/, // Matches any path starting with `/urls`
                    to: '/urls.html', // Serves `urls.html`
                },
                {
                    from: /./, // Matches any other route
                    to: '/index.html', // Serves `index.html`
                },
            ],
        };
    }

    if (config.module?.rules) {
        config.module?.rules.push({
            test: /\.wasm$/,
            type: 'webassembly/async',
        });
    }

    // Suppress the warning "Critical dependency: require function is used
    // in a way in which dependencies cannot be statically extracted" when
    // Upstream issue, which currently doesn't have a workaround.
    // https://github.com/catdad-experiments/libheif-js/issues/23
    if (!config.ignoreWarnings) {
        config.ignoreWarnings = [{ module: /libheif-js/ }];
    } else if (Array.isArray(config.ignoreWarnings)) {
        config.ignoreWarnings.push({ module: /libheif-js/ });
    }

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
            new CopyPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, '../../packages/raw-images/dist/dcraw.wasm'),
                        to: 'assets/static/dcraw.wasm',
                    },
                    {
                        from: path.resolve(__dirname, '../../packages/raw-images/dist/dcraw.js'),
                        to: 'assets/static/dcraw.js',
                    },
                ],
            }),
        ],
        experiments: {
            asyncWebAssembly: true,
        },
    };
};

export default result;
