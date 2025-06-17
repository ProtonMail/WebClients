import { config as dotenvConfig } from 'dotenv';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'node:path';
import webpack, { DefinePlugin } from 'webpack';

import getConfig from '@proton/pack/webpack.config';
import { addDevEntry, getIndexChunks } from '@proton/pack/webpack/entries';

dotenvConfig({ path: path.join(__dirname, '.env') });

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
            chunks: getIndexChunks('index'),
        })
    );

    config.plugins?.push(
        new DefinePlugin({
            'process.env.LIVEKIT_API_KEY': JSON.stringify(process.env.LIVEKIT_API_KEY),
            'process.env.LIVEKIT_API_SECRET': JSON.stringify(process.env.LIVEKIT_API_SECRET),
            'process.env.LIVEKIT_ROOM_KEY': JSON.stringify(process.env.LIVEKIT_ROOM_KEY),
            'process.env.LIVEKIT_DEFAULT_ROOM': JSON.stringify(process.env.LIVEKIT_DEFAULT_ROOM),
            'process.env.DEFAULT_NAME': JSON.stringify(process.env.DEFAULT_NAME),
            'process.env.EXPERIMENTAL_FACE_CROP': JSON.stringify(process.env.EXPERIMENTAL_FACE_CROP),
            'process.env.LIVEKIT_INCREASED_VIDEO_QUALITY': JSON.stringify(process.env.LIVEKIT_INCREASED_VIDEO_QUALITY),
            'process.env.LIVEKIT_DECREASED_VIDEO_QUALITY': JSON.stringify(process.env.LIVEKIT_DECREASED_VIDEO_QUALITY),
        })
    );

    if (env.appMode === 'standalone') {
        addDevEntry(config);
    }

    return {
        ...config,
        resolve: {
            ...config.resolve,
            extensions: ['.js', '.tsx', '.ts', '.wasm'],
            fallback: {
                ...config.resolve?.fallback,
                buffer: require.resolve('buffer'),
                path: require.resolve('path-browserify'),
            },
        },
        experiments: { asyncWebAssembly: true },
        plugins: [
            ...config.plugins,
            new webpack.ProvidePlugin({
                Buffer: [require.resolve('buffer'), 'Buffer'],
            }),
        ],
    };
};

export default result;
