import CopyWebpackPlugin from 'copy-webpack-plugin';
import { config as dotenvConfig } from 'dotenv';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'node:path';
import webpack, { type Configuration, DefinePlugin } from 'webpack';

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config';
import { addDevEntry, getConfig } from '@proton/pack/webpack.config';
import { getIndexChunks } from '@proton/pack/webpack/entries';

import appConfig from './appConfig';

dotenvConfig({ path: path.join(__dirname, '.env') });

const result = (opts: WebpackEnvArguments): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });
    const config = getConfig(webpackOptions);

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
            'process.env.LIVEKIT_ROOM_KEY': JSON.stringify(process.env.LIVEKIT_ROOM_KEY),
            'process.env.EXPERIMENTAL_FACE_CROP': JSON.stringify(process.env.EXPERIMENTAL_FACE_CROP),
            'process.env.LIVEKIT_INCREASED_VIDEO_QUALITY': JSON.stringify(process.env.LIVEKIT_INCREASED_VIDEO_QUALITY),
            'process.env.LIVEKIT_DECREASED_VIDEO_QUALITY': JSON.stringify(process.env.LIVEKIT_DECREASED_VIDEO_QUALITY),
        })
    );

    if (webpackOptions.appMode === 'standalone') {
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
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.dirname(require.resolve('@timephy/rnnoise-wasm')) + '/NoiseSuppressorWorklet.js',
                        to: 'assets/static/NoiseSuppressorWorklet.js',
                        toType: 'file',
                        transform(content) {
                            return content
                                .toString()
                                .replace(
                                    'import createRNNWasmModuleSync from "./generated/rnnoise-sync"',
                                    'import createRNNWasmModuleSync from "./rnnoise-sync.js"'
                                );
                        },
                    },
                    {
                        from: path.dirname(require.resolve('@timephy/rnnoise-wasm')),
                        to: ({ absoluteFilename }) => {
                            const fileName = path.basename(absoluteFilename || '');
                            if (fileName === 'NoiseSuppressorWorklet.js') {
                                return 'skip';
                            }
                            return `assets/static/${fileName}`;
                        },
                        toType: 'file',
                        filter: (resourcePath) => {
                            const fileName = path.basename(resourcePath);
                            return resourcePath.endsWith('.js') && fileName !== 'NoiseSuppressorWorklet.js';
                        },
                    },
                    {
                        from: path.dirname(require.resolve('@timephy/rnnoise-wasm')) + '/generated/rnnoise-sync.js',
                        to: 'assets/static/rnnoise-sync.js',
                        toType: 'file',
                    },
                ],
            }),
        ],
        module: {
            ...config.module,
            rules: [
                ...(config.module?.rules || []),
                {
                    test: /NoiseSuppressorWorklet.*\.js$/,
                    type: 'asset/resource',
                    parser: { parse: false },
                    generator: {
                        filename: 'assets/static/[name].[hash][ext]',
                    },
                    use: [
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: 'import createRNNWasmModuleSync from "./generated/rnnoise-sync"',
                                replace: 'import createRNNWasmModuleSync from "./rnnoise-sync.js"',
                            },
                        },
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: 'import "./polyfills"',
                                replace: 'import "./polyfills.js"',
                            },
                        },
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: 'import { leastCommonMultiple } from "./math"',
                                replace: 'import { leastCommonMultiple } from "./math.js"',
                            },
                        },
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: 'import RnnoiseProcessor from "./RnnoiseProcessor"',
                                replace: 'import RnnoiseProcessor from "./RnnoiseProcessor.js"',
                            },
                        },
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: 'NoiseSuppressorWorklet_Name',
                                replace: '"NoiseSuppressorWorklet"',
                            },
                        },
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: 'import { NoiseSuppressorWorklet_Name } from "./index";',
                                replace: '',
                            },
                        },
                    ],
                },
            ],
        },
    };
};

export default result;
