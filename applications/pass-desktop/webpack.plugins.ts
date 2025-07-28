import { platform } from 'os';
import { DefinePlugin } from 'webpack';

import { webpackOptions } from './webpack.options';

export default [
    new DefinePlugin({
        /** ProtonConfigV2 (see `packages/pack/webpack/plugins.js`) */
        ...Object.fromEntries(
            Object.entries(webpackOptions.defineWebpackConfig).map(([key, value]) => [
                `process.env.${key}`,
                JSON.stringify(value),
            ])
        ),
        BUILD_TARGET: JSON.stringify(platform()),
        DESKTOP_BUILD: true,
        ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
        EXTENSION_BUILD: false,
        OFFLINE_SUPPORTED: true,
    }),
];
