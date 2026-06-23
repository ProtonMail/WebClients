import type { Configuration } from 'webpack';

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config';
import { getConfig } from '@proton/pack/webpack.config';

import appConfig from './appConfig';

const result = (opts: WebpackEnvArguments): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });

    return getConfig({
        ...webpackOptions,
        browserslistEnv: webpackOptions.isProduction ? 'verify' : webpackOptions.browserslistEnv,
    });
};

export default result;
