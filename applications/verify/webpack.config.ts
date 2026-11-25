import type { Configuration } from 'webpack';

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config';
import { getConfig } from '@proton/pack/webpack.config';
import { getReactResolve } from '@proton/pack/webpack/react';

import appConfig from './appConfig';

const result = (opts: WebpackEnvArguments): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });

    const config = getConfig({
        ...webpackOptions,
        browserslistEnv: webpackOptions.isProduction ? 'verify' : webpackOptions.browserslistEnv,
    });
    // Verify is on the `react19` catalog
    config.resolve = { ...config.resolve, ...getReactResolve(__dirname) };
    return config;
};

export default result;
