import type { Configuration } from 'webpack';

import { type WebpackEnvArgumentsV2, getWebpackOptions } from '@proton/pack/lib/configV2';
import { getConfigV2 } from '@proton/pack/webpack.config';

import appConfig from './appConfig';

const result = (opts: WebpackEnvArgumentsV2): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });

    return getConfigV2({
        ...webpackOptions,
        browserslist: webpackOptions.isProduction
            ? '>0.1%, IE 11, Firefox ESR, Safari 10, Chrome 50'
            : webpackOptions.browserslist,
    });
};

export default result;
