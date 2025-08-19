import type { Configuration } from 'webpack';

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config';
import { addDevEntry, getConfig } from '@proton/pack/webpack.config';

import appConfig from './appConfig';

const result = (opts: WebpackEnvArguments): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });
    const config = getConfig(webpackOptions);

    if (webpackOptions.appMode === 'standalone') {
        addDevEntry(config);
    }

    return config;
};

export default result;
