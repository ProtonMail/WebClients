import { resolve as resolvePath } from 'path';

export default [
    // Add support for native node modules
    {
        // We're specifying native_modules in the test because the asset relocator loader generates a
        // "fake" .node file which is really a cjs file.
        test: /native_modules[/\\].+\.node$/,
        use: 'node-loader',
    },
    {
        test: /\.(m?js|node)$/,
        parser: { amd: false },
        use: {
            loader: '@vercel/webpack-asset-relocator-loader',
            options: {
                outputAssetBase: 'native_modules',
                // debugLog: true,
            },
        },
    },
    {
        test: /\.tsx?$/,
        exclude: /(node_modules\/(?!.*(@protontech\/crypto))|\.webpack)/,
        use: {
            loader: 'ts-loader',
            options: {
                /**
                 * An absolute path is needed here so that ts-loader sticks to this
                 * tsconfig file even for any TS entrypoing (incl. the TS node_modules).
                 * With just a filename, it expects and loads the tsconfig relative to
                 * each module's entrypoint otherwise.
                 * See https://github.com/TypeStrong/ts-loader#configfile
                 */
                configFile: resolvePath('tsconfig.json'),
                transpileOnly: true,
            },
        },
    },
];
