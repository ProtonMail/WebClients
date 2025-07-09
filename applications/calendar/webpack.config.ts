import type { Configuration } from 'webpack';

import { type WebpackEnvArgumentsV2, getWebpackOptions } from '@proton/pack/lib/configV2';
import { addDevEntry, getConfigV2 } from '@proton/pack/webpack.config';

import appConfig from './appConfig';

const result = (opts: WebpackEnvArgumentsV2): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });
    const config = getConfigV2(webpackOptions);

    if (webpackOptions.appMode === 'standalone') {
        addDevEntry(config);
    }

    return config;
};

export default result;
